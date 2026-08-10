import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { auditLogService } from "@/services/AuditLogService";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const limit = Number(request.nextUrl.searchParams.get("limit") || 20);
    const projectId = request.nextUrl.searchParams.get("projectId") || undefined;
    return ok(await auditLogService.list({ page, limit, projectId }));
  } catch (error) {
    return handleRouteError(error);
  }
}
