import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { storageService } from "@/lib/storage/StorageService";
import { auditLogService } from "@/services/AuditLogService";
import { projectService } from "@/services/ProjectService";
import { BannerMediaType } from "@prisma/client";

function mediaKindFromMime(mime: string): BannerMediaType {
  if (mime.startsWith("video/")) return BannerMediaType.VIDEO;
  if (mime.startsWith("image/")) return BannerMediaType.IMAGE;
  throw new AppError(
    "Banner media must be an image or video",
    "INVALID_FILE_TYPE",
    400,
  );
}

function mapAdminBanner(b: {
  id: string;
  title: string;
  mediaPath: string;
  mediaType: BannerMediaType;
  mimeType: string | null;
  clickUrl: string | null;
  startDate: Date;
  endDate: Date;
  priority: number;
  isActive: boolean;
  brand: { id: string; name: string; logoPath: string | null };
}) {
  return {
    ...b,
    mediaUrl: storageService.getUrl(b.mediaPath),
    brandLogoUrl: b.brand.logoPath
      ? storageService.getUrl(b.brand.logoPath)
      : null,
  };
}

export class BannerService {
  async list(projectSlug: string) {
    const project = await projectService.getBySlug(projectSlug);
    const items = await prisma.bannerAd.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { brand: true },
    });
    return items.map(mapAdminBanner);
  }

  async create(
    projectSlug: string,
    data: {
      brandId: string;
      title: string;
      clickUrl?: string | null;
      startDate: string;
      endDate: string;
      priority?: number;
      isActive?: boolean;
      media: File;
    },
    adminId?: string,
    ip?: string,
  ) {
    const project = await projectService.getBySlug(projectSlug);
    const brand = await prisma.brand.findFirst({
      where: {
        id: data.brandId,
        projectId: project.id,
        deletedAt: null,
      },
    });
    if (!brand) throw new AppError("Brand not found", "BRAND_NOT_FOUND", 404);

    const stored = await storageService.upload(
      data.media,
      `banners/${project.slug}`,
      { kind: "banner", maxBytes: 50 * 1024 * 1024 },
    );
    const mediaType = mediaKindFromMime(stored.mimeType);

    await prisma.mediaFile.create({
      data: {
        projectId: project.id,
        category: "banner",
        originalName: data.media.name,
        storedName: stored.storedName,
        relativePath: stored.relativePath,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
      },
    });

    const banner = await prisma.bannerAd.create({
      data: {
        projectId: project.id,
        brandId: brand.id,
        title: data.title,
        mediaPath: stored.relativePath,
        mediaType,
        mimeType: stored.mimeType,
        clickUrl: data.clickUrl?.trim() || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        priority: data.priority ?? 0,
        isActive: data.isActive ?? true,
      },
      include: { brand: true },
    });

    await auditLogService.log({
      adminId,
      action: "banner.created",
      resourceType: "banner_ad",
      resourceId: banner.id,
      projectId: project.id,
      ipAddress: ip,
      metadata: { title: banner.title, mediaType },
    });

    return mapAdminBanner(banner);
  }

  async update(
    id: string,
    data: {
      brandId?: string;
      title?: string;
      clickUrl?: string | null;
      startDate?: string;
      endDate?: string;
      priority?: number;
      isActive?: boolean;
      media?: File | null;
    },
    adminId?: string,
    ip?: string,
  ) {
    const existing = await prisma.bannerAd.findFirst({
      where: { id, deletedAt: null },
      include: { project: true },
    });
    if (!existing) {
      throw new AppError("Banner not found", "BANNER_NOT_FOUND", 404);
    }

    let mediaPath = existing.mediaPath;
    let mediaType = existing.mediaType;
    let mimeType = existing.mimeType;

    if (data.media) {
      const stored = await storageService.upload(
        data.media,
        `banners/${existing.project.slug}`,
        { kind: "banner", maxBytes: 50 * 1024 * 1024 },
      );
      await storageService.delete(existing.mediaPath);
      mediaPath = stored.relativePath;
      mediaType = mediaKindFromMime(stored.mimeType);
      mimeType = stored.mimeType;
      await prisma.mediaFile.create({
        data: {
          projectId: existing.projectId,
          category: "banner",
          originalName: data.media.name,
          storedName: stored.storedName,
          relativePath: stored.relativePath,
          mimeType: stored.mimeType,
          fileSize: stored.fileSize,
        },
      });
    }

    const banner = await prisma.bannerAd.update({
      where: { id },
      data: {
        brandId: data.brandId ?? existing.brandId,
        title: data.title ?? existing.title,
        clickUrl:
          data.clickUrl === undefined
            ? existing.clickUrl
            : data.clickUrl?.trim() || null,
        startDate: data.startDate ? new Date(data.startDate) : existing.startDate,
        endDate: data.endDate ? new Date(data.endDate) : existing.endDate,
        priority: data.priority ?? existing.priority,
        isActive: data.isActive ?? existing.isActive,
        mediaPath,
        mediaType,
        mimeType,
      },
      include: { brand: true },
    });

    await auditLogService.log({
      adminId,
      action: "banner.updated",
      resourceType: "banner_ad",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });

    return mapAdminBanner(banner);
  }

  async setActive(id: string, isActive: boolean, adminId?: string, ip?: string) {
    return this.update(id, { isActive }, adminId, ip);
  }

  async softDelete(id: string, adminId?: string, ip?: string) {
    const existing = await prisma.bannerAd.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new AppError("Banner not found", "BANNER_NOT_FOUND", 404);
    }

    await prisma.bannerAd.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await auditLogService.log({
      adminId,
      action: "banner.deleted",
      resourceType: "banner_ad",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });
  }

  /** Public Budgeting Sathi API: media (image|video) + optional brand link */
  async listActivePublic(projectSlug: string) {
    const project = await projectService.requireActiveBySlug(projectSlug);
    const now = new Date();
    const banners = await prisma.bannerAd.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        brand: { isActive: true, deletedAt: null },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: { brand: true },
    });

    return banners.map((b) => ({
      id: b.id,
      brand: b.brand.name,
      media_type: b.mediaType === BannerMediaType.VIDEO ? "video" : "image",
      media_url: storageService.getUrl(b.mediaPath),
      link: b.clickUrl,
      priority: b.priority,
    }));
  }
}

export const bannerService = new BannerService();
