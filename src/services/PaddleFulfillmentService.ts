import { prisma } from "@/lib/db/prisma";
import { projectService } from "@/services/ProjectService";
import {
  accessFromSubscription,
  billingIntervalForPriceId,
  highestTier,
  planNameForTier,
  tierForPriceId,
  type AccessTier,
} from "@/lib/paddle/access";
import { yantramedBillingFirestoreService } from "@/services/YantramedBillingFirestoreService";
import { yantramedCompAccessService } from "@/services/YantramedCompAccessService";

type CustomerPayload = {
  id: string;
  email?: string | null;
  firebaseUid?: string | null;
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
  const priceId = item?.price?.id ?? item?.price_id ?? "unknown";
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
    const firebaseUid = customer.firebaseUid?.trim() || undefined;

    await prisma.paddleCustomer.upsert({
      where: { customerId: customer.id },
      create: {
        customerId: customer.id,
        email: customer.email,
        firebaseUid,
        projectId,
      },
      update: {
        email: customer.email,
        ...(firebaseUid ? { firebaseUid } : {}),
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

    await this.syncFirestoreForCustomer(customerId);
  }

  /** Mirror Postgres access state to Firestore users/{uid}. */
  async syncFirestoreForCustomer(paddleCustomerId: string): Promise<void> {
    const customer = await prisma.paddleCustomer.findUnique({
      where: { customerId: paddleCustomerId },
      include: {
        subscriptions: { orderBy: { updatedAt: "desc" } },
      },
    });
    if (!customer?.email) return;

    const access = await this.getAccessForEmail(customer.email);
    const primary = customer.subscriptions[0];

    const firebaseUid = await yantramedBillingFirestoreService.resolveFirebaseUid(
      customer.email,
      customer.firebaseUid,
    );
    if (!firebaseUid) {
      console.info(
        "[paddle] no Firebase UID for customer",
        paddleCustomerId,
        "— app can poll subscription/status by email",
      );
      return;
    }

    if (!customer.firebaseUid) {
      await prisma.paddleCustomer.update({
        where: { customerId: paddleCustomerId },
        data: { firebaseUid },
      });
    }

    await yantramedBillingFirestoreService.syncSubscription(firebaseUid, {
      has_access: access.hasAccess,
      tier: access.tier,
      status: access.status,
      subscription_id: access.subscriptionId,
      customer_id: access.customerId,
      price_id: primary?.priceId ?? null,
      product_id: primary?.productId ?? null,
      plan_name: planNameForTier(access.tier),
      billing_interval: primary?.priceId
        ? billingIntervalForPriceId(primary.priceId)
        : null,
      email: customer.email,
      provider: "paddle",
    });
  }

  async recordTransactionPayment(input: {
    transactionId: string;
    customerId: string;
    subscriptionId?: string | null;
    status: string;
    email?: string | null;
    firebaseUid?: string | null;
    tier?: string | null;
  }): Promise<void> {
    if (input.customerId && input.email) {
      await this.upsertCustomer({
        id: input.customerId,
        email: input.email,
        firebaseUid: input.firebaseUid,
      });
    }

    if (input.customerId) {
      await this.syncFirestoreForCustomer(input.customerId);
    }

    const email = input.email?.toLowerCase();
    if (!email || !input.transactionId) return;

    const firebaseUid = await yantramedBillingFirestoreService.resolveFirebaseUid(
      email,
      input.firebaseUid,
    );
    if (!firebaseUid) return;

    await yantramedBillingFirestoreService.recordPayment(firebaseUid, {
      id: input.transactionId,
      status: input.status,
      subscription_id: input.subscriptionId ?? null,
      customer_id: input.customerId,
      tier: input.tier ?? null,
      plan_name: input.tier ?? null,
      email,
    });
  }

  async getAccessForEmail(email: string): Promise<{
    hasAccess: boolean;
    tier: AccessTier;
    subscriptionId: string | null;
    status: string | null;
    customerId: string | null;
    firebaseUid: string | null;
  }> {
    const normalized = email.toLowerCase();

    // Complimentary / tester grants (no Paddle required)
    if (await yantramedCompAccessService.isComped(normalized)) {
      const firebaseUid =
        await yantramedBillingFirestoreService.resolveFirebaseUid(normalized);
      return {
        hasAccess: true,
        tier: "advanced",
        subscriptionId: `comp_${normalized}`,
        status: "active",
        customerId: null,
        firebaseUid,
      };
    }

    const customer = await prisma.paddleCustomer.findFirst({
      where: { email: normalized },
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
        firebaseUid: customer?.firebaseUid ?? null,
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
      firebaseUid: customer.firebaseUid,
    };
  }

  async getAccessForFirebaseUid(firebaseUid: string): Promise<{
    hasAccess: boolean;
    tier: AccessTier;
    subscriptionId: string | null;
    status: string | null;
    customerId: string | null;
    email: string | null;
  }> {
    if (await yantramedCompAccessService.isCompedUid(firebaseUid)) {
      const auth = (
        await import("@/lib/firebase/FirebaseProjectManager")
      ).firebaseProjectManager.getAuth("yantramed");
      let email: string | null = null;
      try {
        email = (await auth?.getUser(firebaseUid))?.email?.toLowerCase() ?? null;
      } catch {
        email = null;
      }
      return {
        hasAccess: true,
        tier: "advanced",
        subscriptionId: email ? `comp_${email}` : "comp",
        status: "active",
        customerId: null,
        email,
      };
    }

    const linked = await prisma.paddleCustomer.findFirst({
      where: { firebaseUid },
      include: { subscriptions: { orderBy: { updatedAt: "desc" } } },
    });
    if (linked?.email) {
      const access = await this.getAccessForEmail(linked.email);
      return { ...access, email: linked.email };
    }

    const auth = (
      await import("@/lib/firebase/FirebaseProjectManager")
    ).firebaseProjectManager.getAuth("yantramed");
    if (!auth) {
      return {
        hasAccess: false,
        tier: null,
        subscriptionId: null,
        status: null,
        customerId: null,
        email: null,
      };
    }

    try {
      const user = await auth.getUser(firebaseUid);
      const email = user.email?.toLowerCase();
      if (!email) {
        return {
          hasAccess: false,
          tier: null,
          subscriptionId: null,
          status: null,
          customerId: null,
          email: null,
        };
      }
      const access = await this.getAccessForEmail(email);
      return { ...access, email };
    } catch {
      return {
        hasAccess: false,
        tier: null,
        subscriptionId: null,
        status: null,
        customerId: null,
        email: null,
      };
    }
  }
}

export const paddleFulfillmentService = new PaddleFulfillmentService();
