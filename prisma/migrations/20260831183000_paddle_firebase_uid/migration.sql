ALTER TABLE "paddle_customers" ADD COLUMN "firebase_uid" TEXT;

CREATE INDEX "paddle_customers_firebase_uid_idx" ON "paddle_customers"("firebase_uid");
