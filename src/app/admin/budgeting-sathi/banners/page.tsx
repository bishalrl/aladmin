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
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/client/api";

type Brand = { id: string; name: string; isActive: boolean };
type Banner = {
  id: string;
  title: string;
  clickUrl: string | null;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  brand: Brand;
};

export default function BannersPage() {
  const { push } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandId, setBrandId] = useState("");
  const [title, setTitle] = useState("");
  const [clickUrl, setClickUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("10");
  const [media, setMedia] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [b, ads] = await Promise.all([
        apiGet<Brand[]>("/api/admin/projects/budgeting-sathi/brands"),
        apiGet<Banner[]>("/api/admin/projects/budgeting-sathi/banners"),
      ]);
      setBrands(b.filter((x) => x.isActive));
      setBanners(ads);
      if (!brandId && b[0]) setBrandId(b[0].id);
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
    if (!media) {
      push("Image or video is required", "error");
      return;
    }
    const form = new FormData();
    form.set("brandId", brandId);
    form.set("title", title);
    form.set("clickUrl", clickUrl);
    form.set("startDate", new Date(startDate).toISOString());
    form.set("endDate", new Date(endDate).toISOString());
    form.set("priority", priority);
    form.set("media", media);
    try {
      await apiSend("/api/admin/projects/budgeting-sathi/banners", {
        method: "POST",
        body: form,
      });
      push("Banner created", "success");
      setTitle("");
      setClickUrl("");
      setMedia(null);
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function toggle(banner: Banner) {
    const form = new FormData();
    form.set("isActive", banner.isActive ? "false" : "true");
    try {
      await apiSend(
        `/api/admin/projects/budgeting-sathi/banners/${banner.id}`,
        { method: "PATCH", body: form },
      );
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this banner?")) return;
    try {
      await apiSend(`/api/admin/projects/budgeting-sathi/banners/${id}`, {
        method: "DELETE",
      });
      push("Banner deleted", "success");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Banner Ads"
        description="Image or video on your server disk, plus an optional brand link for Budgeting Sathi."
      />
      <Card className="mb-6">
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
          <Select
            label="Brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
            required
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Brand link (optional)"
            value={clickUrl}
            onChange={(e) => setClickUrl(e.target.value)}
            placeholder="https://…"
          />
          <Input
            label="Priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <Input
            label="Start date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <Input
            label="Media (image or video)"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            onChange={(e) => setMedia(e.target.files?.[0] || null)}
            required
          />
          <div className="flex items-end">
            <Button type="submit">Create banner</Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : banners.length === 0 ? (
        <EmptyState title="No banners yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {banners.map((b) => (
            <Card key={b.id}>
              {b.mediaType === "VIDEO" ? (
                <video
                  src={b.mediaUrl}
                  className="mb-3 h-36 w-full rounded-lg object-cover"
                  controls
                  muted
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.mediaUrl}
                  alt={b.title}
                  className="mb-3 h-36 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-xs text-slate-500">{b.brand.name}</p>
                </div>
                <div className="flex gap-1">
                  <Badge tone="neutral">{b.mediaType}</Badge>
                  <Badge tone={b.isActive ? "success" : "neutral"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 truncate text-xs text-teal-700">
                {b.clickUrl || "No link"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Priority {b.priority} ·{" "}
                {new Date(b.startDate).toLocaleDateString()} –{" "}
                {new Date(b.endDate).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => toggle(b)}>
                  {b.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="danger" onClick={() => remove(b.id)}>
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
