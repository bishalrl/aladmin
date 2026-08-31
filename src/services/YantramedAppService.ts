import { prisma } from "@/lib/db/prisma";

const PRICING_SETTING_KEY = "yantramed.pricing";

export type YantramedPricing = {
  amount: number;
  currency: string;
  interval: "month" | "year";
  display: string;
  product_id: string | null;
};

export type YantramedAppInfo = {
  app: {
    name: string;
    slug: string;
  };
  pricing: YantramedPricing;
  urls: {
    account_deletion: string;
    course: string;
    course_day: string;
    course_day_mantra: string;
    course_day_music: string;
    yantras: string;
    mantras: string;
    music: string;
  };
  course_flow: {
    step_1: string;
    step_2: string;
    step_3: string;
    step_4: string;
  };
};

function appBaseUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function defaultPricing(): YantramedPricing {
  const amount = Number(process.env.YANTRAMED_SUBSCRIPTION_PRICE_USD ?? 12);
  const currency = process.env.YANTRAMED_SUBSCRIPTION_CURRENCY ?? "USD";
  const interval =
    process.env.YANTRAMED_SUBSCRIPTION_INTERVAL === "year" ? "year" : "month";
  const symbol = currency === "USD" ? "$" : `${currency} `;
  const display =
    interval === "month"
      ? `${symbol}${amount}/month`
      : `${symbol}${amount}/year`;

  return {
    amount,
    currency,
    interval,
    display,
    product_id: process.env.YANTRAMED_SUBSCRIPTION_PRODUCT_ID ?? null,
  };
}

export class YantramedAppService {
  async getPricing(): Promise<YantramedPricing> {
    const stored = await prisma.setting.findUnique({
      where: { key: PRICING_SETTING_KEY },
    });
    if (stored?.value && typeof stored.value === "object") {
      const v = stored.value as Partial<YantramedPricing>;
      if (typeof v.amount === "number" && v.currency && v.interval) {
        return {
          amount: v.amount,
          currency: v.currency,
          interval: v.interval,
          display:
            v.display ??
            (v.interval === "month"
              ? `$${v.amount}/month`
              : `$${v.amount}/year`),
          product_id: v.product_id ?? null,
        };
      }
    }
    return defaultPricing();
  }

  async getAppInfo(): Promise<YantramedAppInfo> {
    const base = appBaseUrl();
    const pricing = await this.getPricing();

    return {
      app: {
        name: "YantraMed",
        slug: "yantramed",
      },
      pricing,
      urls: {
        account_deletion: `${base}/delete-account/yantramed`,
        course: `${base}/api/v1/yantramed/course`,
        course_day: `${base}/api/v1/yantramed/course/days/{day}`,
        course_day_mantra: `${base}/api/v1/yantramed/course/days/{day}/mantra`,
        course_day_music: `${base}/api/v1/yantramed/course/days/{day}/music`,
        yantras: `${base}/api/v1/yantramed/yantras`,
        mantras: `${base}/api/v1/yantramed/mantras`,
        music: `${base}/api/v1/yantramed/music`,
      },
      course_flow: {
        step_1: "GET /api/v1/yantramed/course/days/{day}/mantra",
        step_2: "GET /api/v1/yantramed/course/days/{day}/music",
        step_3: "Replay the same mantra audio from step 1",
        step_4: "Mark day complete in Firebase (not this API)",
      },
    };
  }
}

export const yantramedAppService = new YantramedAppService();
