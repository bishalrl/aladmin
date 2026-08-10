import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { storageService } from "@/lib/storage/StorageService";
import { auditLogService } from "@/services/AuditLogService";
import { projectService } from "@/services/ProjectService";

const PROJECT_SLUG = "yantramed";

export class YantramedMusicService {
  async list() {
    const project = await projectService.getBySlug(PROJECT_SLUG);
    const items = await prisma.yantramedMusic.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
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
      sortOrder?: number;
      isActive?: boolean;
      duration?: number;
      dayNumber: number;
      audio: File;
    },
    adminId?: string,
    ip?: string,
  ) {
    const project = await projectService.getBySlug(PROJECT_SLUG);
    const stored = await storageService.upload(
      data.audio,
      "yantramed/music",
      { kind: "audio", maxBytes: 50 * 1024 * 1024 },
    );

    await prisma.mediaFile.create({
      data: {
        projectId: project.id,
        category: "music",
        originalName: data.audio.name,
        storedName: stored.storedName,
        relativePath: stored.relativePath,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
      },
    });

    const music = await prisma.yantramedMusic.create({
      data: {
        projectId: project.id,
        title: data.title,
        description: data.description || null,
        dayNumber: data.dayNumber,
        audioPath: stored.relativePath,
        duration: data.duration ?? null,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    // Bind this track to the matching course day so day APIs resolve it
    await prisma.yantramedCourseDay.updateMany({
      where: {
        projectId: project.id,
        dayNumber: data.dayNumber,
        deletedAt: null,
      },
      data: { musicId: music.id },
    });

    await auditLogService.log({
      adminId,
      action: "music.created",
      resourceType: "yantramed_music",
      resourceId: music.id,
      projectId: project.id,
      ipAddress: ip,
      metadata: { title: music.title, dayNumber: music.dayNumber },
    });

    return { ...music, audioUrl: storageService.getUrl(music.audioPath) };
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
      duration?: number;
      dayNumber?: number | null;
      audio?: File | null;
    },
    adminId?: string,
    ip?: string,
  ) {
    const existing = await prisma.yantramedMusic.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError("Music not found", "MUSIC_NOT_FOUND", 404);

    let audioPath = existing.audioPath;
    let fileSize = existing.fileSize;
    let mimeType = existing.mimeType;

    if (data.audio) {
      const stored = await storageService.upload(data.audio, "yantramed/music", {
        kind: "audio",
        maxBytes: 50 * 1024 * 1024,
      });
      await storageService.delete(existing.audioPath);
      audioPath = stored.relativePath;
      fileSize = stored.fileSize;
      mimeType = stored.mimeType;
    }

    const music = await prisma.yantramedMusic.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        description:
          data.description === undefined
            ? existing.description
            : data.description || null,
        dayNumber:
          data.dayNumber !== undefined ? data.dayNumber : existing.dayNumber,
        sortOrder: data.sortOrder ?? existing.sortOrder,
        isActive: data.isActive ?? existing.isActive,
        duration: data.duration ?? existing.duration,
        audioPath,
        fileSize,
        mimeType,
      },
    });

    if (data.dayNumber != null && data.dayNumber !== existing.dayNumber) {
      if (existing.dayNumber != null) {
        await prisma.yantramedCourseDay.updateMany({
          where: {
            projectId: existing.projectId,
            dayNumber: existing.dayNumber,
            musicId: id,
            deletedAt: null,
          },
          data: { musicId: null },
        });
      }
      await prisma.yantramedCourseDay.updateMany({
        where: {
          projectId: existing.projectId,
          dayNumber: data.dayNumber,
          deletedAt: null,
        },
        data: { musicId: id },
      });
    }

    await auditLogService.log({
      adminId,
      action: "music.updated",
      resourceType: "yantramed_music",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });

    return { ...music, audioUrl: storageService.getUrl(music.audioPath) };
  }

  async softDelete(id: string, adminId?: string, ip?: string) {
    const existing = await prisma.yantramedMusic.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError("Music not found", "MUSIC_NOT_FOUND", 404);

    await prisma.yantramedMusic.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await auditLogService.log({
      adminId,
      action: "music.deleted",
      resourceType: "yantramed_music",
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
      prisma.yantramedMusic.findMany({
        where,
        orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.yantramedMusic.count({ where }),
    ]);

    return {
      items: items.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        day_number: m.dayNumber,
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

export const yantramedMusicService = new YantramedMusicService();
