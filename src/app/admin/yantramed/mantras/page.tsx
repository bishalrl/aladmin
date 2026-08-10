"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  TextArea,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/client/api";

type Mantra = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  audioUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export default function MantrasPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Mantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [audio, setAudio] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await apiGet("/api/admin/yantramed/mantras"));
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!audio) return push("Audio required", "error");
    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    form.set("category", category);
    form.set("sortOrder", sortOrder);
    form.set("audio", audio);
    try {
      await apiSend("/api/admin/yantramed/mantras", { method: "POST", body: form });
      push("Mantra uploaded", "success");
      setTitle("");
      setDescription("");
      setCategory("");
      setAudio(null);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function toggle(item: Mantra) {
    const form = new FormData();
    form.set("isActive", item.isActive ? "false" : "true");
    await apiSend(`/api/admin/yantramed/mantras/${item.id}`, {
      method: "PATCH",
      body: form,
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this mantra?")) return;
    await apiSend(`/api/admin/yantramed/mantras/${id}`, { method: "DELETE" });
    push("Deleted", "success");
    await load();
  }

  return (
    <div>
      <PageHeader title="Mantras" description="YantraMed mantra audio library" />
      <Card className="mb-6">
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input
            label="Sort order"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          <Input
            label="Audio file"
            type="file"
            accept="audio/*"
            onChange={(e) => setAudio(e.target.files?.[0] || null)}
            required
          />
          <div className="md:col-span-2">
            <TextArea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit">Upload mantra</Button>
        </form>
      </Card>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No mantras uploaded" />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{m.title}</p>
                  <Badge tone={m.isActive ? "success" : "neutral"}>
                    {m.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {m.category || "Uncategorized"}
                </p>
                <p className="text-sm text-slate-500">{m.description}</p>
                <audio controls className="mt-2 w-full max-w-md" src={m.audioUrl} />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toggle(m)}>
                  {m.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="danger" onClick={() => remove(m.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
