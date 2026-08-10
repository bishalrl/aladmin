import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { storageService } from "@/lib/storage/StorageService";
import { auditLogService } from "@/services/AuditLogService";
import { projectService } from "@/services/ProjectService";

export class BrandService {
  async list(projectSlug: string) {
    const project = await projectService.getBySlug(projectSlug);
    return prisma.brand.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: { name: "asc" },
      include: { _count: { select: { bannerAds: true } } },
    });
  }

  async create(
    projectSlug: string,
    data: {
      name: string;
      website?: string;
      contact?: string;
      isActive?: boolean;
      logo?: File | null;
    },
    adminId?: string,
    ip?: string,
  ) {
    const project = await projectService.getBySlug(projectSlug);
    let logoPath: string | null = null;
    if (data.logo) {
      const stored = await storageService.upload(
        data.logo,
        `banners/${project.slug}/brands`,
        { kind: "image", maxBytes: 5 * 1024 * 1024 },
      );
      logoPath = stored.relativePath;
    }

    const brand = await prisma.brand.create({
      data: {
        projectId: project.id,
        name: data.name,
        website: data.website || null,
        contact: data.contact || null,
        isActive: data.isActive ?? true,
        logoPath,
      },
    });

    await auditLogService.log({
      adminId,
      action: "brand.created",
      resourceType: "brand",
      resourceId: brand.id,
      projectId: project.id,
      ipAddress: ip,
      metadata: { name: brand.name },
    });

    return brand;
  }

  async update(
    id: string,
    data: {
      name?: string;
      website?: string;
      contact?: string;
      isActive?: boolean;
      logo?: File | null;
    },
    adminId?: string,
    ip?: string,
  ) {
    const existing = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError("Brand not found", "BRAND_NOT_FOUND", 404);

    let logoPath = existing.logoPath;
    if (data.logo) {
      const project = await projectService.getById(existing.projectId);
      const stored = await storageService.upload(
        data.logo,
        `banners/${project.slug}/brands`,
        { kind: "image", maxBytes: 5 * 1024 * 1024 },
      );
      if (logoPath) await storageService.delete(logoPath);
      logoPath = stored.relativePath;
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        website: data.website === undefined ? existing.website : data.website || null,
        contact: data.contact === undefined ? existing.contact : data.contact || null,
        isActive: data.isActive ?? existing.isActive,
        logoPath,
      },
    });

    await auditLogService.log({
      adminId,
      action: "brand.updated",
      resourceType: "brand",
      resourceId: brand.id,
      projectId: brand.projectId,
      ipAddress: ip,
    });

    return brand;
  }

  async softDelete(id: string, adminId?: string, ip?: string) {
    const existing = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new AppError("Brand not found", "BRAND_NOT_FOUND", 404);

    const brand = await prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await auditLogService.log({
      adminId,
      action: "brand.deleted",
      resourceType: "brand",
      resourceId: id,
      projectId: existing.projectId,
      ipAddress: ip,
    });

    return brand;
  }
}

export const brandService = new BrandService();
