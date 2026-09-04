import { FieldValue } from "firebase-admin/firestore";
import { firebaseProjectManager } from "@/lib/firebase/FirebaseProjectManager";
import type { AccessTier } from "@/lib/paddle/access";

export type YantramedFirestoreSubscription = {
  has_access: boolean;
  tier: AccessTier;
  status: string | null;
  subscription_id: string | null;
  customer_id: string | null;
  price_id: string | null;
  product_id: string | null;
  plan_name: string | null;
  billing_interval: "month" | "year" | null;
  email: string;
  provider: "paddle" | "comp" | "tester";
  updated_at: ReturnType<typeof FieldValue.serverTimestamp>;
};

export type YantramedFirestorePayment = {
  id: string;
  provider: "paddle";
  status: string;
  subscription_id: string | null;
  customer_id: string | null;
  tier: string | null;
  plan_name: string | null;
  email: string;
  created_at: ReturnType<typeof FieldValue.serverTimestamp>;
};

export type YantramedFirestoreProfile = {
  email: string;
  display_name?: string | null;
  photo_url?: string | null;
};

/** Sync Paddle billing state to Firestore for the YantraMed mobile app. */
export class YantramedBillingFirestoreService {
  private db() {
    return firebaseProjectManager.getFirestore("yantramed");
  }

  /** Resolve Firebase UID from stored link or Auth lookup by email. */
  async resolveFirebaseUid(
    email: string,
    firebaseUid?: string | null,
  ): Promise<string | null> {
    if (firebaseUid?.trim()) return firebaseUid.trim();

    const auth = firebaseProjectManager.getAuth("yantramed");
    if (!auth || !email) return null;

    try {
      const user = await auth.getUserByEmail(email.toLowerCase());
      return user.uid;
    } catch {
      return null;
    }
  }

  async syncSubscription(
    firebaseUid: string,
    data: Omit<YantramedFirestoreSubscription, "updated_at" | "provider"> & {
      provider?: YantramedFirestoreSubscription["provider"];
    },
    profile?: YantramedFirestoreProfile,
  ): Promise<void> {
    const db = this.db();
    if (!db) {
      console.warn("[yantramed-billing] Firestore not configured — skip sync");
      return;
    }

    const { provider = "paddle", ...rest } = data;
    const payload: YantramedFirestoreSubscription = {
      ...rest,
      provider,
      updated_at: FieldValue.serverTimestamp(),
    };

    const doc: Record<string, unknown> = { subscription: payload };
    if (profile) {
      doc.email = profile.email;
      if (profile.display_name != null) doc.display_name = profile.display_name;
      if (profile.photo_url != null) doc.photo_url = profile.photo_url;
    }

    await db.collection("users").doc(firebaseUid).set(doc, { merge: true });
  }

  async recordPayment(
    firebaseUid: string,
    payment: Omit<YantramedFirestorePayment, "created_at" | "provider">,
  ): Promise<void> {
    const db = this.db();
    if (!db) return;

    await db
      .collection("users")
      .doc(firebaseUid)
      .collection("payments")
      .doc(payment.id)
      .set({
        ...payment,
        provider: "paddle",
        created_at: FieldValue.serverTimestamp(),
      });
  }
}

export const yantramedBillingFirestoreService =
  new YantramedBillingFirestoreService();
