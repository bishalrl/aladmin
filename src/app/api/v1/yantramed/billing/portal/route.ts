import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { getPaddleClient } from "@/lib/paddle/client";
import { paddleFulfillmentService } from "@/services/PaddleFulfillmentService";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`portal:${ip}`, 10, 60_000);
    if (!limited.ok) {
      return fail("Too many requests", "RATE_LIMITED", 429);
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail("Valid email required", "VALIDATION_ERROR", 400);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const access = await paddleFulfillmentService.getAccessForEmail(email);

    if (!access.customerId) {
      return fail(
        "No billing account found for this email. Use the same email as checkout.",
        "CUSTOMER_NOT_FOUND",
        404,
      );
    }

    const paddle = getPaddleClient();
    const subscriptionIds = access.subscriptionId ? [access.subscriptionId] : [];
    const session = await paddle.customerPortalSessions.create(
      access.customerId,
      subscriptionIds,
    );

    const overview = session.urls?.general?.overview;
    const subscriptionPortal =
      session.urls?.subscriptions?.[0]?.updateSubscriptionPaymentMethod;
    const url = overview ?? subscriptionPortal;
    if (!url) {
      return fail("Portal URL unavailable", "PORTAL_ERROR", 502);
    }

    return ok({ url });
  } catch (error) {
    return handleRouteError(error);
  }
}
