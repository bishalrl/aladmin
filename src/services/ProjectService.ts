import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { ProjectStatus } from "@prisma/client";

export class ProjectService {
  async list() {
    return prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async getBySlug(slug: string) {
    const project = await prisma.project.findFirst({
      where: { slug, deletedAt: null },
    });
    if (!project) {
      throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
    }
    return project;
  }

  async getById(id: string) {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
    });
    if (!project) {
      throw new AppError("Project not found", "PROJECT_NOT_FOUND", 404);
    }
    return project;
  }

  async requireActiveBySlug(slug: string) {
    const project = await this.getBySlug(slug);
    if (project.status !== ProjectStatus.ACTIVE) {
      throw new AppError("Project is not active", "PROJECT_INACTIVE", 403);
    }
    return project;
  }
}

export const projectService = new ProjectService();
