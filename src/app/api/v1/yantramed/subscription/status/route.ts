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

    const emailParam = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    const uid = request.nextUrl.searchParams.get("uid")?.trim();

    if (!emailParam && !uid) {
      return fail("email or uid query param required", "VALIDATION_ERROR", 400);
    }

    try {
      if (uid) {
        const access = await paddleFulfillmentService.getAccessForFirebaseUid(uid);
        return ok({
          email: access.email,
          firebase_uid: uid,
          has_access: access.hasAccess,
          tier: access.tier,
          subscription_id: access.subscriptionId,
          status: access.status,
          customer_id: access.customerId,
        });
      }

      const access = await paddleFulfillmentService.getAccessForEmail(emailParam!);
      return ok({
        email: emailParam,
        firebase_uid: access.firebaseUid,
        has_access: access.hasAccess,
        tier: access.tier,
        subscription_id: access.subscriptionId,
        status: access.status,
        customer_id: access.customerId,
      });
    } catch (inner) {
      // Table missing / Firebase misconfig should not break the app paywall check
      console.error("[subscription/status]", inner);
      return ok({
        email: emailParam ?? null,
        firebase_uid: uid ?? null,
        has_access: false,
        tier: null,
        subscription_id: null,
        status: null,
        customer_id: null,
        warning: "billing_store_unavailable",
      });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
