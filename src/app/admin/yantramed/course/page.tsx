"use client";

import { useEffect, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { apiGet } from "@/lib/client/api";

type Course = {
  total_days: number;
  unlock: { description: string };
  days: {
    day: number;
    duration_minutes: number;
    focus: string;
    mantra_hint: string;
    yantra: { name: string; slug: string };
  }[];
};

export default function CourseAdminPage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Course>("/api/v1/yantramed/course")
      .then(setCourse)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="30-Day Course"
        description="Sequential unlock · yantra rotation · duration ramp. Assign music/mantras per day from Music & Mantras modules."
      />
      {error ? (
        <EmptyState title="Unable to load course" description={error} />
      ) : !course ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <>
          <Card className="mb-4 text-sm text-slate-600">
            <p>{course.unlock.description}</p>
            <p className="mt-1">Total days: {course.total_days}</p>
          </Card>
          <Card className="overflow-x-auto p-0">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Day</th>
                  <th className="px-4 py-3 text-left">Yantra</th>
                  <th className="px-4 py-3 text-left">Focus</th>
                  <th className="px-4 py-3 text-left">Minutes</th>
                  <th className="px-4 py-3 text-left">Mantra hint</th>
                </tr>
              </thead>
              <tbody>
                {course.days.map((d) => (
                  <tr key={d.day} className="border-t">
                    <td className="px-4 py-3 font-medium">{d.day}</td>
                    <td className="px-4 py-3">{d.yantra.name}</td>
                    <td className="px-4 py-3">{d.focus}</td>
                    <td className="px-4 py-3">{d.duration_minutes}</td>
                    <td className="px-4 py-3 text-slate-600">{d.mantra_hint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
