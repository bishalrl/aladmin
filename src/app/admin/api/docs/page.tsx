import { Card, PageHeader } from "@/components/ui/primitives";

const BASE = "https://aladmin.sikaupaisa.com";

export default function ApiDocsPage() {
  return (
    <div>
      <PageHeader
        title="API Documentation"
        description="Public APIs for mobile apps. YantraMed auth/progress stay in Firebase."
      />
      <div className="space-y-4">
        <Card>
          <h2 className="mb-2 font-semibold text-teal-800">YantraMed — app config</h2>
          <p className="mb-3 text-sm text-slate-500">
            Start here for pricing, public URLs, and course flow in one response.
          </p>
          <ul className="space-y-2 font-mono text-sm text-slate-800">
            <li>GET /api/v1/yantramed/app</li>
            <li>GET /api/v1/yantramed/pricing</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">
            Pricing: <strong>$12/month</strong> (USD). Override via{" "}
            <code>YANTRAMED_SUBSCRIPTION_PRICE_USD</code> in .env or admin settings seed.
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
              <span className="block text-slate-500">Step 1 — opening mantra</span>
            </li>
            <li>
              <code className="text-slate-900">
                GET /api/v1/yantramed/course/days/:day/music
              </code>
              <span className="block text-slate-500">Step 2 — day music</span>
            </li>
            <li>Replay same mantra (closing)</li>
            <li>Mark day complete in Firebase</li>
          </ol>
        </Card>

        <Card>
          <h2 className="font-semibold">YantraMed — content APIs</h2>
          <ul className="mt-2 space-y-1 font-mono text-sm text-slate-800">
            <li>GET /api/v1/yantramed/course</li>
            <li>GET /api/v1/yantramed/course/days/:day</li>
            <li>GET /api/v1/yantramed/yantras</li>
            <li>GET /api/v1/yantramed/yantras/:slug</li>
            <li>GET /api/v1/yantramed/mantras</li>
            <li>GET /api/v1/yantramed/music</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">YantraMed — public pages</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>
              Account deletion:{" "}
              <code>{BASE}/delete-account/yantramed</code>
            </li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-semibold">GET /api/v1/budgeting-sathi/banners</h2>
          <p className="mt-1 text-sm text-slate-500">
            Active banner ads: image or video on disk + optional brand link.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold">POST /api/v1/delete-account/:project</h2>
          <p className="mt-1 text-sm text-slate-500">
            Soft deletion request. Projects: <code>yantramed</code>,{" "}
            <code>budgeting-sathi</code>
          </p>
        </Card>
      </div>
    </div>
  );
}
