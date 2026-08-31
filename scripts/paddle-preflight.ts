/**
 * Live Paddle pre-flight checks before E2E checkout test.
 * Run: npx tsx scripts/paddle-preflight.ts
 */
import "dotenv/config";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { requireEnv } from "../src/lib/paddle/config";
import { YANTRAMED_TIERS, assertTiersConfigured } from "../src/lib/paddle/tiers";

const APP_DOMAIN = "aladmin.sikaupaisa.com";

function check(name: string, ok: boolean, detail: string) {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${name}: ${detail}`);
  return ok;
}

async function main() {
  let passed = 0;
  let failed = 0;

  const env = requireEnv("PADDLE_ENVIRONMENT");
  if (check("Environment var", env === "production", env)) passed++;
  else failed++;

  const apiKey = requireEnv("PADDLE_API_KEY");
  const apiLive =
    apiKey.startsWith("pdl_live_") || apiKey.includes("_live_");
  if (check("API key looks live", apiLive, apiLive ? "live prefix" : "unexpected format"))
    passed++;
  else failed++;

  const token = requireEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN");
  if (check("Client token", token.startsWith("live_"), token.slice(0, 12) + "…"))
    passed++;
  else failed++;

  const secret = requireEnv("PADDLE_WEBHOOK_SECRET");
  if (
    check(
      "Webhook secret",
      secret.startsWith("pdl_ntfset_"),
      secret.slice(0, 20) + "…",
    )
  )
    passed++;
  else failed++;

  try {
    assertTiersConfigured();
    const ids = YANTRAMED_TIERS.flatMap((t) => [t.priceId.month, t.priceId.year]);
    const allPri = ids.every((id) => id.startsWith("pri_"));
    if (check("Price IDs", allPri, `${ids.length} pri_ IDs configured`)) passed++;
    else failed++;
  } catch (e) {
    check("Price IDs", false, e instanceof Error ? e.message : String(e));
    failed++;
  }

  const paddle = new Paddle(apiKey, { environment: Environment.production });

  // Checkout domains (not in Node SDK — call REST API)
  const domainsRes = await fetch("https://api.paddle.com/checkout-domains", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!domainsRes.ok) {
    check(
      "Checkout domain approved",
      false,
      `API ${domainsRes.status} — verify ${APP_DOMAIN} manually in Checkout > Checkout settings`,
    );
    failed++;
  } else {
    const domainsJson = (await domainsRes.json()) as {
      data?: Array<{ domain?: string; status?: string }>;
    };
    const domainList = domainsJson.data ?? [];
    const approved = domainList.filter(
      (d) =>
        d.status === "approved" &&
        (d.domain === APP_DOMAIN || d.domain?.includes(APP_DOMAIN)),
    );
    if (
      check(
        "Checkout domain approved",
        approved.length > 0,
        approved.length
          ? `${approved.map((d) => d.domain).join(", ")} (${approved[0].status})`
          : `No approved domain for ${APP_DOMAIN}. Domains: ${domainList.map((d) => `${d.domain}:${d.status}`).join(", ") || "none"}`,
      )
    )
      passed++;
    else failed++;
  }

  // Verify prices exist in live account
  for (const tier of YANTRAMED_TIERS) {
    for (const [label, priceId] of [
      ["month", tier.priceId.month],
      ["year", tier.priceId.year],
    ] as const) {
      if (!priceId) continue;
      try {
        const price = await paddle.prices.get(priceId);
        const ok = Boolean(price.id);
        if (check(`${tier.name} ${label} price`, ok, priceId)) passed++;
        else failed++;
      } catch {
        check(`${tier.name} ${label} price`, false, `${priceId} not found in live`);
        failed++;
      }
    }
  }

  // Notification destinations
  const notifications = await paddle.notificationSettings.list();
  const webhookUrl = `https://${APP_DOMAIN}/api/webhooks/paddle`;
  const dest = notifications.find((n) =>
    n.destination?.includes("/api/webhooks/paddle"),
  );
  if (
    check(
      "Webhook destination",
      Boolean(dest),
      dest
        ? `${dest.destination} (${dest.active ? "active" : "inactive"})`
        : `Create ${webhookUrl} in Paddle Developer tools > Notifications`,
    )
  )
    passed++;
  else failed++;

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nFix failures before live E2E checkout.");
    process.exit(1);
  }
  console.log("\nCode pre-flight OK. Still confirm manually:");
  console.log("  • Business/identity verification complete in Paddle dashboard");
  console.log("  • App deployed to https://aladmin.sikaupaisa.com");
  console.log("  • Default payment link → https://aladmin.sikaupaisa.com/pricing");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
