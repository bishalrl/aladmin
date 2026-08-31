import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";

const ID = "ntfset_01m1bgy95c38kxzv2fte0eg165";
  const NEEDED = [
  "transaction.completed",
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "customer.created",
  "customer.updated",
] as const;

async function main() {
  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });
  const n = await paddle.notificationSettings.get(ID);
  const eventNames = (n.subscribedEvents ?? []).map(String);
  console.log("ID:", n.id);
  console.log("Destination:", n.destination);
  console.log("Active:", n.active);
  console.log("API version:", n.apiVersion);
  console.log("Subscribed events:", n.subscribedEvents?.length ?? 0);
  console.log("\nRequired events:");
  for (const e of NEEDED) {
    const ok = eventNames.includes(e);
    console.log(`  ${ok ? "✓" : "✗"} ${e}`);
  }
  const expected = "https://aladmin.sikaupaisa.com/api/webhooks/paddle";
  console.log("\nURL correct:", n.destination === expected ? "YES" : `NO — set to ${expected}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
