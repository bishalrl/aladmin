"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  TextArea,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/client/api";

type Yantra = {
  id: string;
  name: string;
  slug: string;
  focus: string;
  in_course: boolean;
  show_on_home: boolean;
};

type Mantra = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  audioUrl: string;
  sortOrder: number;
  isActive: boolean;
  yantraId: string | null;
  yantra: { id: string; name: string; slug: string; focus: string } | null;
};

export default function MantrasPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Mantra[]>([]);
  const [yantras, setYantras] = useState<Yantra[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [yantraId, setYantraId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [audio, setAudio] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [mantras, yantraList] = await Promise.all([
        apiGet<Mantra[]>("/api/admin/yantramed/mantras"),
        fetch("/api/v1/yantramed/yantras?home=true")
          .then((r) => r.json())
          .then((json) => {
            if (!json.success) throw new Error(json.message || "Failed to load yantras");
            return json.data as Yantra[];
          }),
      ]);
      setItems(mantras);
      setYantras(yantraList);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function onYantraChange(id: string) {
    setYantraId(id);
    const y = yantras.find((item) => item.id === id);
    if (y && !title.trim()) {
      setTitle(`${y.name} Mantra`);
    }
    if (y && !category.trim()) {
      setCategory(y.focus);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!yantraId) return push("Select a yantra", "error");
    if (!audio) return push("Audio required", "error");
    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    form.set("category", category);
    form.set("yantraId", yantraId);
    form.set("sortOrder", sortOrder);
    form.set("audio", audio);
    try {
      await apiSend("/api/admin/yantramed/mantras", { method: "POST", body: form });
      push("Mantra uploaded", "success");
      setTitle("");
      setDescription("");
      setCategory("");
      setYantraId("");
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
      <PageHeader
        title="Mantras"
        description="Upload one mantra audio per yantra (6 total). Course days reuse the mantra for that day's yantra."
      />
      <Card className="mb-6">
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
          <Select
            label="Yantra"
            value={yantraId}
            onChange={(e) => onYantraChange(e.target.value)}
            required
          >
            <option value="">Select yantra…</option>
            {yantras.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name} — {y.focus}
              </option>
            ))}
          </Select>
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{m.title}</p>
                  <Badge tone={m.isActive ? "success" : "neutral"}>
                    {m.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {m.yantra ? (
                    <Badge tone="warning">{m.yantra.name}</Badge>
                  ) : (
                    <Badge tone="neutral">No yantra</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {m.yantra?.focus || m.category || "Uncategorized"}
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
