import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse, PublicSiteShell } from "@/components/site/PublicSiteShell";
import { LEGAL_LAST_UPDATED, YANTRAMED_SITE } from "@/lib/site/yantramedSite";

export const metadata: Metadata = {
  title: `Terms of Service — ${YANTRAMED_SITE.appName}`,
};

export default function TermsPage() {
  const { appName, companyName, supportEmail, website, pricing } = YANTRAMED_SITE;

  return (
    <PublicSiteShell active="/terms">
      <LegalProse>
        <h1>Terms of Service</h1>
        <p className="text-slate-500">Last updated: {LEGAL_LAST_UPDATED}</p>

        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of {appName} (
          &quot;Service&quot;), operated by {companyName} (&quot;we&quot;, &quot;us&quot;).
          By accessing or subscribing to {appName}, you agree to these Terms.
        </p>

        <h2>1. The Service</h2>
        <p>
          {appName} provides a digital 30-day guided meditation course including yantra
          content, mantra audio, and daily music. The Service is delivered through our
          mobile application and related web properties at {website}.
        </p>

        <h2>2. Subscription & billing</h2>
        <p>
          Access to premium course content requires an active subscription currently priced
          at <strong>{pricing.display}</strong>. Payments are processed by our third-party
          payment provider (e.g. Paddle). Subscriptions renew automatically each billing
          period unless cancelled in accordance with our{" "}
          <Link href="/refunds">Refund Policy</Link>.
        </p>

        <h2>3. Account & eligibility</h2>
        <p>
          You must provide accurate registration information and keep your account
          credentials secure. You are responsible for activity under your account.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Copy, redistribute, or resell course audio or content without permission</li>
          <li>Attempt to bypass subscription or access controls</li>
          <li>Use the Service for unlawful purposes</li>
        </ul>

        <h2>5. Intellectual property</h2>
        <p>
          All content, branding, audio, and software are owned by {companyName} or its
          licensors. Your subscription grants a personal, non-transferable license to
          access content for private use only.
        </p>

        <h2>6. Disclaimer</h2>
        <p>
          {appName} is for wellness and meditation purposes. It is not medical advice.
          Consult a healthcare professional before starting any meditation program if you
          have health concerns.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {companyName} is not liable for indirect
          or consequential damages arising from use of the Service.
        </p>

        <h2>8. Termination</h2>
        <p>
          You may request account deletion at{" "}
          <Link href="/delete-account/yantramed">{website}/delete-account/yantramed</Link>.
          We may suspend accounts that violate these Terms.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these Terms. Continued use after changes constitutes acceptance.
          Material changes will be reflected on this page.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </p>

        <p className="text-sm text-slate-500">
          See also: <Link href="/privacy">Privacy Policy</Link> ·{" "}
          <Link href="/refunds">Refund Policy</Link> ·{" "}
          <Link href="/pricing">Pricing</Link>
        </p>
      </LegalProse>
    </PublicSiteShell>
  );
}
