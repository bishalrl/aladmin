"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui/primitives";

type DashboardData = {
  cards: {
    totalApplications: number;
    budgetingSathiUsers: {
      available: boolean;
      value?: number | null;
      reason?: string;
    };
    yantraMedUsers: {
      available: boolean;
      value?: number | null;
      reason?: string;
    };
    activeBannerAds: number;
    activeMantras: number;
    backgroundMusic: number;
    pendingDeletions: number;
  };
  firebaseHealth: {
    projectKey: string;
    displayName?: string;
    status: string;
    message: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    admin?: { name: string } | null;
    project?: { name: string } | null;
  }[];
};

const QUICK = [
  {
    title: "Budgeting Sathi banners",
    desc: "Upload image or video + optional brand link",
    href: "/admin/budgeting-sathi/banners",
    tag: "Ads API",
  },
  {
    title: "YantraMed course days",
    desc: "30-day schedule · mantra then music per day",
    href: "/admin/yantramed/course",
    tag: "Course",
  },
  {
    title: "Upload mantras",
    desc: "Audio linked to each yantra",
    href: "/admin/yantramed/mantras",
    tag: "Audio",
  },
  {
    title: "Upload daily music",
    desc: "Assign music to course day 1–30",
    href: "/admin/yantramed/music",
    tag: "Audio",
  },
  {
    title: "Account deletion queue",
    desc: "Review soft delete requests",
    href: "/admin/account-deletion",
    tag: "Safety",
  },
  {
    title: "API documentation",
    desc: "Copy endpoints for mobile apps",
    href: "/admin/api/docs",
    tag: "Developer",
  },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message);
        setData(json.data);
      })
      .catch((e) => setError(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description={
          error ||
          "Ensure PostgreSQL is running and migrations/seed have been applied."
        }
      />
    );
  }

  const firebaseOk = data.firebaseHealth.every((h) => h.status === "connected");
  const firebaseMissing = data.firebaseHealth.some(
    (h) => h.status === "not_configured",
  );

  return (
    <div>
      <PageHeader
        title="Control Center"
        description="Manage Budgeting Sathi ads and YantraMed course media from one place."
        actions={
          <Link href="/admin/firebase">
            <Button variant={firebaseOk ? "secondary" : "primary"}>
              {firebaseOk ? "Firebase connected" : "Connect Firebase"}
            </Button>
          </Link>
        }
      />

      {firebaseMissing ? (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-amber-950">
                Firebase Admin is not connected yet
              </p>
              <p className="mt-1 text-sm text-amber-900/80">
                Banner ads, mantras, and music APIs still work. Users & live
                Firebase data need a service-account JSON in{" "}
                <code>secrets/</code>.
              </p>
            </div>
            <Link href="/admin/firebase">
              <Button>Fix connection</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Link href="/admin/projects/budgeting-sathi" className="group">
          <Card className="h-full transition group-hover:border-teal-300 group-hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  App 1
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Budgeting Sathi
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Brands, banner ads (image/video + link), users & analytics
                </p>
              </div>
              <Badge tone="success">{data.cards.activeBannerAds} banners</Badge>
            </div>
            <p className="mt-4 text-sm font-medium text-teal-700">
              Open Budgeting Sathi →
            </p>
          </Card>
        </Link>

        <Link href="/admin/projects/yantramed" className="group">
          <Card className="h-full transition group-hover:border-teal-300 group-hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  App 2
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  YantraMed
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  6 yantras, 30-day course, mantras & daily music APIs
                </p>
              </div>
              <Badge tone="success">
                {data.cards.activeMantras} mantras · {data.cards.backgroundMusic}{" "}
                music
              </Badge>
            </div>
            <p className="mt-4 text-sm font-medium text-teal-700">
              Open YantraMed →
            </p>
          </Card>
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        What you use most
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {QUICK.map((q) => (
          <Link key={q.href} href={q.href} className="group">
            <Card className="h-full transition group-hover:border-teal-300">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {q.tag}
              </p>
              <p className="mt-1 font-semibold text-slate-900">{q.title}</p>
              <p className="mt-1 text-sm text-slate-500">{q.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Apps"
          value={data.cards.totalApplications}
        />
        <StatCard
          label="Pending deletions"
          value={data.cards.pendingDeletions}
        />
        <StatCard label="Active banners" value={data.cards.activeBannerAds} />
        <StatCard
          label="Course audio"
          value={`${data.cards.activeMantras + data.cards.backgroundMusic}`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Firebase status</h2>
            <Link href="/admin/firebase" className="text-sm text-teal-700">
              Manage
            </Link>
          </div>
          <div className="space-y-2">
            {data.firebaseHealth.map((h) => (
              <div
                key={h.projectKey}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {h.displayName || h.projectKey}
                  </p>
                  <p className="text-xs text-slate-500">{h.message}</p>
                </div>
                <Badge
                  tone={
                    h.status === "connected"
                      ? "success"
                      : h.status === "not_configured"
                        ? "warning"
                        : "danger"
                  }
                >
                  {h.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-900">Recent activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No admin actions yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentActivity.slice(0, 6).map((a) => (
                <li key={a.id} className="text-sm">
                  <p className="font-medium text-slate-800">{a.action}</p>
                  <p className="text-xs text-slate-500">
                    {a.admin?.name || "System"}
                    {a.project ? ` · ${a.project.name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
