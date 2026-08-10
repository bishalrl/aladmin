"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Admin = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
};

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Admin[]>("/api/admin/admins")
      .then(setAdmins)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="RBAC: SUPER_ADMIN, ADMIN, VIEWER"
      />
      {error ? (
        <EmptyState title="Unable to load admins" description={error} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last login</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">{a.role}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.isActive ? "success" : "danger"}>
                      {a.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.lastLoginAt
                      ? new Date(a.lastLoginAt).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
