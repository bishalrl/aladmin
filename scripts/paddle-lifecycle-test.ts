/**
 * Subscription lifecycle test on live (after E2E checkout).
 * Run: npx tsx scripts/paddle-lifecycle-test.ts <subscription_id>
 *
 * (a) Upgrade plan with do_not_bill proration
 * (b) Schedule cancel at next billing period
 * (c) Immediate cancel
 */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";
import { YANTRAMED_TIERS } from "../src/lib/paddle/tiers";
import { paddleFulfillmentService } from "../src/services/PaddleFulfillmentService";
import { prisma } from "../src/lib/db/prisma";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function printDb(subId: string) {
  const sub = await prisma.paddleSubscription.findUnique({
    where: { subscriptionId: subId },
  });
  if (!sub) {
    console.log("  DB: subscription row not found");
    return;
  }
  console.log(
    `  DB: status=${sub.status} price=${sub.priceId} scheduled=${sub.scheduledChangeAction ?? "none"}`,
  );
}

async function main() {
  const subId = process.argv[2]?.trim();
  if (!subId) {
    console.error("Usage: npx tsx scripts/paddle-lifecycle-test.ts <subscription_id>");
    process.exit(1);
  }

  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });

  const sub = await paddle.subscriptions.get(subId);
  const currentPriceId = sub.items?.[0]?.price?.id;
  console.log("Starting subscription:", subId, "status=", sub.status, "price=", currentPriceId);

  const upgradeTarget =
    currentPriceId === YANTRAMED_TIERS[0].priceId.month
      ? YANTRAMED_TIERS[1].priceId.month
      : YANTRAMED_TIERS[2].priceId.month;

  if (upgradeTarget && upgradeTarget !== currentPriceId) {
    console.log("\n(a) Upgrade →", upgradeTarget, "(proration: do_not_bill)");
    await paddle.subscriptions.update(subId, {
      items: [{ priceId: upgradeTarget, quantity: 1 }],
      prorationBillingMode: "do_not_bill",
    });
    await sleep(3000);
    const updated = await paddle.subscriptions.get(subId);
    console.log("  Paddle: status=", updated.status, "price=", updated.items?.[0]?.price?.id);
    await printDb(subId);
  } else {
    console.log("\n(a) Skip upgrade — already on target tier or price IDs missing");
  }

  console.log("\n(b) Schedule cancel at next billing period");
  await paddle.subscriptions.cancel(subId, {
    effectiveFrom: "next_billing_period",
  });
  await sleep(3000);
  let afterSchedule = await paddle.subscriptions.get(subId);
  console.log(
    "  Paddle: status=",
    afterSchedule.status,
    "scheduled=",
    afterSchedule.scheduledChange?.action,
  );
  await printDb(subId);

  console.log("\n(c) Immediate cancel");
  await paddle.subscriptions.cancel(subId, {
    effectiveFrom: "immediately",
  });
  await sleep(3000);
  afterSchedule = await paddle.subscriptions.get(subId);
  console.log("  Paddle: status=", afterSchedule.status);
  await printDb(subId);

  const customer = await prisma.paddleCustomer.findFirst({
    where: { subscriptions: { some: { subscriptionId: subId } } },
  });
  if (customer?.email) {
    const access = await paddleFulfillmentService.getAccessForEmail(customer.email);
    console.log("\nAccess after immediate cancel:", access.hasAccess, "(expect false)");
  }

  console.log("\nCheck Paddle Notifications for subscription.updated/canceled webhooks (2xx).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
