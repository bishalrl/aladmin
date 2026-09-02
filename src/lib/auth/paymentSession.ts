import { SignJWT, jwtVerify } from "jose";

const TTL_SECONDS = 15 * 60; // 15 minutes

export type PaymentSessionPayload = {
  uid: string;
  email: string;
  returnUrl?: string;
  tier?: string;
  interval?: "month" | "year";
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function createPaymentSessionToken(
  payload: PaymentSessionPayload,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return new SignJWT({
    email: payload.email,
    returnUrl: payload.returnUrl,
    tier: payload.tier,
    interval: payload.interval,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.uid)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifyPaymentSessionToken(
  token: string,
): Promise<PaymentSessionPayload & { exp: number }> {
  const { payload } = await jwtVerify(token, getSecret());
  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Invalid payment session");
  }
  return {
    uid: payload.sub,
    email: payload.email,
    returnUrl:
      typeof payload.returnUrl === "string" ? payload.returnUrl : undefined,
    tier: typeof payload.tier === "string" ? payload.tier : undefined,
    interval:
      payload.interval === "month" || payload.interval === "year"
        ? payload.interval
        : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : 0,
  };
}

export function paymentSessionExpiresAt(exp: number): string {
  return new Date(exp * 1000).toISOString();
}
