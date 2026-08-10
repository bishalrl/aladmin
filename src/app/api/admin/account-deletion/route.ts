import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { accountDeletionService } from "@/services/AccountDeletionService";
import { DeletionRequestStatus, AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    const status = request.nextUrl.searchParams.get("status") as
      | DeletionRequestStatus
      | null;
    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const limit = Number(request.nextUrl.searchParams.get("limit") || 20);
    const data = await accountDeletionService.list({
      status: status || undefined,
      page,
      limit,
    });
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
