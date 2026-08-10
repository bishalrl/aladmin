"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Log = {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string | null;
  responseMs: number | null;
  createdAt: string;
};

export default function ApiLogsPage() {
  const [items, setItems] = useState<Log[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ items: Log[] }>("/api/admin/api-logs")
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="API Logs" description="Recent public API request logs" />
      {error ? (
        <EmptyState title="Unable to load logs" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No API logs yet" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Path</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">ms</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{l.method}</td>
                  <td className="px-4 py-3 font-mono text-xs">{l.path}</td>
                  <td className="px-4 py-3">{l.statusCode}</td>
                  <td className="px-4 py-3">{l.responseMs ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
