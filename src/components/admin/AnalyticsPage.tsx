"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader, Badge } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Analytics = {
  projectSlug: string;
  firebaseStatus: string;
  metrics: Record<
    string,
    { available: boolean; value?: number | null; reason?: string; note?: string }
  >;
};

export function AnalyticsPage({
  project,
  title,
}: {
  project: "budgeting-sathi" | "yantramed";
  title: string;
}) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Analytics>(`/api/admin/projects/${project}/analytics`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [project]);

  return (
    <div>
      <PageHeader
        title={title}
        description="Metrics from Firebase where available. Unavailable metrics are marked explicitly."
      />
      {error ? (
        <EmptyState title="Analytics unavailable" description={error} />
      ) : !data ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <Card className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Firebase connection</p>
              <p className="font-medium">{data.projectSlug}</p>
            </div>
            <Badge
              tone={
                data.firebaseStatus === "connected"
                  ? "success"
                  : data.firebaseStatus === "not_configured"
                    ? "warning"
                    : "danger"
              }
            >
              {data.firebaseStatus}
            </Badge>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(data.metrics).map(([key, metric]) => (
              <Card key={key}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {key}
                </p>
                {metric.available ? (
                  <>
                    <p className="mt-2 text-2xl font-semibold">
                      {metric.value ?? "—"}
                    </p>
                    {metric.note ? (
                      <p className="mt-1 text-xs text-slate-500">{metric.note}</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-lg font-semibold text-slate-400">
                      Unavailable
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{metric.reason}</p>
                  </>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
