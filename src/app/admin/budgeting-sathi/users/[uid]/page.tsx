"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  providers: string[];
};

export default function UserDetailPage() {
  const params = useParams<{ uid: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<User>(`/api/admin/projects/budgeting-sathi/users/${params.uid}`)
      .then(setUser)
      .catch((e) => setError(e.message));
  }, [params.uid]);

  return (
    <div>
      <PageHeader
        title="User details"
        description="Budgeting Sathi Firebase user"
        actions={
          <Link href="/admin/budgeting-sathi/users" className="text-sm text-teal-700">
            Back to users
          </Link>
        }
      />
      {error ? (
        <EmptyState title="User unavailable" description={error} />
      ) : !user ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                {user.displayName || user.email || user.uid}
              </h2>
              <p className="font-mono text-xs text-slate-500">{user.uid}</p>
            </div>
            <Badge tone={user.disabled ? "danger" : "success"}>
              {user.disabled ? "Disabled" : "Active"}
            </Badge>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium">{user.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium">{user.phoneNumber || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email verified</dt>
              <dd className="font-medium">{user.emailVerified ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Providers</dt>
              <dd className="font-medium">{user.providers.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Created</dt>
              <dd className="font-medium">
                {user.createdAt ? new Date(user.createdAt).toLocaleString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Last sign-in</dt>
              <dd className="font-medium">
                {user.lastSignInAt
                  ? new Date(user.lastSignInAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  );
}
