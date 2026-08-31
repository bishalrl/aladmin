import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";
import { YANTRAMED_SITE } from "@/lib/site/yantramedSite";

export const metadata: Metadata = {
  title: `Pricing — ${YANTRAMED_SITE.appName}`,
  description: `${YANTRAMED_SITE.appName} subscription at ${YANTRAMED_SITE.pricing.display}.`,
};

export default function PricingPage() {
  const { pricing } = YANTRAMED_SITE;

  return (
    <PublicSiteShell active="/pricing">
      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-900">
          {YANTRAMED_SITE.appName} subscription
        </h1>
        <p className="mt-3 text-slate-600">
          Full access to the 30-day yantra meditation course, daily mantras, and
          background music sessions.
        </p>

        <div className="mt-10 rounded-2xl border-2 border-teal-700 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Monthly plan
          </p>
          <p className="mt-2 text-5xl font-semibold text-slate-900">
            ${pricing.amount}
            <span className="text-lg font-normal text-slate-500"> / month</span>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Billed in {pricing.currency}. Cancel anytime subject to our refund policy.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-700">
            <li>✓ 30-day sequential meditation course</li>
            <li>✓ Six yantra mantras (opening + closing each session)</li>
            <li>✓ Unique daily background music for each course day</li>
            <li>✓ Progress tracked in your account</li>
          </ul>

          {YANTRAMED_SITE.paddleCheckoutUrl ? (
            <a
              href={YANTRAMED_SITE.paddleCheckoutUrl}
              className="mt-8 inline-block rounded-lg bg-teal-800 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              Subscribe now
            </a>
          ) : (
            <p className="mt-8 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Subscribe through the YantraMed mobile app or the checkout link provided
              after payment setup.
            </p>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-600">
          By subscribing you agree to our{" "}
          <Link href="/terms" className="text-teal-800 hover:underline">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-teal-800 hover:underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/refunds" className="text-teal-800 hover:underline">
            Refund Policy
          </Link>
          .
        </p>
      </section>
    </PublicSiteShell>
  );
}
