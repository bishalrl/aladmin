"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Media = {
  id: string;
  originalName: string;
  category: string;
  url: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
};

function MediaBrowser({
  title,
  category,
}: {
  title: string;
  category: string;
}) {
  const [items, setItems] = useState<Media[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Media[]>(`/api/admin/media?category=${category}`)
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [category]);

  return (
    <div>
      <PageHeader title={title} description="Files stored on server disk" />
      {error ? (
        <EmptyState title="Unable to load media" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No files in this category" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <Card key={m.id}>
              {m.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.originalName} className="mb-3 h-40 w-full rounded-lg object-cover" />
              ) : (
                <audio controls className="mb-3 w-full" src={m.url} />
              )}
              <p className="font-medium text-sm">{m.originalName}</p>
              <p className="text-xs text-slate-500">
                {(m.fileSize / 1024).toFixed(1)} KB ·{" "}
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <MediaBrowser title="Banner Images" category="banner" />;
}
