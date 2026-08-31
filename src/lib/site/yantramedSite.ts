export const YANTRAMED_SITE = {
  appName: "YantraMed",
  tagline: "30-day yantra meditation course with guided mantras and daily music",
  companyName: process.env.YANTRAMED_COMPANY_NAME ?? "Sikau Paisa",
  supportEmail: process.env.YANTRAMED_SUPPORT_EMAIL ?? "hello.sikaupaisa@gmail.com",
  website: process.env.APP_URL?.replace(/\/$/, "") ?? "https://aladmin.sikaupaisa.com",
  pricing: {
    amount: Number(process.env.YANTRAMED_SUBSCRIPTION_PRICE_USD ?? 12),
    currency: process.env.YANTRAMED_SUBSCRIPTION_CURRENCY ?? "USD",
    interval: "month" as const,
    display: `$${Number(process.env.YANTRAMED_SUBSCRIPTION_PRICE_USD ?? 12)}/month`,
  },
  paddleCheckoutUrl: process.env.YANTRAMED_PADDLE_CHECKOUT_URL ?? "",
};

export const LEGAL_LAST_UPDATED = "August 31, 2026";
