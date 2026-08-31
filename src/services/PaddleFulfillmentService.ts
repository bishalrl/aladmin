import { prisma } from "@/lib/db/prisma";
import { projectService } from "@/services/ProjectService";
import {
  accessFromSubscription,
  highestTier,
  tierForPriceId,
  type AccessTier,
} from "@/lib/paddle/access";

type CustomerPayload = {
  id: string;
  email?: string | null;
};

type SubscriptionItem = {
  price?: { id?: string; productId?: string; product_id?: string };
  price_id?: string;
  product_id?: string;
};

type SubscriptionPayload = {
  id: string;
  customerId?: string;
  customer_id?: string;
  status: string;
  items?: SubscriptionItem[];
  scheduledChange?: {
    action?: string | null;
    effectiveAt?: string | null;
  } | null;
  scheduled_change?: {
    action?: string | null;
    effective_at?: string | null;
  } | null;
};

function pickCustomerId(sub: SubscriptionPayload): string | null {
  return sub.customerId ?? sub.customer_id ?? null;
}

function pickScheduled(sub: SubscriptionPayload): {
  action: string | null;
  at: Date | null;
} {
  const sc = sub.scheduledChange ?? sub.scheduled_change;
  if (!sc) return { action: null, at: null };
  const rawAt =
    "effectiveAt" in sc && sc.effectiveAt != null
      ? sc.effectiveAt
      : "effective_at" in sc
        ? sc.effective_at
        : null;
  return {
    action: sc.action ?? null,
    at: rawAt ? new Date(rawAt) : null,
  };
}

function pickPrimaryItem(sub: SubscriptionPayload): {
  priceId: string;
  productId: string;
} {
  const item = sub.items?.[0];
  const priceId =
    item?.price?.id ?? item?.price_id ?? "unknown";
  const productId =
    item?.price?.productId ??
    item?.price?.product_id ??
    item?.product_id ??
    "unknown";
  return { priceId, productId };
}

export class PaddleFulfillmentService {
  private async yantramedProjectId(): Promise<string> {
    const project = await projectService.getBySlug("yantramed");
    return project.id;
  }

  async isEventProcessed(eventId: string): Promise<boolean> {
    const row = await prisma.paddleWebhookEvent.findUnique({
      where: { eventId },
    });
    return Boolean(row);
  }

  async markEventProcessed(eventId: string, eventType: string): Promise<void> {
    await prisma.paddleWebhookEvent.upsert({
      where: { eventId },
      create: { eventId, eventType },
      update: { eventType },
    });
  }

  async upsertCustomer(customer: CustomerPayload): Promise<void> {
    if (!customer.id || !customer.email) return;
    const projectId = await this.yantramedProjectId();
    await prisma.paddleCustomer.upsert({
      where: { customerId: customer.id },
      create: {
        customerId: customer.id,
        email: customer.email,
        projectId,
      },
      update: {
        email: customer.email,
        projectId,
      },
    });
  }

  async upsertSubscription(sub: SubscriptionPayload): Promise<void> {
    const customerId = pickCustomerId(sub);
    if (!customerId || !sub.id) return;

    const { priceId, productId } = pickPrimaryItem(sub);
    const scheduled = pickScheduled(sub);

    await prisma.paddleSubscription.upsert({
      where: { subscriptionId: sub.id },
      create: {
        subscriptionId: sub.id,
        customerId,
        status: sub.status,
        priceId,
        productId,
        scheduledChangeAction: scheduled.action,
        scheduledChangeAt: scheduled.at,
      },
      update: {
        status: sub.status,
        priceId,
        productId,
        scheduledChangeAction: scheduled.action,
        scheduledChangeAt: scheduled.at,
      },
    });
  }

  async getAccessForEmail(email: string): Promise<{
    hasAccess: boolean;
    tier: AccessTier;
    subscriptionId: string | null;
    status: string | null;
    customerId: string | null;
  }> {
    const customer = await prisma.paddleCustomer.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        subscriptions: {
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!customer?.subscriptions.length) {
      return {
        hasAccess: false,
        tier: null,
        subscriptionId: null,
        status: null,
        customerId: customer?.customerId ?? null,
      };
    }

    let bestTier: AccessTier = null;
    let activeSub: (typeof customer.subscriptions)[0] | null = null;

    for (const sub of customer.subscriptions) {
      if (accessFromSubscription(sub)) {
        activeSub = sub;
        bestTier = highestTier(bestTier, tierForPriceId(sub.priceId));
      }
    }

    const primary = activeSub ?? customer.subscriptions[0];

    return {
      hasAccess: activeSub !== null,
      tier: bestTier,
      subscriptionId: primary.subscriptionId,
      status: primary.status,
      customerId: customer.customerId,
    };
  }
}

export const paddleFulfillmentService = new PaddleFulfillmentService();
