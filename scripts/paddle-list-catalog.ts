/** List live products/prices — npx tsx scripts/paddle-list-catalog.ts */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";

async function main() {
  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });

  console.log("=== Products & prices ===\n");
  for await (const p of paddle.products.list({ status: ["active"] })) {
    console.log(`${p.name} (${p.id})`);
    for await (const pr of paddle.prices.list({
      productId: [p.id],
      status: ["active"],
    })) {
      const cycle = pr.billingCycle
        ? `${pr.billingCycle.frequency} ${pr.billingCycle.interval}`
        : "one-time";
      console.log(
        `  ${pr.id}  ${pr.description ?? ""}  ${pr.unitPrice?.amount} ${pr.unitPrice?.currencyCode}  /${cycle}`,
      );
    }
    console.log("");
  }

  console.log("=== Notification destinations ===\n");
  const notifications = await paddle.notificationSettings.list();
  for (const n of notifications) {
    console.log(
      `${n.id}  active=${n.active}  ${n.destination}  events=${n.subscribedEvents?.length ?? 0}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
