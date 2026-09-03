"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getYantramedFirebaseAuth } from "@/lib/firebase/clientApp";
import type { YantramedFirebaseWebConfig } from "@/lib/firebase/clientConfig";
import { PricingCheckout } from "@/components/pricing/PricingCheckout";
import type { Tier } from "@/lib/paddle/tiers";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";

type VerifiedSession = {
  uid: string;
  email: string;
  returnUrl?: string;
  tier?: string;
  interval?: "month" | "year";
};

type Props = {
  tiers: Tier[];
  paddleEnvironment: "production" | "sandbox";
  clientToken: string;
  successUrl: string;
  countryCode?: string;
  paymentSession: VerifiedSession | null;
  sessionError: string | null;
  /** Loaded on the server from YANTRAMED_FIREBASE_WEB_* / NEXT_PUBLIC_* */
  firebaseConfig: YantramedFirebaseWebConfig | null;
  firebaseConfigError: string | null;
};

export function SubscribeGate({
  tiers,
  paddleEnvironment,
  clientToken,
  successUrl,
  countryCode,
  paymentSession,
  sessionError,
  firebaseConfig,
  firebaseConfigError,
}: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (firebaseConfigError || !firebaseConfig) {
      setAuthError(
        firebaseConfigError ??
          "Missing Firebase Web config on server. Set YANTRAMED_FIREBASE_WEB_API_KEY, AUTH_DOMAIN, and APP_ID in .env",
      );
      setAuthReady(true);
      return;
    }

    let unsub = () => {};
    try {
      const auth = getYantramedFirebaseAuth(firebaseConfig);
      unsub = onAuthStateChanged(auth, (next) => {
        setUser(next);
        setAuthReady(true);
      });
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Firebase not configured");
      setAuthReady(true);
    }
    return () => unsub();
  }, [firebaseConfig, firebaseConfigError]);

  const uidMismatch = useMemo(() => {
    if (!paymentSession || !user) return false;
    return user.uid !== paymentSession.uid;
  }, [paymentSession, user]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!firebaseConfig) return;
    setSigningIn(true);
    setAuthError(null);
    try {
      const auth = getYantramedFirebaseAuth(firebaseConfig);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }, [firebaseConfig]);

  const handleSignOut = useCallback(async () => {
    if (!firebaseConfig) return;
    try {
      const auth = getYantramedFirebaseAuth(firebaseConfig);
      await signOut(auth);
    } catch {
      /* ignore */
    }
  }, [firebaseConfig]);

  if (sessionError) {
    return (
      <PublicSiteShell active="/subscribe">
        <section className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Invalid payment link
          </h1>
          <p className="mt-3 text-slate-600">{sessionError}</p>
          <p className="mt-6 text-sm text-slate-500">
            Open YantraMed in the app and tap Subscribe again to get a fresh link.
          </p>
        </section>
      </PublicSiteShell>
    );
  }

  if (!paymentSession) {
    return (
      <PublicSiteShell active="/subscribe">
        <section className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Subscribe</h1>
          <p className="mt-3 text-slate-600">
            Payment links must be opened from the YantraMed app. Use Subscribe in
            the app to get a secure checkout link.
          </p>
        </section>
      </PublicSiteShell>
    );
  }

  if (!authReady) {
    return (
      <PublicSiteShell active="/subscribe">
        <section className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-500">
          Loading…
        </section>
      </PublicSiteShell>
    );
  }

  if (authError && !user) {
    return (
      <PublicSiteShell active="/subscribe">
        <section className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {authError}
          </p>
        </section>
      </PublicSiteShell>
    );
  }

  if (!user) {
    return (
      <PublicSiteShell active="/subscribe">
        <section className="mx-auto max-w-md px-4 py-20">
          <h1 className="text-2xl font-semibold text-slate-900">
            Sign in to subscribe
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Continue with the same Google account you use in the YantraMed app.
            Payment is completed securely on this page — not inside the app.
          </p>
          <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Expected account: <strong>{paymentSession.email}</strong>
          </p>
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={signingIn}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {signingIn ? "Signing in…" : "Continue with Google"}
          </button>
        </section>
      </PublicSiteShell>
    );
  }

  if (uidMismatch) {
    return (
      <PublicSiteShell active="/subscribe">
        <section className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Wrong Google account
          </h1>
          <p className="mt-3 text-slate-600">
            You signed in as <strong>{user.email}</strong>, but this payment link
            was created for <strong>{paymentSession.email}</strong>. Sign out and
            use the correct account.
          </p>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-6 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Sign out
          </button>
        </section>
      </PublicSiteShell>
    );
  }

  const checkoutSuccessUrl = paymentSession.returnUrl
    ? `${successUrl}?return_url=${encodeURIComponent(paymentSession.returnUrl)}`
    : successUrl;

  return (
    <PricingCheckout
      tiers={tiers}
      paddleEnvironment={paddleEnvironment}
      clientToken={clientToken}
      successUrl={checkoutSuccessUrl}
      countryCode={countryCode}
      customerEmail={user.email ?? paymentSession.email}
      firebaseUid={user.uid}
      activeNav="/subscribe"
      initialInterval={paymentSession.interval}
      initialTierName={paymentSession.tier}
      headerSubtitle="Signed in with Google — complete payment below."
    />
  );
}
