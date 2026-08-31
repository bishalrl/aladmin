import { NextRequest } from "next/server";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { paddleFulfillmentService } from "@/services/PaddleFulfillmentService";
import { enforcePublicApi } from "@/lib/api/publicGuard";

export async function GET(request: NextRequest) {
  try {
    const blocked = await enforcePublicApi(request, {
      path: "/api/v1/yantramed/subscription/status",
    });
    if (blocked) return blocked;

    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    if (!email) {
      return fail("email query param required", "VALIDATION_ERROR", 400);
    }

    const access = await paddleFulfillmentService.getAccessForEmail(email);
    return ok({
      email,
      has_access: access.hasAccess,
      tier: access.tier,
      subscription_id: access.subscriptionId,
      status: access.status,
      customer_id: access.customerId,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
