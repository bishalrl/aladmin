"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Audit = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  admin?: { name: string; email: string } | null;
  project?: { name: string } | null;
};

export default function AuditLogsPage() {
  const [items, setItems] = useState<Audit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ items: Audit[] }>("/api/admin/audit-logs")
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Audit Logs" description="Important admin actions" />
      {error ? (
        <EmptyState title="Unable to load audit logs" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No audit events yet" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Resource</th>
                <th className="px-4 py-3 text-left">Project</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{a.action}</td>
                  <td className="px-4 py-3">{a.admin?.name || "—"}</td>
                  <td className="px-4 py-3">
                    {a.resourceType}
                    {a.resourceId ? ` · ${a.resourceId.slice(0, 8)}` : ""}
                  </td>
                  <td className="px-4 py-3">{a.project?.name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
