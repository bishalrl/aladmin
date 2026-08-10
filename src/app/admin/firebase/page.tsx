"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  PageHeader,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet } from "@/lib/client/api";

type Health = {
  projectKey: string;
  displayName?: string;
  projectId?: string | null;
  status: string;
  message: string;
  configured?: boolean;
};

export default function FirebaseConnectionPage() {
  const { push } = useToast();
  const [health, setHealth] = useState<Health[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async (live = true) => {
    setLoading(true);
    try {
      const data = await apiGet<{ firebase: Health[] }>(
        `/api/admin/health?live=${live ? "1" : "0"}`,
      );
      setHealth(data.firebase);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed to load status", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    void load(true);
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Firebase Connection"
        description="Connect Admin SDK service accounts so Users & deletion can talk to each Firebase project. Banner/music/mantra APIs work without this."
        actions={
          <Button
            disabled={testing || loading}
            onClick={async () => {
              setTesting(true);
              try {
                await load(true);
                push("Live connection test finished", "success");
              } finally {
                setTesting(false);
              }
            }}
          >
            {testing ? "Testing…" : "Test connection now"}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {loading && health.length === 0 ? (
          <Card className="lg:col-span-2">
            <p className="text-sm text-slate-500">Checking Firebase…</p>
          </Card>
        ) : (
          health.map((h) => (
            <Card key={h.projectKey}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {h.displayName || h.projectKey}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    {h.projectId || "project id missing"}
                  </p>
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
              <p className="mt-4 text-sm text-slate-600">{h.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={
                    h.projectKey === "budgeting-sathi"
                      ? "/admin/budgeting-sathi/users"
                      : "/admin/yantramed/users"
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Open users
                </Link>
                <Link
                  href={
                    h.projectKey === "budgeting-sathi"
                      ? "/admin/projects/budgeting-sathi"
                      : "/admin/projects/yantramed"
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Project overview
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="mb-6 border-amber-200 bg-amber-50">
        <p className="font-semibold text-amber-950">
          Important: google-services.json is not enough
        </p>
        <p className="mt-2 text-sm text-amber-900/90">
          Your folders <code>src/yantrajson/</code> and{" "}
          <code>src/budgetingsathijson/</code> contain Android{" "}
          <strong>google-services.json</strong> (for the mobile apps). The admin
          panel needs a different file: a <strong>Service Account</strong> JSON
          that includes <code>private_key</code> and <code>client_email</code>.
        </p>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-slate-900">
          How to connect (5 minutes)
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-slate-600">
          <li>
            Open{" "}
            <a
              className="text-teal-700 underline"
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Firebase Console
            </a>
          </li>
          <li>
            Select <strong>aarthik-cce43</strong> (Budgeting Sathi) or{" "}
            <strong>yantramed</strong>
          </li>
          <li>
            Project settings → <strong>Service accounts</strong> →{" "}
            <strong>Generate new private key</strong>
          </li>
          <li>
            The downloaded file should look like this (not google-services.json):
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
{`{
  "type": "service_account",
  "project_id": "yantramed",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...",
  "client_email": "firebase-adminsdk-...@yantramed.iam.gserviceaccount.com"
}`}
            </pre>
          </li>
          <li>
            Save into:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
{`secrets/aarthik-cce43.json   ← Budgeting Sathi
secrets/yantramed.json       ← YantraMed`}
            </pre>
          </li>
          <li>
            Restart <code>npm run dev</code>, then click{" "}
            <strong>Test connection now</strong>
          </li>
        </ol>
      </Card>
    </div>
  );
}
