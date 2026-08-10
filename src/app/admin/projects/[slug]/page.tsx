"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  PageHeader,
} from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Project = {
  id: string;
  name: string;
  slug: string;
  status: string;
  firebaseProjectId: string | null;
  type: string;
};

type Health = {
  projectKey: string;
  status: string;
  message: string;
  displayName?: string;
};

const BS_FEATURES = [
  {
    href: "/admin/budgeting-sathi/banners",
    title: "Banner Ads",
    desc: "Image or video on disk + optional brand link → public banners API",
    primary: true,
  },
  {
    href: "/admin/budgeting-sathi/brands",
    title: "Brands",
    desc: "Advertisers linked to banners",
  },
  {
    href: "/admin/budgeting-sathi/users",
    title: "Firebase Users",
    desc: "List Auth users (needs Firebase connection)",
  },
  {
    href: "/admin/budgeting-sathi/analytics",
    title: "Analytics",
    desc: "Available metrics & placeholders",
  },
];

const YM_FEATURES = [
  {
    href: "/admin/yantramed/course",
    title: "30-Day Course",
    desc: "Day rotation, duration, focus — schedule for the app",
    primary: true,
  },
  {
    href: "/admin/yantramed/mantras",
    title: "Mantras",
    desc: "Upload mantra audio per yantra → day mantra API",
    primary: true,
  },
  {
    href: "/admin/yantramed/music",
    title: "Daily Music",
    desc: "Upload music per course day → day music API",
    primary: true,
  },
  {
    href: "/admin/yantramed/yantras",
    title: "Yantras",
    desc: "Sri, Kali, Durga, Saraswati, Ganesha, Tara",
  },
  {
    href: "/admin/yantramed/users",
    title: "Firebase Users",
    desc: "List Auth users (needs Firebase connection)",
  },
  {
    href: "/admin/yantramed/analytics",
    title: "Analytics",
    desc: "Available metrics & placeholders",
  },
];

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [project, setProject] = useState<Project | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    apiGet<Project[]>("/api/admin/projects").then((list) => {
      setProject(list.find((x) => x.slug === slug) || null);
    });
    apiGet<{ firebase: Health[] }>("/api/admin/health?live=1")
      .then((d) => {
        setHealth(
          d.firebase.find((h) => h.projectKey === slug) || null,
        );
      })
      .catch(() => undefined);
  }, [slug]);

  const features = slug === "budgeting-sathi" ? BS_FEATURES : YM_FEATURES;
  const apiHint =
    slug === "budgeting-sathi"
      ? "GET /api/v1/budgeting-sathi/banners"
      : "GET /api/v1/yantramed/course/days/:day/mantra then .../music";

  return (
    <div>
      <PageHeader
        title={project?.name || slug || "Project"}
        description="Everything for this app in one place"
        actions={
          <Link href="/admin/firebase">
            <Button variant="secondary">Firebase status</Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          {project ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Slug</dt>
                <dd className="font-mono">{project.slug}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge
                    tone={project.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {project.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Firebase project</dt>
                <dd>{project.firebaseProjectId || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Public API</dt>
                <dd className="font-mono text-xs">{apiHint}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Loading project…</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Firebase
          </p>
          {health ? (
            <>
              <div className="mt-2">
                <Badge
                  tone={
                    health.status === "connected"
                      ? "success"
                      : health.status === "not_configured"
                        ? "warning"
                        : "danger"
                  }
                >
                  {health.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{health.message}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Checking…</p>
          )}
          <Link
            href="/admin/firebase"
            className="mt-3 inline-block text-sm text-teal-700"
          >
            Connect / test →
          </Link>
        </Card>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Features
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="group">
            <Card
              className={`h-full transition group-hover:border-teal-300 group-hover:shadow-md ${
                f.primary ? "border-teal-200 bg-teal-50/40" : ""
              }`}
            >
              <p className="font-semibold text-slate-900">{f.title}</p>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              <p className="mt-3 text-sm font-medium text-teal-700">Open →</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
