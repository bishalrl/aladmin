import type { EventEntity } from "@paddle/paddle-node-sdk";
import { paddleFulfillmentService } from "@/services/PaddleFulfillmentService";

function dataAsRecord(event: EventEntity): Record<string, unknown> {
  return (event.data ?? {}) as unknown as Record<string, unknown>;
}

function readCustomData(data: Record<string, unknown>): {
  email?: string;
  firebase_uid?: string;
  tier?: string;
} {
  const raw = data.customData ?? data.custom_data;
  if (!raw || typeof raw !== "object") return {};
  const cd = raw as Record<string, unknown>;
  return {
    email: typeof cd.email === "string" ? cd.email : undefined,
    firebase_uid:
      typeof cd.firebase_uid === "string"
        ? cd.firebase_uid
        : typeof cd.firebaseUid === "string"
          ? cd.firebaseUid
          : undefined,
    tier: typeof cd.tier === "string" ? cd.tier : undefined,
  };
}

export async function dispatchPaddleEvent(event: EventEntity): Promise<void> {
  const eventId = event.eventId;
  const eventType = event.eventType;

  if (!eventId) {
    throw new Error("Paddle event missing eventId");
  }

  if (await paddleFulfillmentService.isEventProcessed(eventId)) {
    console.info("[paddle] duplicate event skipped", eventId, eventType);
    return;
  }

  const data = dataAsRecord(event);
  const custom = readCustomData(data);

  switch (eventType) {
    case "customer.created":
    case "customer.updated": {
      const customer = data as { id?: string; email?: string };
      if (customer.id) {
        await paddleFulfillmentService.upsertCustomer({
          id: customer.id,
          email: customer.email ?? null,
          firebaseUid: custom.firebase_uid,
        });
      }
      break;
    }
    case "subscription.created":
    case "subscription.updated":
    case "subscription.activated":
    case "subscription.canceled":
    case "subscription.paused":
    case "subscription.resumed":
    case "subscription.trialing":
    case "subscription.past_due": {
      await paddleFulfillmentService.upsertSubscription(
        data as Parameters<typeof paddleFulfillmentService.upsertSubscription>[0],
      );
      const customerId =
        (data.customerId as string | undefined) ??
        (data.customer_id as string | undefined);
      const customerEmail = data.customer as { email?: string } | undefined;
      if (customerId && customerEmail?.email) {
        await paddleFulfillmentService.upsertCustomer({
          id: customerId,
          email: customerEmail.email,
          firebaseUid: custom.firebase_uid,
        });
      }
      break;
    }
    case "transaction.completed": {
      const customerId = data.customerId as string | undefined;
      const transactionId = data.id as string | undefined;
      const subscriptionId = data.subscriptionId as string | undefined;
      const status = (data.status as string | undefined) ?? "completed";
      const email =
        custom.email ??
        (data.customer as { email?: string } | undefined)?.email;

      if (customerId && transactionId) {
        await paddleFulfillmentService.recordTransactionPayment({
          transactionId,
          customerId,
          subscriptionId: subscriptionId ?? null,
          status,
          email: email ?? null,
          firebaseUid: custom.firebase_uid,
          tier: custom.tier ?? null,
        });
      }
      break;
    }
    default:
      console.info("[paddle] ignored event type", eventType);
  }

  await paddleFulfillmentService.markEventProcessed(eventId, eventType);
}
