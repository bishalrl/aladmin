"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Media = {
  id: string;
  originalName: string;
  url: string;
};

export default function Page() {
  const [items, setItems] = useState<Media[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Media[]>("/api/admin/media?category=mantra")
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader title="Mantra Media" description="Uploaded YantraMed mantra files" />
      {error ? (
        <EmptyState title="Unable to load media" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No mantra files" />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id}>
              <p className="font-medium">{m.originalName}</p>
              <audio controls className="mt-2 w-full max-w-lg" src={m.url} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
