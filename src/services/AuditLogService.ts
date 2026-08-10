import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export type AuditInput = {
  adminId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  projectId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
};

export class AuditLogService {
  async log(input: AuditInput) {
    return prisma.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        projectId: input.projectId ?? null,
        metadata: input.metadata ?? undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  }

  async list(params: { page?: number; limit?: number; projectId?: string }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.projectId ? { projectId: params.projectId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          admin: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}

export const auditLogService = new AuditLogService();
