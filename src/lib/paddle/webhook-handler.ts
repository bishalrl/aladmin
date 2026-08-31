import { Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "@/lib/paddle/config";
import { dispatchPaddleEvent } from "@/lib/paddle/dispatch";

let webhooksPaddle: Paddle | null = null;

function getWebhooksPaddle(): Paddle {
  if (!webhooksPaddle) {
    webhooksPaddle = new Paddle(requireEnv("PADDLE_API_KEY"));
  }
  return webhooksPaddle;
}

export async function verifyAndDispatchPaddleWebhook(
  rawBody: string,
  signatureHeader: string | null,
): Promise<void> {
  const secret = requireEnv("PADDLE_WEBHOOK_SECRET");
  if (!signatureHeader) {
    throw new Error("Missing Paddle-Signature header");
  }

  const event = await getWebhooksPaddle().webhooks.unmarshal(
    rawBody,
    secret,
    signatureHeader,
  );

  await dispatchPaddleEvent(event);
}
