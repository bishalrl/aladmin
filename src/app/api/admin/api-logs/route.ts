import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const limit = Number(request.nextUrl.searchParams.get("limit") || 50);
    const [items, total] = await Promise.all([
      prisma.apiRequestLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { project: { select: { name: true, slug: true } } },
      }),
      prisma.apiRequestLog.count(),
    ]);
    return ok({ items, total, page, limit });
  } catch (error) {
    return handleRouteError(error);
  }
}
