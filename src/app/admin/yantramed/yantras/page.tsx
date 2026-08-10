"use client";

import { useEffect, useState } from "react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";

type Yantra = {
  id: string;
  name: string;
  slug: string;
  focus: string;
  source_text: string;
  cycle_index: number | null;
  show_on_home: boolean;
  in_course: boolean;
};

export default function YantrasAdminPage() {
  const [items, setItems] = useState<Yantra[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/yantramed/yantras?home=false")
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) throw new Error(json.message);
        setItems(json.data);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Yantras"
        description="Home grid uses 6 yantras. Lakshmi & Custom exist in the geometry engine but are not on home/course."
      />
      {error ? (
        <EmptyState title="Unable to load yantras" description={error} />
      ) : items.length === 0 ? (
        <EmptyState title="No yantras — run npm run db:seed" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((y) => (
            <Card key={y.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{y.name}</p>
                  <p className="font-mono text-xs text-slate-500">{y.slug}</p>
                </div>
                <Badge tone={y.show_on_home ? "success" : "neutral"}>
                  {y.show_on_home ? "Home" : "Extra"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-700">{y.focus}</p>
              <p className="mt-1 text-xs text-slate-500">{y.source_text}</p>
              {y.cycle_index != null ? (
                <p className="mt-2 text-xs text-slate-500">
                  Course cycle index: {y.cycle_index}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
