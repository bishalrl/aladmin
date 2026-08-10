import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const settings = await prisma.setting.findMany({
      orderBy: { key: "asc" },
    });
    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
