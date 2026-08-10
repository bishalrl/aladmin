import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole([AdminRole.SUPER_ADMIN], request);
    const admins = await prisma.admin.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return ok(admins);
  } catch (error) {
    return handleRouteError(error);
  }
}
