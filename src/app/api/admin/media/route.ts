import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { storageService } from "@/lib/storage/StorageService";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    const category = request.nextUrl.searchParams.get("category") || undefined;
    const items = await prisma.mediaFile.findMany({
      where: {
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { project: { select: { name: true, slug: true } } },
    });
    return ok(
      items.map((m) => ({
        ...m,
        url: storageService.getUrl(m.relativePath),
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
