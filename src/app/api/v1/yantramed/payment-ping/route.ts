import { ok } from "@/lib/api/response";

/**
 * Deploy canary — if this 404s, the server is NOT running the latest build.
 * No DB / Firebase / Paddle required.
 */
export async function GET() {
  return ok({
    ok: true,
    service: "yantramed-payment-ping",
    build_marker: "payment-flow-v1",
  });
}
