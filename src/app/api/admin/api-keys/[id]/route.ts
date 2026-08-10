import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { apiKeyService } from "@/services/ApiKeyService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { id } = await context.params;
    await apiKeyService.revoke(id, session.sub, clientIp(request));
    return ok({ revoked: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
