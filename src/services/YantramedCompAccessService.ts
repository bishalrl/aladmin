import { FieldValue } from "firebase-admin/firestore";
import { firebaseProjectManager } from "@/lib/firebase/FirebaseProjectManager";
import { yantramedBillingFirestoreService } from "@/services/YantramedBillingFirestoreService";

export type CompAccessRecord = {
  email: string;
  enabled: boolean;
  tier: "advanced";
  note: string;
  granted_at: ReturnType<typeof FieldValue.serverTimestamp>;
  updated_at: ReturnType<typeof FieldValue.serverTimestamp>;
};

/**
 * Complimentary / tester access — no Paddle payment required.
 * Stored at Firestore: comp_access/{email}
 * If Auth user exists, also writes users/{uid}.subscription with has_access=true.
 */
export class YantramedCompAccessService {
  private db() {
    return firebaseProjectManager.getFirestore("yantramed");
  }

  private docId(email: string) {
    return email.trim().toLowerCase();
  }

  async isComped(email: string): Promise<boolean> {
    const db = this.db();
    if (!db || !email) return false;
    const snap = await db.collection("comp_access").doc(this.docId(email)).get();
    if (!snap.exists) return false;
    return snap.data()?.enabled === true;
  }

  async isCompedUid(firebaseUid: string): Promise<boolean> {
    const auth = firebaseProjectManager.getAuth("yantramed");
    if (!auth) return false;
    try {
      const user = await auth.getUser(firebaseUid);
      if (!user.email) return false;
      return this.isComped(user.email);
    } catch {
      return false;
    }
  }

  /**
   * Grant unrestricted Advanced access for a Google account email.
   * Tester must sign into the app with this same Gmail.
   */
  async grant(email: string, note = "tester complimentary access"): Promise<{
    email: string;
    firebaseUid: string | null;
    firestoreUserWritten: boolean;
  }> {
    const normalized = this.docId(email);
    if (!normalized.includes("@")) {
      throw new Error("Valid email required");
    }

    const db = this.db();
    if (!db) {
      throw new Error("YantraMed Firestore is not configured (Admin SDK credentials)");
    }

    await db
      .collection("comp_access")
      .doc(normalized)
      .set(
        {
          email: normalized,
          enabled: true,
          tier: "advanced",
          note,
          granted_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    const firebaseUid =
      await yantramedBillingFirestoreService.resolveFirebaseUid(normalized);

    let firestoreUserWritten = false;
    if (firebaseUid) {
      await yantramedBillingFirestoreService.syncSubscription(
        firebaseUid,
        {
          has_access: true,
          tier: "advanced",
          status: "active",
          subscription_id: `comp_${normalized}`,
          customer_id: null,
          price_id: null,
          product_id: null,
          plan_name: "Advanced",
          billing_interval: null,
          email: normalized,
          provider: "comp",
        },
        { email: normalized },
      );
      firestoreUserWritten = true;
    }

    return { email: normalized, firebaseUid, firestoreUserWritten };
  }

  async revoke(email: string): Promise<void> {
    const normalized = this.docId(email);
    const db = this.db();
    if (!db) return;

    await db.collection("comp_access").doc(normalized).set(
      {
        enabled: false,
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const firebaseUid =
      await yantramedBillingFirestoreService.resolveFirebaseUid(normalized);
    if (firebaseUid) {
      await yantramedBillingFirestoreService.syncSubscription(
        firebaseUid,
        {
          has_access: false,
          tier: null,
          status: "canceled",
          subscription_id: null,
          customer_id: null,
          price_id: null,
          product_id: null,
          plan_name: null,
          billing_interval: null,
          email: normalized,
          provider: "comp",
        },
        { email: normalized },
      );
    }
  }
}

export const yantramedCompAccessService = new YantramedCompAccessService();
