import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse, PublicSiteShell } from "@/components/site/PublicSiteShell";
import { LEGAL_LAST_UPDATED, YANTRAMED_SITE } from "@/lib/site/yantramedSite";

export const metadata: Metadata = {
  title: `Privacy Policy — ${YANTRAMED_SITE.appName}`,
};

export default function PrivacyPage() {
  const { appName, companyName, supportEmail, website } = YANTRAMED_SITE;

  return (
    <PublicSiteShell active="/privacy">
      <LegalProse>
        <h1>Privacy Policy</h1>
        <p className="text-slate-500">Last updated: {LEGAL_LAST_UPDATED}</p>

        <p>
          {companyName} (&quot;we&quot;) operates {appName} at {website}. This Privacy
          Policy explains how we collect, use, and protect your information.
        </p>

        <h2>1. Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> email address and authentication data
            when you create an account
          </li>
          <li>
            <strong>Usage data:</strong> course progress, session activity, and app
            interactions
          </li>
          <li>
            <strong>Payment data:</strong> processed by our payment provider (e.g. Paddle).
            We do not store full card numbers on our servers
          </li>
          <li>
            <strong>Support communications:</strong> messages you send to {supportEmail}
          </li>
        </ul>

        <h2>2. How we use information</h2>
        <ul>
          <li>Provide and maintain the Service</li>
          <li>Track course progress and subscription status</li>
          <li>Process payments and prevent fraud</li>
          <li>Respond to support and account deletion requests</li>
          <li>Improve the app and fix technical issues</li>
        </ul>

        <h2>3. Sharing</h2>
        <p>We may share data with:</p>
        <ul>
          <li>Payment processors (billing)</li>
          <li>Authentication and infrastructure providers (e.g. Firebase, hosting)</li>
          <li>Legal authorities when required by law</li>
        </ul>
        <p>We do not sell your personal information.</p>

        <h2>4. Data retention</h2>
        <p>
          We retain account data while your subscription is active and for a reasonable
          period afterward for legal, billing, and support purposes. You may request
          deletion via{" "}
          <Link href="/delete-account/yantramed">
            {website}/delete-account/yantramed
          </Link>
          .
        </p>

        <h2>5. Security</h2>
        <p>
          We use industry-standard measures to protect data. No method of transmission
          over the internet is 100% secure.
        </p>

        <h2>6. Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, or delete
          your personal data. Contact us at{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>

        <h2>7. Children</h2>
        <p>
          {appName} is not directed to children under 13. We do not knowingly collect data
          from children.
        </p>

        <h2>8. Changes</h2>
        <p>We may update this policy. The &quot;Last updated&quot; date will change accordingly.</p>

        <h2>9. Contact</h2>
        <p>
          {companyName} — <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </p>

        <p className="text-sm text-slate-500">
          See also: <Link href="/terms">Terms of Service</Link> ·{" "}
          <Link href="/refunds">Refund Policy</Link>
        </p>
      </LegalProse>
    </PublicSiteShell>
  );
}
