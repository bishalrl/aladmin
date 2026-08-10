import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { auditLogService } from "@/services/AuditLogService";

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export class ApiKeyService {
  async list() {
    return prisma.apiKey.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        projectId: true,
        project: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async create(
    data: { name: string; projectId?: string | null; expiresAt?: string | null },
    adminId?: string,
    ip?: string,
  ) {
    const raw = `cap_${randomBytes(24).toString("hex")}`;
    const keyHash = hashKey(raw);
    const keyPrefix = raw.slice(0, 12);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: data.name,
        projectId: data.projectId || null,
        keyHash,
        keyPrefix,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    await auditLogService.log({
      adminId,
      action: "api_key.created",
      resourceType: "api_key",
      resourceId: apiKey.id,
      projectId: apiKey.projectId,
      ipAddress: ip,
      metadata: { name: apiKey.name, keyPrefix },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      // Shown once only
      apiKey: raw,
    };
  }

  async revoke(id: string, adminId?: string, ip?: string) {
    const existing = await prisma.apiKey.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError("API key not found", "API_KEY_NOT_FOUND", 404);

    await prisma.apiKey.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    await auditLogService.log({
      adminId,
      action: "api_key.revoked",
      resourceType: "api_key",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });
  }

  async validate(rawKey: string | null): Promise<boolean> {
    const requireKey = process.env.PUBLIC_API_REQUIRE_KEY === "true";
    if (!requireKey) return true;
    if (!rawKey) return false;

    const keyHash = hashKey(rawKey);
    const record = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!record) return false;

    await prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }
}

export const apiKeyService = new ApiKeyService();
