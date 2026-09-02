import { NextRequest } from "next/server";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { enforcePublicApi } from "@/lib/api/publicGuard";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";
import {
  createPaymentSessionToken,
  paymentSessionExpiresAt,
  verifyPaymentSessionToken,
} from "@/lib/auth/paymentSession";
import {
  extractBearerToken,
  verifyYantramedIdToken,
} from "@/lib/firebase/verifyIdToken";
import { getAppBaseUrl } from "@/lib/paddle/config";

const VALID_TIERS = new Set(["Starter", "Pro", "Advanced"]);

export async function GET(request: NextRequest) {
  try {
    const blocked = await enforcePublicApi(request, {
      path: "/api/v1/yantramed/payment/url",
    });
    if (blocked) return blocked;

    const idToken = extractBearerToken(
      request.headers.get("authorization"),
    );
    if (!idToken) {
      return fail(
        "Authorization Bearer Firebase ID token required",
        "UNAUTHORIZED",
        401,
      );
    }

    let user;
    try {
      user = await verifyYantramedIdToken(idToken);
    } catch {
      return fail("Invalid or expired Firebase ID token", "UNAUTHORIZED", 401);
    }

    if (!user.email) {
      return fail(
        "Firebase account must have an email (Google sign-in)",
        "VALIDATION_ERROR",
        400,
      );
    }

    const ip = clientIp(request);
    const limited = rateLimit(`pay-url:${user.uid}:${ip}`, 20, 60_000);
    if (!limited.ok) {
      return fail("Too many requests", "RATE_LIMITED", 429);
    }

    const returnUrl = request.nextUrl.searchParams.get("return_url")?.trim();
    const tier = request.nextUrl.searchParams.get("tier")?.trim();
    const interval = request.nextUrl.searchParams.get("interval")?.trim();

    if (tier && !VALID_TIERS.has(tier)) {
      return fail("tier must be Starter, Pro, or Advanced", "VALIDATION_ERROR", 400);
    }
    if (interval && interval !== "month" && interval !== "year") {
      return fail("interval must be month or year", "VALIDATION_ERROR", 400);
    }

    const sessionToken = await createPaymentSessionToken({
      uid: user.uid,
      email: user.email.toLowerCase(),
      returnUrl: returnUrl || undefined,
      tier: tier || undefined,
      interval:
        interval === "month" || interval === "year" ? interval : undefined,
    });

    const verified = await verifyPaymentSessionToken(sessionToken);

    const base = getAppBaseUrl();
    const paymentUrl = new URL("/subscribe", base);
    paymentUrl.searchParams.set("s", sessionToken);

    return ok({
      payment_url: paymentUrl.toString(),
      expires_at: paymentSessionExpiresAt(verified.exp),
      firebase_uid: user.uid,
      email: user.email.toLowerCase(),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
