/**
 * One-time live setup: fix webhook URL + create missing tier prices.
 * Run: npx tsx scripts/setup-paddle-live-prices.ts
 */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";
import * as fs from "fs";
import * as path from "path";

const PRODUCT_ID = "pro_01m1bhd6stke91kcx4yd5v5112";
const STARTER_MONTHLY = "pri_01m1bj6ytch64mpvbw6zdc1caw";
const WEBHOOK_ID = "ntfset_01m1bgy95c38kxzv2fte0eg165";
const WEBHOOK_URL = "https://aladmin.sikaupaisa.com/api/webhooks/paddle";

const NEW_PRICES: Array<{
  envKey: string;
  description: string;
  amount: string;
  interval: "month" | "year";
  frequency: number;
}> = [
  {
    envKey: "PADDLE_PRICE_STARTER_YEARLY",
    description: "YantraMed Starter — yearly",
    amount: "12000",
    interval: "year",
    frequency: 1,
  },
  {
    envKey: "PADDLE_PRICE_PRO_MONTHLY",
    description: "YantraMed Pro — monthly",
    amount: "2000",
    interval: "month",
    frequency: 1,
  },
  {
    envKey: "PADDLE_PRICE_PRO_YEARLY",
    description: "YantraMed Pro — yearly",
    amount: "20000",
    interval: "year",
    frequency: 1,
  },
  {
    envKey: "PADDLE_PRICE_ADVANCED_MONTHLY",
    description: "YantraMed Advanced — monthly",
    amount: "3000",
    interval: "month",
    frequency: 1,
  },
  {
    envKey: "PADDLE_PRICE_ADVANCED_YEARLY",
    description: "YantraMed Advanced — yearly",
    amount: "30000",
    interval: "year",
    frequency: 1,
  },
];

function upsertEnvVar(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return content.trimEnd() + `\n${line}\n`;
}

async function main() {
  const paddle = new Paddle(requireEnv("PADDLE_API_KEY"), {
    environment: Environment.production,
  });

  console.log("Webhook URL must be updated manually in Paddle dashboard:");
  console.log("  Developer tools > Notifications >", WEBHOOK_ID);
  console.log("  Set destination to:", WEBHOOK_URL);
  console.log("(API key lacks permission to update notification settings)\n");

  const priceIds: Record<string, string> = {
    PADDLE_PRICE_STARTER_MONTHLY: STARTER_MONTHLY,
  };

  for (const spec of NEW_PRICES) {
    const existing = process.env[spec.envKey]?.trim();
    if (existing?.startsWith("pri_")) {
      console.log(`Skip ${spec.envKey} — already set (${existing})`);
      priceIds[spec.envKey] = existing;
      continue;
    }

    console.log(`Creating ${spec.description} ($${Number(spec.amount) / 100}/${spec.interval})…`);
    const price = await paddle.prices.create({
      productId: PRODUCT_ID,
      description: spec.description,
      unitPrice: { amount: spec.amount, currencyCode: "USD" },
      billingCycle: { interval: spec.interval, frequency: spec.frequency },
      taxMode: "account_setting",
    });
    console.log(`  ✓ ${price.id}`);
    priceIds[spec.envKey] = price.id;
  }

  const envPath = path.join(process.cwd(), ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  for (const [key, value] of Object.entries(priceIds)) {
    envContent = upsertEnvVar(envContent, key, value);
  }
  fs.writeFileSync(envPath, envContent);

  console.log("\n✓ .env updated with price IDs:");
  for (const [k, v] of Object.entries(priceIds)) console.log(`  ${k}=${v}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
