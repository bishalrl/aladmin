/**
 * Verify live checkout result: transaction, webhooks, DB mirror, access.
 * Run after completing checkout: npx tsx scripts/paddle-verify-checkout.ts <email>
 */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";
import { accessFromSubscription, tierForPriceId } from "../src/lib/paddle/access";
import { paddleFulfillmentService } from "../src/services/PaddleFulfillmentService";
import { prisma } from "../src/lib/db/prisma";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx scripts/paddle-verify-checkout.ts <checkout-email>");
    process.exit(1);
  }

  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });

  console.log("\n=== Database mirror ===");
  const access = await paddleFulfillmentService.getAccessForEmail(email);
  console.log("Customer ID:", access.customerId ?? "(none)");
  console.log("Subscription ID:", access.subscriptionId ?? "(none)");
  console.log("Status:", access.status ?? "(none)");
  console.log("Has access:", access.hasAccess);
  console.log("Tier:", access.tier ?? "(none)");

  const customer = await prisma.paddleCustomer.findFirst({
    where: { email },
    include: { subscriptions: true },
  });
  if (customer) {
    console.log("\nDB subscriptions:", customer.subscriptions.length);
    for (const sub of customer.subscriptions) {
      const grants = accessFromSubscription(sub);
      console.log(
        `  ${sub.subscriptionId} status=${sub.status} price=${sub.priceId} access=${grants} scheduled=${sub.scheduledChangeAction ?? "none"}`,
      );
    }
  } else {
    console.log("\n✗ No paddle_customers row for this email yet");
  }

  const events = await prisma.paddleWebhookEvent.findMany({
    orderBy: { processedAt: "desc" },
    take: 10,
  });
  console.log("\nRecent webhook events processed:", events.length);
  for (const e of events.slice(0, 5)) {
    console.log(`  ${e.eventType} (${e.eventId.slice(0, 12)}…)`);
  }

  if (access.customerId) {
    console.log("\n=== Paddle API ===");
    const subs = paddle.subscriptions.list({
      customerId: [access.customerId],
      status: ["active", "trialing", "canceled", "past_due"],
    });
    for await (const sub of subs) {
      console.log(
        `Subscription ${sub.id}: status=${sub.status} price=${sub.items?.[0]?.price?.id} tier=${tierForPriceId(sub.items?.[0]?.price?.id ?? "")}`,
      );
      if (sub.scheduledChange) {
        console.log(
          `  scheduled: ${sub.scheduledChange.action} at ${sub.scheduledChange.effectiveAt}`,
        );
      }
    }

    const txns = paddle.transactions.list({
      customerId: [access.customerId],
      status: ["completed", "billed", "paid"],
    });
    console.log("\nTransactions:");
    for await (const tx of txns) {
      console.log(
        `  ${tx.id} status=${tx.status} total=${tx.details?.totals?.total ?? "?"}`,
      );
    }
  }

  console.log("\nConfirm in Paddle dashboard: Developer tools > Notifications — recent deliveries returned 2xx for /api/webhooks/paddle");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
