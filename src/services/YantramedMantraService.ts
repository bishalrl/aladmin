import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { storageService } from "@/lib/storage/StorageService";
import { auditLogService } from "@/services/AuditLogService";
import { projectService } from "@/services/ProjectService";

const PROJECT_SLUG = "yantramed";

export class YantramedMantraService {
  async list() {
    const project = await projectService.getBySlug(PROJECT_SLUG);
    const items = await prisma.yantramedMantra.findMany({
      where: { projectId: project.id, deletedAt: null },
      include: {
        yantra: { select: { id: true, name: true, slug: true, focus: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return items.map((m) => ({
      ...m,
      audioUrl: storageService.getUrl(m.audioPath),
    }));
  }

  async create(
    data: {
      title: string;
      description?: string;
      category?: string;
      mantraHint?: string;
      yantraId?: string | null;
      sortOrder?: number;
      isActive?: boolean;
      duration?: number;
      audio: File;
    },
    adminId?: string,
    ip?: string,
  ) {
    const project = await projectService.getBySlug(PROJECT_SLUG);

    if (data.yantraId) {
      const yantra = await prisma.yantramedYantra.findFirst({
        where: {
          id: data.yantraId,
          projectId: project.id,
          deletedAt: null,
          isActive: true,
        },
      });
      if (!yantra) {
        throw new AppError("Yantra not found", "YANTRA_NOT_FOUND", 404);
      }
    }

    const stored = await storageService.upload(
      data.audio,
      "yantramed/mantras",
      { kind: "audio", maxBytes: 50 * 1024 * 1024 },
    );

    await prisma.mediaFile.create({
      data: {
        projectId: project.id,
        category: "mantra",
        originalName: data.audio.name,
        storedName: stored.storedName,
        relativePath: stored.relativePath,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
      },
    });

    const mantra = await prisma.yantramedMantra.create({
      data: {
        projectId: project.id,
        yantraId: data.yantraId || null,
        title: data.title,
        description: data.description || null,
        mantraHint: data.mantraHint || null,
        category: data.category || null,
        audioPath: stored.relativePath,
        duration: data.duration ?? null,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    await auditLogService.log({
      adminId,
      action: "mantra.created",
      resourceType: "yantramed_mantra",
      resourceId: mantra.id,
      projectId: project.id,
      ipAddress: ip,
      metadata: { title: mantra.title, yantraId: mantra.yantraId },
    });

    return { ...mantra, audioUrl: storageService.getUrl(mantra.audioPath) };
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      yantraId?: string | null;
      mantraHint?: string;
      sortOrder?: number;
      isActive?: boolean;
      duration?: number;
      audio?: File | null;
    },
    adminId?: string,
    ip?: string,
  ) {
    const existing = await prisma.yantramedMantra.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Mantra not found", "MANTRA_NOT_FOUND", 404);
    }

    if (data.yantraId) {
      const yantra = await prisma.yantramedYantra.findFirst({
        where: {
          id: data.yantraId,
          projectId: existing.projectId,
          deletedAt: null,
        },
      });
      if (!yantra) {
        throw new AppError("Yantra not found", "YANTRA_NOT_FOUND", 404);
      }
    }

    let audioPath = existing.audioPath;
    let fileSize = existing.fileSize;
    let mimeType = existing.mimeType;

    if (data.audio) {
      const stored = await storageService.upload(
        data.audio,
        "yantramed/mantras",
        { kind: "audio", maxBytes: 50 * 1024 * 1024 },
      );
      await storageService.delete(existing.audioPath);
      audioPath = stored.relativePath;
      fileSize = stored.fileSize;
      mimeType = stored.mimeType;
    }

    const mantra = await prisma.yantramedMantra.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description:
          data.description !== undefined
            ? data.description || null
            : existing.description,
        category:
          data.category !== undefined ? data.category || null : existing.category,
        mantraHint:
          data.mantraHint !== undefined
            ? data.mantraHint || null
            : existing.mantraHint,
        yantraId:
          data.yantraId !== undefined ? data.yantraId || null : existing.yantraId,
        sortOrder: data.sortOrder ?? existing.sortOrder,
        isActive: data.isActive ?? existing.isActive,
        duration: data.duration ?? existing.duration,
        audioPath,
        fileSize,
        mimeType,
      },
    });

    await auditLogService.log({
      adminId,
      action: "mantra.updated",
      resourceType: "yantramed_mantra",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });

    return { ...mantra, audioUrl: storageService.getUrl(mantra.audioPath) };
  }

  async softDelete(id: string, adminId?: string, ip?: string) {
    const existing = await prisma.yantramedMantra.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Mantra not found", "MANTRA_NOT_FOUND", 404);
    }

    await prisma.yantramedMantra.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await auditLogService.log({
      adminId,
      action: "mantra.deleted",
      resourceType: "yantramed_mantra",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });
  }

  async listActivePublic(page = 1, limit = 50) {
    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const where = {
      projectId: project.id,
      deletedAt: null,
      isActive: true,
    };
    const [items, total] = await Promise.all([
      prisma.yantramedMantra.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.yantramedMantra.count({ where }),
    ]);

    return {
      items: items.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        audio_url: storageService.getUrl(m.audioPath),
        duration: m.duration,
        sort_order: m.sortOrder,
      })),
      total,
      page,
      limit,
    };
  }
}

export const yantramedMantraService = new YantramedMantraService();
