import { NextRequest } from "next/server";
import { verifyAndDispatchPaddleWebhook } from "@/lib/paddle/webhook-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("paddle-signature");

    await verifyAndDispatchPaddleWebhook(rawBody, signature);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    console.error("[paddle webhook]", message);
    // Non-2xx so Paddle retries on transient failures; invalid sig = 401
    if (message.includes("signature") || message.includes("Signature")) {
      return new Response(message, { status: 401 });
    }
    if (message.includes("Missing")) {
      return new Response(message, { status: 400 });
    }
    return new Response(message, { status: 500 });
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    service: "paddle-webhook",
    message: "POST Paddle events to this URL",
    url: "/api/webhooks/paddle",
  });
}
