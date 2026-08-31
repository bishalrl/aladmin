-- CreateTable
CREATE TABLE "paddle_customers" (
    "customer_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paddle_customers_pkey" PRIMARY KEY ("customer_id")
);

CREATE TABLE "paddle_subscriptions" (
    "subscription_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "scheduled_change_action" TEXT,
    "scheduled_change_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paddle_subscriptions_pkey" PRIMARY KEY ("subscription_id")
);

CREATE TABLE "paddle_webhook_events" (
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_webhook_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "paddle_customers_email_idx" ON "paddle_customers"("email");
CREATE INDEX "paddle_subscriptions_customer_id_idx" ON "paddle_subscriptions"("customer_id");
CREATE INDEX "paddle_subscriptions_status_idx" ON "paddle_subscriptions"("status");

ALTER TABLE "paddle_customers" ADD CONSTRAINT "paddle_customers_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "paddle_subscriptions" ADD CONSTRAINT "paddle_subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "paddle_customers"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
