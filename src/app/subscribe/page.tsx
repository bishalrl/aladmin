import type { Metadata } from "next";
import { headers } from "next/headers";
import { SubscribeGate } from "@/components/subscribe/SubscribeGate";
import { verifyPaymentSessionToken } from "@/lib/auth/paymentSession";
import {
  getYantramedFirebaseWebConfig,
  type YantramedFirebaseWebConfig,
} from "@/lib/firebase/clientConfig";
import {
  getPublicPaddleEnvironment,
  getAppBaseUrl,
  requireEnv,
} from "@/lib/paddle/config";
import { YANTRAMED_TIERS } from "@/lib/paddle/tiers";

export const metadata: Metadata = {
  title: "Subscribe — YantraMed",
  description: "Sign in with Google and subscribe to YantraMed.",
};

export const dynamic = "force-dynamic";

function detectCountryCode(headerStore: Headers): string | undefined {
  const raw =
    headerStore.get("x-vercel-ip-country") ??
    headerStore.get("cf-ipcountry") ??
    headerStore.get("x-country-code");
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return undefined;
  return code;
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const params = await searchParams;
  const headerStore = await headers();
  const countryCode = detectCountryCode(headerStore);
  const paddleEnvironment = getPublicPaddleEnvironment();
  const clientToken = requireEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
  const successUrl = `${getAppBaseUrl()}/welcome`;

  let firebaseConfig: YantramedFirebaseWebConfig | null = null;
  let firebaseConfigError: string | null = null;
  try {
    firebaseConfig = getYantramedFirebaseWebConfig();
  } catch (e) {
    firebaseConfigError =
      e instanceof Error
        ? e.message
        : "Missing Firebase Web config in server .env";
  }

  let paymentSession = null;
  let sessionError: string | null = null;

  const token = params.s?.trim();
  if (token) {
    try {
      const verified = await verifyPaymentSessionToken(token);
      paymentSession = {
        uid: verified.uid,
        email: verified.email,
        returnUrl: verified.returnUrl,
        tier: verified.tier,
        interval: verified.interval,
      };
    } catch {
      sessionError =
        "This payment link is invalid or has expired. Request a new link from the YantraMed app.";
    }
  }

  return (
    <SubscribeGate
      tiers={YANTRAMED_TIERS}
      paddleEnvironment={paddleEnvironment}
      clientToken={clientToken}
      successUrl={successUrl}
      countryCode={countryCode}
      paymentSession={paymentSession}
      sessionError={sessionError}
      firebaseConfig={firebaseConfig}
      firebaseConfigError={firebaseConfigError}
    />
  );
}
