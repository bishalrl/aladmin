import type { Metadata } from "next";
import Link from "next/link";
import { LegalProse, PublicSiteShell } from "@/components/site/PublicSiteShell";
import { LEGAL_LAST_UPDATED, YANTRAMED_SITE } from "@/lib/site/yantramedSite";

export const metadata: Metadata = {
  title: `Refund Policy — ${YANTRAMED_SITE.appName}`,
};

export default function RefundsPage() {
  const { appName, companyName, supportEmail, pricing } = YANTRAMED_SITE;

  return (
    <PublicSiteShell active="/refunds">
      <LegalProse>
        <h1>Refund Policy</h1>
        <p className="text-slate-500">Last updated: {LEGAL_LAST_UPDATED}</p>

        <p>
          This Refund Policy applies to {appName} subscriptions billed by {companyName}{" "}
          through our payment provider.
        </p>

        <h2>1. Subscription price</h2>
        <p>
          {appName} is offered at <strong>{pricing.display}</strong>. Your payment method
          is charged at the start of each billing period.
        </p>

        <h2>2. Cancellation</h2>
        <p>
          You may cancel your subscription at any time. After cancellation, you retain
          access until the end of the current paid billing period. Cancellation does not
          automatically delete your account.
        </p>

        <h2>3. Refund eligibility</h2>
        <p>We offer refunds in the following cases:</p>
        <ul>
          <li>
            <strong>Within 7 days of first purchase:</strong> full refund if you have not
            substantially used the course (e.g. completed more than 3 days)
          </li>
          <li>
            <strong>Billing errors:</strong> duplicate charges or incorrect amounts
          </li>
          <li>
            <strong>Technical failure:</strong> prolonged inability to access paid content
            due to a fault on our side
          </li>
        </ul>
        <p>
          Renewals after the first billing period are generally non-refundable except where
          required by applicable law or at our discretion for exceptional circumstances.
        </p>

        <h2>4. How to request a refund</h2>
        <p>
          Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with:
        </p>
        <ul>
          <li>Account email address</li>
          <li>Date of purchase</li>
          <li>Reason for the refund request</li>
        </ul>
        <p>We aim to respond within 5 business days.</p>

        <h2>5. Chargebacks</h2>
        <p>
          Please contact us before initiating a chargeback so we can resolve the issue
          directly. Unauthorized chargebacks may result in account suspension.
        </p>

        <h2>6. Contact</h2>
        <p>
          {companyName} — <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </p>

        <p className="text-sm text-slate-500">
          See also: <Link href="/terms">Terms of Service</Link> ·{" "}
          <Link href="/privacy">Privacy Policy</Link> ·{" "}
          <Link href="/pricing">Pricing</Link>
        </p>
      </LegalProse>
    </PublicSiteShell>
  );
}
