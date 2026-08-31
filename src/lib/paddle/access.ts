/** Whether a Paddle subscription status grants paid YantraMed access */
export function subscriptionGrantsAccess(status: string): boolean {
  const normalized = status.toLowerCase();
  return normalized === "active" || normalized === "trialing";
}

/** scheduled_change to cancel does NOT revoke access until status is canceled */
export function accessFromSubscription(row: {
  status: string;
  scheduledChangeAction?: string | null;
}): boolean {
  if (subscriptionGrantsAccess(row.status)) {
    return true;
  }
  if (row.status.toLowerCase() === "paused") {
    return false;
  }
  if (row.status.toLowerCase() === "past_due") {
    return false;
  }
  return false;
}

export type AccessTier = "starter" | "pro" | "advanced" | null;

const PRICE_TIER_MAP: Record<string, AccessTier> = {};

function registerPriceTier(envKey: string, tier: AccessTier) {
  const id = process.env[envKey]?.trim();
  if (id) PRICE_TIER_MAP[id] = tier;
}

function buildPriceTierMap() {
  if (Object.keys(PRICE_TIER_MAP).length > 0) return;
  registerPriceTier("PADDLE_PRICE_STARTER_MONTHLY", "starter");
  registerPriceTier("PADDLE_PRICE_STARTER_YEARLY", "starter");
  registerPriceTier("PADDLE_PRICE_PRO_MONTHLY", "pro");
  registerPriceTier("PADDLE_PRICE_PRO_YEARLY", "pro");
  registerPriceTier("PADDLE_PRICE_ADVANCED_MONTHLY", "advanced");
  registerPriceTier("PADDLE_PRICE_ADVANCED_YEARLY", "advanced");
}

export function tierForPriceId(priceId: string): AccessTier {
  buildPriceTierMap();
  return PRICE_TIER_MAP[priceId] ?? null;
}

/** Rank tiers for upgrade comparison */
export function tierRank(tier: AccessTier): number {
  if (tier === "starter") return 1;
  if (tier === "pro") return 2;
  if (tier === "advanced") return 3;
  return 0;
}

export function highestTier(a: AccessTier, b: AccessTier): AccessTier {
  return tierRank(a) >= tierRank(b) ? a : b;
}
