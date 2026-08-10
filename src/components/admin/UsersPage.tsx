"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export function UsersPage({
  project,
  title,
}: {
  project: "budgeting-sathi" | "yantramed";
  title: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(token?: string | null, q?: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (token) params.set("pageToken", token);
      if (q) params.set("search", q);
      params.set("limit", "50");
      const data = await apiGet<{
        users: User[];
        pageToken: string | null;
      }>(`/api/admin/projects/${project}/users?${params}`);
      setUsers(data.users);
      setNextToken(data.pageToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(null, "");
  }, [project]);

  return (
    <div>
      <PageHeader
        title={title}
        description="Firebase Authentication users for this project only"
      />
      <Card className="mb-4">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setPageToken(null);
            void load(null, search);
          }}
        >
          <div className="flex-1">
            <Input
              placeholder="Search email, name, uid, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500">Loading users…</p>
      ) : error ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-950">Cannot load Firebase users</p>
          <p className="mt-1 text-sm text-amber-900/80">{error}</p>
          <Link
            href="/admin/firebase"
            className="mt-3 inline-block text-sm font-medium text-teal-800 underline"
          >
            Open Firebase Connection setup →
          </Link>
        </Card>
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Last sign-in</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/${project}/users/${u.uid}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {u.displayName || u.email || u.uid}
                    </Link>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {u.uid}
                    </p>
                  </td>
                  <td className="px-4 py-3">{u.phoneNumber || "—"}</td>
                  <td className="px-4 py-3">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.lastSignInAt
                      ? new Date(u.lastSignInAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.disabled ? "danger" : "success"}>
                      {u.disabled ? "Disabled" : "Active"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          disabled={!pageToken && !nextToken}
          onClick={() => {
            setPageToken(null);
            void load(null, search);
          }}
        >
          First page
        </Button>
        <Button
          variant="secondary"
          disabled={!nextToken}
          onClick={() => {
            setPageToken(nextToken);
            void load(nextToken, search);
          }}
        >
          Next page
        </Button>
      </div>
    </div>
  );
}
