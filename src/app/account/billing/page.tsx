"use client";

import { FormEvent, useState } from "react";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";

export default function AccountBillingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/yantramed/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!json.success || !json.data?.url) {
        setError(json.message || "Unable to open billing portal");
        return;
      }
      window.location.href = json.data.url as string;
    } catch {
      setError("Unable to open billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicSiteShell active="/account/billing">
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Manage billing</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the email you used for YantraMed checkout. We&apos;ll open Paddle&apos;s
          secure customer portal to update payment method, cancel, or view invoices.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <label className="block text-sm">
            <span className="mb-1.5 block text-slate-600">Account email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-800 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Opening portal…" : "Open customer portal"}
          </button>
        </form>
      </section>
    </PublicSiteShell>
  );
}
