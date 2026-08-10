"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  TextArea,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/client/api";

type RequestItem = {
  id: string;
  email: string;
  reason: string | null;
  status: string;
  createdAt: string;
  project: { name: string; slug: string };
};

export default function AccountDeletionAdminPage() {
  const { push } = useToast();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet<{ items: RequestItem[] }>(
        `/api/admin/account-deletion?status=${status}`,
      );
      setItems(data.items);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [status]);

  async function review(
    id: string,
    action: "approve" | "reject" | "complete_manual",
  ) {
    if (action === "approve") {
      if (
        !confirm(
          "Delete this user via Firebase Admin for this project only? Prefer “Mark completed” if you already deleted them in Firebase Console.",
        )
      ) {
        return;
      }
    }
    if (action === "complete_manual") {
      if (
        !confirm(
          "Confirm you already deleted this account in the correct Firebase project, then mark this request completed?",
        )
      ) {
        return;
      }
    }

    try {
      await apiSend(`/api/admin/account-deletion/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNotes: notes[id] || undefined,
        }),
      });
      push(
        action === "reject"
          ? "Request rejected"
          : "Request marked completed",
        "success",
      );
      await load();
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Account Deletion"
        description="Separate queues by project. Soft requests from public URLs — no Firebase load until you choose to act."
      />
      <Card className="mb-4 max-w-xs">
        <Select
          label="Status filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </Card>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No requests" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.email}</p>
                  <p className="text-sm text-slate-500">
                    {item.project.name} ·{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                  {item.reason ? (
                    <p className="mt-2 text-sm text-slate-600">{item.reason}</p>
                  ) : null}
                </div>
                <Badge
                  tone={
                    item.status === "PENDING"
                      ? "warning"
                      : item.status === "COMPLETED"
                        ? "success"
                        : "neutral"
                  }
                >
                  {item.status}
                </Badge>
              </div>
              {item.status === "PENDING" ? (
                <div className="mt-4 space-y-3">
                  <TextArea
                    label="Admin notes"
                    value={notes[item.id] || ""}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => review(item.id, "complete_manual")}
                    >
                      Mark completed
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => review(item.id, "approve")}
                    >
                      Delete via Firebase (optional)
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => review(item.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
