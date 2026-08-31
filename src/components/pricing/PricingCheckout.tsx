"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import type { Tier } from "@/lib/paddle/tiers";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";

type BillingInterval = "month" | "year";

type TierPreview = {
  tier: Tier;
  priceId: string;
  /** Paddle-formatted total — display as-is, no reformatting */
  formattedTotal: string | null;
  loading: boolean;
};

type Props = {
  tiers: Tier[];
  paddleEnvironment: "production" | "sandbox";
  clientToken: string;
  successUrl: string;
  /** ISO country from edge headers; omit to let Paddle auto-detect */
  countryCode?: string;
  customerEmail?: string;
  /** Firebase Auth UID from Google sign-in in the mobile app */
  firebaseUid?: string;
};

export function PricingCheckout({
  tiers,
  paddleEnvironment,
  clientToken,
  successUrl,
  countryCode,
  customerEmail,
  firebaseUid,
}: Props) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<TierPreview[]>([]);

  const priceItems = useMemo(
    () =>
      tiers.map((t) => ({
        tier: t,
        priceId: t.priceId[interval],
      })),
    [tiers, interval],
  );

  useEffect(() => {
    let cancelled = false;
    initializePaddle({
      token: clientToken,
      environment: paddleEnvironment,
      checkout: {
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          successUrl,
        },
      },
    })
      .then((instance) => {
        if (!cancelled) setPaddle(instance ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setInitError(e instanceof Error ? e.message : "Failed to load Paddle");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clientToken, paddleEnvironment, successUrl]);

  const loadPreviews = useCallback(async () => {
    if (!paddle) return;
    setPreviews(
      priceItems.map(({ tier, priceId }) => ({
        tier,
        priceId,
        formattedTotal: null,
        loading: Boolean(priceId),
      })),
    );

    const items = priceItems
      .filter((p) => p.priceId)
      .map((p) => ({ priceId: p.priceId, quantity: 1 }));

    if (items.length === 0) return;

    try {
      const params: Parameters<Paddle["PricePreview"]>[0] = { items };
      if (countryCode) {
        params.address = { countryCode };
      }

      const response = await paddle.PricePreview(params);
      const byPriceId = new Map(
        response.data.details.lineItems.map((li) => [
          li.price.id,
          li.formattedTotals.total,
        ]),
      );

      setPreviews(
        priceItems.map(({ tier, priceId }) => ({
          tier,
          priceId,
          formattedTotal: byPriceId.get(priceId) ?? null,
          loading: false,
        })),
      );
    } catch (e) {
      setInitError(e instanceof Error ? e.message : "Price preview failed");
      setPreviews(
        priceItems.map(({ tier, priceId }) => ({
          tier,
          priceId,
          formattedTotal: null,
          loading: false,
        })),
      );
    }
  }, [paddle, priceItems, countryCode]);

  useEffect(() => {
    void loadPreviews();
  }, [loadPreviews]);

  function openCheckout(priceId: string, tierName: string) {
    if (!paddle || !priceId) return;
    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: customerEmail ? { email: customerEmail } : undefined,
      customData: {
        app_slug: "yantramed",
        tier: tierName,
        ...(customerEmail ? { email: customerEmail } : {}),
        ...(firebaseUid ? { firebase_uid: firebaseUid } : {}),
      },
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        successUrl,
      },
    });
  }

  return (
    <PublicSiteShell active="/pricing">
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            Pricing
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900">
            Choose your YantraMed plan
          </h1>
          <p className="mt-3 text-slate-600">
            Localized prices from Paddle. Toggle monthly or yearly billing.
          </p>
        </div>

        <div className="mt-8 inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              interval === "month"
                ? "bg-teal-800 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              interval === "year"
                ? "bg-teal-800 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Yearly
          </button>
        </div>

        {initError ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {initError}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {previews.map(({ tier, priceId, formattedTotal, loading }) => (
            <div
              key={`${tier.name}-${interval}`}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                tier.highlighted
                  ? "border-teal-600 ring-2 ring-teal-600/20"
                  : "border-slate-200"
              }`}
            >
              {tier.highlighted ? (
                <span className="mb-2 w-fit rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-xl font-semibold">{tier.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{tier.description}</p>
              <p className="mt-6 min-h-[2.5rem] text-3xl font-semibold text-slate-900">
                {loading ? "…" : formattedTotal ?? "—"}
              </p>
              <p className="text-xs text-slate-500">
                per {interval === "month" ? "month" : "year"} · taxes may apply
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-700">
                {tier.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!paddle || !priceId}
                onClick={() => openCheckout(priceId, tier.name)}
                className="mt-6 w-full rounded-lg bg-teal-800 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Subscribe
              </button>
              {!priceId ? (
                <p className="mt-2 text-xs text-amber-700">
                  Set PADDLE_PRICE_{tier.name.toUpperCase()}_{interval === "month" ? "MONTHLY" : "YEARLY"} in .env
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-600">
          By subscribing you agree to our{" "}
          <a href="/terms" className="text-teal-800 hover:underline">
            Terms
          </a>
          ,{" "}
          <a href="/privacy" className="text-teal-800 hover:underline">
            Privacy Policy
          </a>
          , and{" "}
          <a href="/refunds" className="text-teal-800 hover:underline">
            Refund Policy
          </a>
          .
        </p>
      </section>
    </PublicSiteShell>
  );
}
