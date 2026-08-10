"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { apiGet, apiSend } from "@/lib/client/api";

type Brand = {
  id: string;
  name: string;
  website: string | null;
  contact: string | null;
  isActive: boolean;
  _count?: { bannerAds: number };
};

export default function BrandsPage() {
  const { push } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [contact, setContact] = useState("");

  async function load() {
    setLoading(true);
    try {
      setBrands(await apiGet("/api/admin/projects/budgeting-sathi/brands"));
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
    const form = new FormData();
    form.set("name", name);
    form.set("website", website);
    form.set("contact", contact);
    try {
      await apiSend("/api/admin/projects/budgeting-sathi/brands", {
        method: "POST",
        body: form,
      });
      push("Brand created", "success");
      setName("");
      setWebsite("");
      setContact("");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function toggle(brand: Brand) {
    const form = new FormData();
    form.set("isActive", brand.isActive ? "false" : "true");
    try {
      await apiSend(`/api/admin/projects/budgeting-sathi/brands/${brand.id}`, {
        method: "PATCH",
        body: form,
      });
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this brand?")) return;
    try {
      await apiSend(`/api/admin/projects/budgeting-sathi/brands/${id}`, {
        method: "DELETE",
      });
      push("Brand deleted", "success");
      await load();
    } catch (err) {
      push(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Brands"
        description="Advertisers linked to Budgeting Sathi banner campaigns"
      />
      <Card className="mb-6">
        <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Input label="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Add brand
            </Button>
          </div>
        </form>
      </Card>
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : brands.length === 0 ? (
        <EmptyState title="No brands yet" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Website</th>
                <th className="px-4 py-3 text-left">Banners</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3">{b.website || "—"}</td>
                  <td className="px-4 py-3">{b._count?.bannerAds ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge tone={b.isActive ? "success" : "neutral"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="secondary" onClick={() => toggle(b)}>
                      {b.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="danger" onClick={() => remove(b.id)}>
                      Delete
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
