/**
 * Creates a one-time 100% discount for live end-to-end checkout testing.
 * Run: npx tsx scripts/create-paddle-live-test-discount.ts
 *
 * Requires PADDLE_API_KEY and PADDLE_ENVIRONMENT=production in .env
 */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";

async function main() {
  const env = requireEnv("PADDLE_ENVIRONMENT");
  if (env !== "production") {
    throw new Error("Set PADDLE_ENVIRONMENT=production for live test discount");
  }

  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });

  const code = `YME2E${Date.now().toString(36).toUpperCase().slice(-8)}`;

  const discount = await paddle.discounts.create({
    description: "YantraMed E2E live test — 100% off (internal)",
    type: "percentage",
    amount: "100",
    code,
    enabledForCheckout: true,
    recur: false,
    usageLimit: 1,
    restrictTo: [],
  });

  console.log("\n✓ Live test discount created");
  console.log("  Code:", discount.code ?? code);
  console.log("  ID:", discount.id);
  console.log("\nApply this code at checkout on https://aladmin.sikaupaisa.com/pricing");
  console.log("Archive this discount in Paddle after testing (do NOT delete webhook/products).\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
