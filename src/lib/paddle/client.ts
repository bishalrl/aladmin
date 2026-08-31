import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getPaddleEnvironment, requireEnv } from "@/lib/paddle/config";

let client: Paddle | null = null;

export function getPaddleClient(): Paddle {
  if (!client) {
    client = new Paddle(requireEnv("PADDLE_API_KEY"), {
      environment: getPaddleEnvironment(),
    });
  }
  return client;
}

export function assertLivePaddleConfig(): void {
  const env = getPaddleEnvironment();
  if (env !== Environment.production) {
    throw new Error("Expected PADDLE_ENVIRONMENT=production for live checkout");
  }
  const token = requireEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
  if (!token.startsWith("live_")) {
    throw new Error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN must be a live_ token");
  }
  const apiKey = requireEnv("PADDLE_API_KEY");
  if (!apiKey.startsWith("pdl_live_") && !apiKey.includes("live")) {
    console.warn("[paddle] API key may not be live — verify in Paddle dashboard");
  }
}
