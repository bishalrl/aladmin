"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Input, TextArea } from "@/components/ui/primitives";

const LABELS: Record<string, string> = {
  "budgeting-sathi": "Budgeting Sathi",
  yantramed: "YantraMed",
};

export default function DeleteAccountPage() {
  const params = useParams<{ project: string }>();
  const project = params.project;
  const appName = LABELS[project] || project;
  const valid = project === "budgeting-sathi" || project === "yantramed";

  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => `Delete ${appName} account`, [appName]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/delete-account/${project}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Request failed");
        return;
      }
      setDone(true);
    } catch {
      setError("Unable to submit request");
    } finally {
      setLoading(false);
    }
  }

  if (!valid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-semibold">Unknown application</h1>
        <p className="mt-2 text-slate-600">
          This account deletion page does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_50%)]" />
      <div className="relative mx-auto max-w-lg px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Account deletion
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit a request to delete your {appName} account. An administrator will
          review it. This page only applies to <strong>{appName}</strong> and cannot
          delete accounts from other apps.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-teal-800">Request received</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your deletion request has been submitted and will be reviewed by an
              administrator. You may close this page.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <Input
              label="Account email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextArea
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting…" : "Submit deletion request"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
