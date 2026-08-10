"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { push } = useToast();
  const [health, setHealth] = useState<
    { projectKey: string; status: string; message: string }[]
  >([]);
  const [testing, setTesting] = useState(false);

  async function load(live = false) {
    const d = await apiGet<{ firebase: typeof health }>(
      `/api/admin/health${live ? "?live=1" : ""}`,
    );
    setHealth(d.firebase);
  }

  useEffect(() => {
    void load(false);
  }, []);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="This admin app does not load Firebase Web/CDN scripts. Content (banners, music, mantras) uses your server disk + Postgres only."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">What this platform controls</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
            <li>
              <strong>Budgeting Sathi</strong> — brands, banner ads (image + URL
              on disk), public banner API, optional users view
            </li>
            <li>
              <strong>YantraMed</strong> — background music & mantras on disk,
              public APIs
            </li>
            <li>
              Separate delete-account URLs per project (soft request → admin
              review)
            </li>
          </ul>
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-semibold">Firebase (optional)</h2>
            <Button
              variant="secondary"
              disabled={testing}
              onClick={async () => {
                setTesting(true);
                try {
                  await load(true);
                  push("Live probe finished", "info");
                } catch (e) {
                  push(e instanceof Error ? e.message : "Failed", "error");
                } finally {
                  setTesting(false);
                }
              }}
            >
              {testing ? "Testing…" : "Test connection"}
            </Button>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Web apiKey / &lt;script&gt; configs are for mobile apps only. Admin
            user listing needs a service account if you want it — never required
            for banner/music APIs.
          </p>
          <div className="space-y-2">
            {health.map((h) => (
              <div
                key={h.projectKey}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{h.projectKey}</p>
                  <p className="text-xs text-slate-500">{h.message}</p>
                </div>
                <Badge
                  tone={
                    h.status === "connected" || h.status === "ready"
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
      </div>
    </div>
  );
}
