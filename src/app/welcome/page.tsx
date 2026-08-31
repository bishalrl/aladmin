import type { Metadata } from "next";
import Link from "next/link";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";

export const metadata: Metadata = {
  title: "Welcome — YantraMed",
  description: "Thank you for subscribing to YantraMed.",
};

export default function WelcomePage() {
  return (
    <PublicSiteShell>
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
          Welcome
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">
          You&apos;re subscribed to YantraMed
        </h1>
        <p className="mt-4 text-slate-600">
          Your payment was successful. Open the YantraMed app and sign in with the
          same email you used at checkout to access your course.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/account/billing"
            className="rounded-lg bg-teal-800 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700"
          >
            Manage billing
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-teal-300"
          >
            Back to home
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
