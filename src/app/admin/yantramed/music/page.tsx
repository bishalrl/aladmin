"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type CourseDay = {
  day: number;
  yantra: { name: string; focus: string };
  has_music: boolean;
};

type Music = {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  sortOrder: number;
  isActive: boolean;
  duration: number | null;
  dayNumber: number | null;
};

export default function MusicPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Music[]>([]);
  const [courseDays, setCourseDays] = useState<CourseDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [dayNumber, setDayNumber] = useState("");
  const [audio, setAudio] = useState<File | null>(null);

  const takenDays = useMemo(
    () => new Set(items.filter((m) => m.dayNumber != null).map((m) => m.dayNumber)),
    [items],
  );

  async function load() {
    setLoading(true);
    try {
      const [music, course] = await Promise.all([
        apiGet<Music[]>("/api/admin/yantramed/music"),
        fetch("/api/v1/yantramed/course")
          .then((r) => r.json())
          .then((json) => {
            if (!json.success) throw new Error(json.message || "Failed to load course");
            return (json.data.days || []) as CourseDay[];
          }),
      ]);
      setItems(music);
      setCourseDays(course);
    } catch (e) {
      push(e instanceof Error ? e.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function onDayChange(value: string) {
    setDayNumber(value);
    const day = courseDays.find((d) => String(d.day) === value);
    if (day && !title.trim()) {
      setTitle(`Day ${day.day} — ${day.yantra.name}`);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!dayNumber) return push("Select a course day", "error");
    if (!audio) return push("Audio required", "error");
    const form = new FormData();
    form.set("title", title);
    form.set("description", description);
    form.set("sortOrder", sortOrder);
    form.set("dayNumber", dayNumber);
    form.set("audio", audio);
    try {
      await apiSend("/api/admin/yantramed/music", { method: "POST", body: form });
      push("Music uploaded", "success");
      setTitle("");
      setDescription("");
      setDayNumber("");
      setAudio(null);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function toggle(item: Music) {
    const form = new FormData();
    form.set("isActive", item.isActive ? "false" : "true");
    await apiSend(`/api/admin/yantramed/music/${item.id}`, {
      method: "PATCH",
      body: form,
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this track?")) return;
    await apiSend(`/api/admin/yantramed/music/${id}`, { method: "DELETE" });
    push("Deleted", "success");
    await load();
  }

  const dayOptions =
    courseDays.length > 0
      ? courseDays
      : Array.from({ length: 30 }, (_, i) => ({
          day: i + 1,
          yantra: { name: "Yantra", focus: "" },
          has_music: false,
        }));

  return (
    <div>
      <PageHeader
        title="Daily Music"
        description="Upload one background track per course day (1–30). Mobile plays mantra → this music → mantra again."
      />
      <Card className="mb-6">
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
          <Select
            label="Course day"
            value={dayNumber}
            onChange={(e) => onDayChange(e.target.value)}
            required
          >
            <option value="">Select day 1–30…</option>
            {dayOptions.map((d) => {
              const taken = takenDays.has(d.day);
              return (
                <option key={d.day} value={d.day}>
                  Day {d.day} — {d.yantra.name}
                  {taken ? " (already has music)" : ""}
                </option>
              );
            })}
          </Select>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <div className="flex items-end">
            <Button type="submit">Upload music</Button>
          </div>
        </form>
      </Card>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No music uploaded" />
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
                  {m.dayNumber != null ? (
                    <Badge tone="warning">Day {m.dayNumber}</Badge>
                  ) : (
                    <Badge tone="neutral">No day</Badge>
                  )}
                </div>
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
