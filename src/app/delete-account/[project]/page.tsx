import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeleteAccountForm } from "@/components/site/DeleteAccountForm";
import { PublicSiteShell } from "@/components/site/PublicSiteShell";
import { YANTRAMED_SITE } from "@/lib/site/yantramedSite";

const LABELS: Record<string, { app: string; developer: string }> = {
  yantramed: {
    app: "YantraMed",
    developer: YANTRAMED_SITE.companyName,
  },
  "budgeting-sathi": {
    app: "Budgeting Sathi",
    developer: YANTRAMED_SITE.companyName,
  },
};

type Props = { params: Promise<{ project: string }> };

/** Static HTML for Play Store / crawlers (less likely to fail bot checks). */
export function generateStaticParams() {
  return [{ project: "yantramed" }, { project: "budgeting-sathi" }];
}

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project } = await params;
  const info = LABELS[project];
  if (!info) return { title: "Delete account" };
  return {
    title: `Delete ${info.app} account — ${info.developer}`,
    description: `Request deletion of your ${info.app} account and data. Developer: ${info.developer}.`,
    robots: { index: true, follow: true },
  };
}

export default async function DeleteAccountPage({ params }: Props) {
  const { project } = await params;
  const info = LABELS[project];
  if (!info) notFound();

  const { app, developer } = info;
  const support = YANTRAMED_SITE.supportEmail;

  return (
    <PublicSiteShell active="/delete-account/yantramed">
      <article className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
          Account deletion · Google Play
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Delete your {app} account
        </h1>
        <p className="mt-3 text-slate-600">
          This page is for the mobile app <strong>{app}</strong>, published by{" "}
          <strong>{developer}</strong>. Use it to request permanent deletion of
          your account and associated personal data.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            How to request account deletion
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700">
            <li>
              Open this page:{" "}
              <strong>
                {YANTRAMED_SITE.website}/delete-account/{project}
              </strong>
            </li>
            <li>
              Enter the <strong>email address</strong> you use to sign in to {app}{" "}
              (Google / Firebase account email).
            </li>
            <li>
              Optionally add a short reason, then tap{" "}
              <strong>Submit deletion request</strong>.
            </li>
            <li>
              We will confirm by email when possible and process your request. You
              do not need to keep the app installed after submitting.
            </li>
            <li>
              To cancel a pending request, email{" "}
              <a className="text-teal-800 underline" href={`mailto:${support}`}>
                {support}
              </a>{" "}
              before deletion is completed.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Data that is deleted
          </h2>
          <p className="mt-2 text-slate-600">
            After we approve your request, we delete or anonymize:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>Account profile (email, display name, auth identifiers)</li>
            <li>App progress and usage data stored for {app}</li>
            <li>Subscription / entitlement records tied to your account in our systems</li>
            <li>Support messages linked to your account (where stored by us)</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Data that may be kept
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
            <li>
              <strong>Billing records</strong> required for tax, accounting, fraud
              prevention, or payment-provider obligations (e.g. invoices processed by
              Paddle) — retained as required by law
            </li>
            <li>
              <strong>Security / audit logs</strong> for a limited period to detect
              abuse
            </li>
            <li>
              Data already deleted from backups may remain until those backups expire
              on their normal schedule
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Retention period
          </h2>
          <p className="mt-2 text-slate-700">
            We aim to complete account and personal-data deletion within{" "}
            <strong>30 days</strong> of receiving a valid request. Some billing or
            legal records may be retained longer where required by applicable law
            (typically up to the statutory retention period for financial records).
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Submit your request
          </h2>
          <p className="mt-2 mb-6 text-sm text-slate-600">
            Developer: {developer} · App: {app} · Support: {support}
          </p>
          <DeleteAccountForm project={project} />
        </section>
      </article>
    </PublicSiteShell>
  );
}
