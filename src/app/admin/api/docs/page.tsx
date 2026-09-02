import { Card, PageHeader } from "@/components/ui/primitives";

const BASE = "https://aladmin.sikaupaisa.com";

export default function ApiDocsPage() {
  return (
    <div>
      <PageHeader
        title="API Documentation"
        description="Public APIs for mobile apps. YantraMed course progress stays in Firebase; payment happens on the web."
      />
      <div className="space-y-4">
        <Card>
          <h2 className="mb-2 font-semibold text-teal-800">YantraMed — app config</h2>
          <p className="mb-3 text-sm text-slate-500">
            Start here for pricing, public URLs, subscription flow, and course flow.
          </p>
          <ul className="space-y-2 font-mono text-sm text-slate-800">
            <li>GET /api/v1/yantramed/app</li>
            <li>GET /api/v1/yantramed/pricing</li>
          </ul>
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold text-teal-800">
            YantraMed — subscription &amp; payment (web-only)
          </h2>
          <p className="mb-3 text-sm text-slate-600">
            The app does not handle payment. User taps Subscribe → app calls payment URL API →
            opens browser → user signs in with Google on <code>/subscribe</code> → Paddle checkout →
            webhooks write Firestore <code>users/{"{uid}"}</code>.
          </p>
          <ul className="space-y-3 font-mono text-sm text-slate-800">
            <li>
              GET /api/v1/yantramed/payment/url
              <span className="mt-1 block font-sans text-xs text-slate-500">
                Header: <code>Authorization: Bearer {"{Firebase ID token}"}</code>
                <br />
                Optional query: <code>return_url</code>, <code>tier</code> (Starter|Pro|Advanced),{" "}
                <code>interval</code> (month|year)
                <br />
                Returns: <code>payment_url</code>, <code>expires_at</code>,{" "}
                <code>firebase_uid</code>
              </span>
            </li>
            <li>
              GET /api/v1/yantramed/subscription/status?uid={"{"}firebaseUid{"}"}
              <span className="mt-1 block font-sans text-xs text-slate-500">
                Or <code>?email=</code>. Returns <code>has_access</code>, <code>tier</code>,{" "}
                <code>status</code>, Paddle IDs.
              </span>
            </li>
            <li>POST /api/v1/yantramed/billing/portal — body: {"{ email }"}</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">
            Web pages: <code>{BASE}/subscribe</code> (app payment),{" "}
            <code>{BASE}/pricing</code> (marketing),{" "}
            <code>{BASE}/welcome</code> (post-checkout).
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Firestore rules: see <code>docs/yantramed-firestore-rules.md</code>
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
              Subscribe (from app): <code>{BASE}/subscribe</code>
            </li>
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
