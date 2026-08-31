export type TierName = "Starter" | "Pro" | "Advanced";

export interface Tier {
  name: TierName;
  description: string;
  features: string[];
  priceId: { month: string; year: string };
  highlighted?: boolean;
}

function priceId(monthEnv: string, yearEnv: string): { month: string; year: string } {
  const month = process.env[monthEnv]?.trim() ?? "";
  const year = process.env[yearEnv]?.trim() ?? "";
  return { month, year };
}

/** Edit tiers here; price IDs come from env (live pri_… from Paddle dashboard). */
export const YANTRAMED_TIERS: Tier[] = [
  {
    name: "Starter",
    description: "Begin your 30-day yantra meditation journey",
    features: [
      "Full 30-day course access",
      "Six yantra mantras",
      "Daily background music",
      "Progress tracking",
    ],
    priceId: priceId(
      "PADDLE_PRICE_STARTER_MONTHLY",
      "PADDLE_PRICE_STARTER_YEARLY",
    ),
  },
  {
    name: "Pro",
    description: "Everything in Starter plus guided extras",
    features: [
      "Everything in Starter",
      "Extended yantra library content",
      "Priority support",
      "Early access to new sessions",
    ],
    priceId: priceId("PADDLE_PRICE_PRO_MONTHLY", "PADDLE_PRICE_PRO_YEARLY"),
    highlighted: true,
  },
  {
    name: "Advanced",
    description: "Complete YantraMed experience",
    features: [
      "Everything in Pro",
      "Advanced course materials",
      "Exclusive seasonal content",
      "Dedicated support channel",
    ],
    priceId: priceId(
      "PADDLE_PRICE_ADVANCED_MONTHLY",
      "PADDLE_PRICE_ADVANCED_YEARLY",
    ),
  },
];

export function tierPriceIdsForInterval(interval: "month" | "year"): string[] {
  return YANTRAMED_TIERS.map((t) => t.priceId[interval]).filter(Boolean);
}

export function assertTiersConfigured(): void {
  const missing: string[] = [];
  for (const tier of YANTRAMED_TIERS) {
    if (!tier.priceId.month) missing.push(`${tier.name} monthly`);
    if (!tier.priceId.year) missing.push(`${tier.name} yearly`);
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing Paddle price IDs in .env: ${missing.join(", ")}. Create live pri_ prices in Paddle and set PADDLE_PRICE_* env vars.`,
    );
  }
}
