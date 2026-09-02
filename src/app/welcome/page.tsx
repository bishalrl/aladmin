"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";

function WelcomeContent() {
  const params = useSearchParams();
  const returnUrl = params.get("return_url");

  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
        Welcome
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">
        You&apos;re subscribed to YantraMed
      </h1>
      <p className="mt-4 text-slate-600">
        Your payment was successful. Return to the YantraMed app — your
        subscription is linked to your Google account and saved under your user
        profile in Firebase.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {returnUrl ? (
          <a
            href={returnUrl}
            className="rounded-lg bg-teal-800 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700"
          >
            Return to app
          </a>
        ) : null}
        <Link
          href="/account/billing"
          className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:border-teal-300"
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
  );
}

export default function WelcomePage() {
  return (
    <PublicSiteShell>
      <Suspense
        fallback={
          <section className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-500">
            Loading…
          </section>
        }
      >
        <WelcomeContent />
      </Suspense>
    </PublicSiteShell>
  );
}
