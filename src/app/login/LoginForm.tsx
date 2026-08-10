"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui/primitives";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Login failed");
        return;
      }
      const next = search.get("next") || "/admin";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Unable to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.35),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.9),_transparent_40%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
          Central Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Secure access to Budgeting Sathi and YantraMed management.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
