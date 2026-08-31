/**
 * Archive the throwaway E2E test discount (does not delete products/webhooks).
 * Run: npx tsx scripts/paddle-archive-discount.ts <discount_id>
 */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";

async function main() {
  const discountId = process.argv[2]?.trim();
  if (!discountId) {
    console.error("Usage: npx tsx scripts/paddle-archive-discount.ts <dsc_…>");
    process.exit(1);
  }

  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });

  await paddle.discounts.update(discountId, {
    status: "archived",
  });

  console.log("✓ Discount archived:", discountId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
