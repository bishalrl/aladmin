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
  /** Public HTTPS URL for Paddle product icon field */
  productIconUrl:
    process.env.YANTRAMED_PRODUCT_ICON_URL ??
    `${(process.env.APP_URL ?? "https://aladmin.sikaupaisa.com").replace(/\/$/, "")}/yantramed-icon.svg`,
};

/** Suggested Paddle product custom_data key/value pairs */
export const YANTRAMED_PADDLE_CUSTOM_DATA = {
  app_slug: "yantramed",
  app_name: "YantraMed",
  product_type: "subscription",
  billing_interval: "month",
  price_usd: String(Number(process.env.YANTRAMED_SUBSCRIPTION_PRICE_USD ?? 12)),
  company: process.env.YANTRAMED_COMPANY_NAME ?? "Sikau Paisa",
  support_email: process.env.YANTRAMED_SUPPORT_EMAIL ?? "hello.sikaupaisa@gmail.com",
  website: (process.env.APP_URL ?? "https://aladmin.sikaupaisa.com").replace(/\/$/, ""),
} as const;

export const LEGAL_LAST_UPDATED = "August 31, 2026";
