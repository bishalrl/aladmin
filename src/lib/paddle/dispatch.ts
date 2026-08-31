import type { EventEntity } from "@paddle/paddle-node-sdk";
import { paddleFulfillmentService } from "@/services/PaddleFulfillmentService";

function dataAsRecord(event: EventEntity): Record<string, unknown> {
  return (event.data ?? {}) as unknown as Record<string, unknown>;
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

  switch (eventType) {
    case "customer.created":
    case "customer.updated": {
      const customer = data as { id?: string; email?: string };
      if (customer.id) {
        await paddleFulfillmentService.upsertCustomer({
          id: customer.id,
          email: customer.email ?? null,
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
        });
      }
      break;
    }
    case "transaction.completed": {
      const customData = data.customData as Record<string, string> | undefined;
      const customerId = data.customerId as string | undefined;
      if (customerId && customData?.email) {
        await paddleFulfillmentService.upsertCustomer({
          id: customerId,
          email: customData.email,
        });
      }
      break;
    }
    default:
      console.info("[paddle] ignored event type", eventType);
  }

  await paddleFulfillmentService.markEventProcessed(eventId, eventType);
}
