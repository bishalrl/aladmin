import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { deletionReviewSchema } from "@/lib/api/validators";
import { accountDeletionService } from "@/services/AccountDeletionService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { id } = await context.params;
    const body = await request.json();
    const parsed = deletionReviewSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid review payload", "VALIDATION_ERROR", 400);
    }
    const result = await accountDeletionService.review(
      id,
      parsed.data.action,
      session.sub,
      parsed.data.adminNotes,
      clientIp(request),
    );
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
