"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  label: string;
  href?: string;
  hint?: string;
  children?: { label: string; href: string; hint?: string }[];
};

const NAV: NavItem[] = [
  { label: "Home", href: "/admin", hint: "Overview & shortcuts" },
  {
    label: "Firebase",
    href: "/admin/firebase",
    hint: "Connect both apps",
  },
  {
    label: "Budgeting Sathi",
    children: [
      { label: "Overview", href: "/admin/projects/budgeting-sathi" },
      { label: "Banner Ads", href: "/admin/budgeting-sathi/banners", hint: "Image/video + link" },
      { label: "Brands", href: "/admin/budgeting-sathi/brands" },
      { label: "Users", href: "/admin/budgeting-sathi/users", hint: "Needs Firebase" },
      { label: "Analytics", href: "/admin/budgeting-sathi/analytics" },
    ],
  },
  {
    label: "YantraMed",
    children: [
      { label: "Overview", href: "/admin/projects/yantramed" },
      { label: "30-Day Course", href: "/admin/yantramed/course", hint: "Day schedule" },
      { label: "Yantras", href: "/admin/yantramed/yantras" },
      { label: "Mantras", href: "/admin/yantramed/mantras", hint: "6 total — one per yantra" },
      { label: "Daily Music", href: "/admin/yantramed/music", hint: "One track per day 1–30" },
      { label: "Users", href: "/admin/yantramed/users", hint: "Needs Firebase" },
      { label: "Analytics", href: "/admin/yantramed/analytics" },
    ],
  },
  {
    label: "Account Deletion",
    href: "/admin/account-deletion",
    hint: "Review requests",
  },
  {
    label: "Developer",
    children: [
      { label: "API Docs", href: "/admin/api/docs" },
      { label: "API Keys", href: "/admin/api/keys" },
      { label: "API Logs", href: "/admin/api/logs" },
      { label: "Media library", href: "/admin/media/banners" },
    ],
  },
  {
    label: "System",
    children: [
      { label: "Settings", href: "/admin/system/settings" },
      { label: "Admin Users", href: "/admin/system/admins" },
      { label: "Audit Logs", href: "/admin/system/audit-logs" },
    ],
  },
];

function NavLink({
  href,
  label,
  hint,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  hint?: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block rounded-lg px-3 py-2 transition ${
        active
          ? "bg-teal-800/80 text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="block text-sm font-medium">{label}</span>
      {hint ? (
        <span className={`block text-[11px] ${active ? "text-teal-100/80" : "text-slate-500"}`}>
          {hint}
        </span>
      ) : null}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300/90">
          Central Admin
        </p>
        <p className="mt-1 text-lg font-semibold text-white">Control Center</p>
        <p className="mt-1 text-xs text-slate-400">
          Budgeting Sathi · YantraMed
        </p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((item) => (
          <div key={item.label}>
            {item.href ? (
              <NavLink
                href={item.href}
                label={item.label}
                hint={item.hint}
                active={
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
                }
                onNavigate={() => setOpen(false)}
              />
            ) : (
              <>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <div className="space-y-0.5">
                  {item.children?.map((child) => (
                    <NavLink
                      key={child.href}
                      href={child.href}
                      label={child.label}
                      hint={child.hint}
                      active={
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`)
                      }
                      onNavigate={() => setOpen(false)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={logout}
          disabled={loggingOut}
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-50"
        >
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm lg:hidden"
        onClick={() => setOpen(true)}
      >
        Menu
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 h-full w-80 bg-sidebar shadow-xl">
            {content}
          </aside>
        </div>
      ) : null}
      <aside className="hidden w-80 shrink-0 bg-sidebar lg:block">{content}</aside>
    </>
  );
}
