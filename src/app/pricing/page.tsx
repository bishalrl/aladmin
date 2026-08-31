import type { Metadata } from "next";
import { headers } from "next/headers";
import { PricingCheckout } from "@/components/pricing/PricingCheckout";
import { getAppBaseUrl, getPublicPaddleEnvironment, requireEnv } from "@/lib/paddle/config";
import { YANTRAMED_TIERS } from "@/lib/paddle/tiers";

export const metadata: Metadata = {
  title: "Pricing — YantraMed",
  description: "YantraMed subscription plans — Starter, Pro, and Advanced.",
};

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

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const headerStore = await headers();
  const countryCode = detectCountryCode(headerStore);
  const paddleEnvironment = getPublicPaddleEnvironment();
  const clientToken = requireEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
  const successUrl = `${getAppBaseUrl()}/welcome`;

  return (
    <PricingCheckout
      tiers={YANTRAMED_TIERS}
      paddleEnvironment={paddleEnvironment}
      clientToken={clientToken}
      successUrl={successUrl}
      countryCode={countryCode}
      customerEmail={params.email?.trim() || undefined}
    />
  );
}
