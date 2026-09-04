"use client";

import { FormEvent, useState } from "react";
import { Button, Input, TextArea } from "@/components/ui/primitives";

export function DeleteAccountForm({ project }: { project: string }) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (done) {
    return (
      <div className="rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-teal-800">Request received</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your YantraMed account deletion request has been submitted. We will review
          it and complete deletion within 30 days. You may close this page.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
  );
}
