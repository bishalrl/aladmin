"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/client/api";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  createdAt: string;
  project?: { name: string } | null;
};

export default function ApiKeysPage() {
  const { push } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [createdOnce, setCreatedOnce] = useState<string | null>(null);

  async function load() {
    setKeys(await apiGet("/api/admin/api-keys"));
  }

  useEffect(() => {
    void load().catch((e) => push(e.message, "error"));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    try {
      const created = await apiSend<{ apiKey: string }>("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setCreatedOnce(created.apiKey);
      setName("");
      push("API key created — copy it now", "success");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this API key?")) return;
    await apiSend(`/api/admin/api-keys/${id}`, { method: "DELETE" });
    push("Revoked", "success");
    await load();
  }

  return (
    <div>
      <PageHeader
        title="API Keys"
        description="Optional keys for public mobile APIs when PUBLIC_API_REQUIRE_KEY=true"
      />
      <Card className="mb-6">
        <form onSubmit={onCreate} className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              label="Key name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit">Create key</Button>
          </div>
        </form>
        {createdOnce ? (
          <p className="mt-4 break-all rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Copy now (shown once): <code>{createdOnce}</code>
          </p>
        ) : null}
      </Card>
      {keys.length === 0 ? (
        <EmptyState title="No API keys" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Prefix</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t">
                  <td className="px-4 py-3">{k.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{k.keyPrefix}…</td>
                  <td className="px-4 py-3">
                    {new Date(k.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => revoke(k.id)}>
                      Revoke
                    </Button>
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
