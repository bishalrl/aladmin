import Link from "next/link";
import { YANTRAMED_SITE } from "@/lib/site/yantramedSite";

const FOOTER_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/account/billing", label: "Manage billing" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refunds", label: "Refund Policy" },
  { href: "/delete-account/yantramed", label: "Delete Account" },
];

export function PublicSiteShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_65%)]" />
      <header className="relative border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="group">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
              {YANTRAMED_SITE.appName}
            </p>
            <p className="text-sm text-slate-500 group-hover:text-slate-700">
              Guided yantra meditation
            </p>
          </Link>
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            {FOOTER_LINKS.slice(0, 4).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active === link.href
                    ? "font-medium text-teal-800"
                    : "text-slate-600 hover:text-teal-800"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/pricing"
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Subscribe
          </Link>
        </div>
      </header>

      <main className="relative flex-1">{children}</main>

      <footer className="relative border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="font-semibold">{YANTRAMED_SITE.appName}</p>
              <p className="mt-2 max-w-sm text-sm text-slate-600">
                {YANTRAMED_SITE.tagline}. Operated by {YANTRAMED_SITE.companyName}.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Support:{" "}
                <a
                  href={`mailto:${YANTRAMED_SITE.supportEmail}`}
                  className="text-teal-800 hover:underline"
                >
                  {YANTRAMED_SITE.supportEmail}
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Legal & account
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-slate-600 hover:text-teal-800">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-8 text-xs text-slate-500">
            © {new Date().getFullYear()} {YANTRAMED_SITE.companyName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function LegalProse({ children }: { children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-12 text-slate-700 [&_a]:text-teal-800 [&_a]:underline [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-slate-900 [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-1">
      {children}
    </article>
  );
}
