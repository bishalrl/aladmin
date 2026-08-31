import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";
import { YANTRAMED_SITE } from "@/lib/site/yantramedSite";

export const metadata: Metadata = {
  title: `${YANTRAMED_SITE.appName} — 30-Day Yantra Meditation Course`,
  description: YANTRAMED_SITE.tagline,
};

export default function HomePage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
            30-day guided course
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            {YANTRAMED_SITE.appName}
          </h1>
          <p className="mt-4 text-lg text-slate-600">{YANTRAMED_SITE.tagline}.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-lg bg-teal-800 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              View pricing — {YANTRAMED_SITE.pricing.display}
            </Link>
            <Link
              href="/terms"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:border-teal-300"
            >
              Terms & policies
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Six sacred yantras",
              desc: "Sri, Kali, Durga, Saraswati, Ganesha, and Tara — each with its own mantra.",
            },
            {
              title: "Daily session flow",
              desc: "Opening mantra, day-specific music, closing mantra — one structured session per day.",
            },
            {
              title: "30-day progression",
              desc: "Sequential unlock from Day 1 to Day 30. Build a consistent meditation practice.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-teal-200 bg-teal-50/60 p-6">
          <h2 className="font-semibold text-teal-900">Subscription</h2>
          <p className="mt-2 text-sm text-teal-900/80">
            YantraMed is a paid subscription service at{" "}
            <strong>{YANTRAMED_SITE.pricing.display}</strong>. Billing is handled
            securely through our payment provider. See our{" "}
            <Link href="/pricing" className="underline">
              pricing
            </Link>
            ,{" "}
            <Link href="/terms" className="underline">
              terms
            </Link>
            , and{" "}
            <Link href="/refunds" className="underline">
              refund policy
            </Link>{" "}
            for details.
          </p>
        </div>
      </section>
    </PublicSiteShell>
  );
}
