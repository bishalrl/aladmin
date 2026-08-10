import { Card, PageHeader } from "@/components/ui/primitives";

export default function ApiDocsPage() {
  return (
    <div>
      <PageHeader
        title="API Documentation"
        description="Public media APIs. YantraMed auth/progress stay in Firebase on the mobile app."
      />
      <div className="space-y-4">
        <Card>
          <h2 className="font-semibold">GET /api/v1/budgeting-sathi/banners</h2>
          <p className="mt-1 text-sm text-slate-500">
            Active banner ads only: <code>media_type</code> (image|video),{" "}
            <code>media_url</code> (server disk), optional brand{" "}
            <code>link</code>.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold text-teal-800">
            YantraMed — course day flow (per day)
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>
              <code className="text-slate-900">
                GET /api/v1/yantramed/course/days/:day/mantra
              </code>
              <span className="block text-slate-500">
                Step 1 — mantra for that course day
              </span>
            </li>
            <li>
              App: user completes mantra (Firebase tracks progress)
            </li>
            <li>
              <code className="text-slate-900">
                GET /api/v1/yantramed/course/days/:day/music
              </code>
              <span className="block text-slate-500">
                Step 2 — music for that same course day
              </span>
            </li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            Example day 1:{" "}
            <code>/api/v1/yantramed/course/days/1/mantra</code> then{" "}
            <code>/api/v1/yantramed/course/days/1/music</code>
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold">GET /api/v1/yantramed/yantras</h2>
          <p className="mt-1 text-sm text-slate-500">
            Optional home grid (6 yantras). Auth is not handled here.
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">GET /api/v1/yantramed/course</h2>
          <p className="mt-1 text-sm text-slate-500">
            Optional 30-day outline (rotation + duration metadata).
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">POST /api/v1/delete-account/:project</h2>
          <p className="mt-1 text-sm text-slate-500">
            Soft deletion request per project.
          </p>
        </Card>
      </div>
    </div>
  );
}
