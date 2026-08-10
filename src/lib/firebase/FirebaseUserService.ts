import {
  firebaseProjectManager,
  FirebaseProjectKey,
} from "@/lib/firebase/FirebaseProjectManager";
import { AppError } from "@/lib/api/response";

export type FirebaseUserDto = {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  disabled: boolean;
  emailVerified: boolean;
  createdAt: string | null;
  lastSignInAt: string | null;
  providers: string[];
};

function mapUser(user: {
  uid: string;
  email?: string;
  displayName?: string;
  phoneNumber?: string;
  photoURL?: string;
  disabled: boolean;
  emailVerified: boolean;
  metadata: { creationTime?: string; lastSignInTime?: string };
  providerData: { providerId: string }[];
}): FirebaseUserDto {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    phoneNumber: user.phoneNumber ?? null,
    photoURL: user.photoURL ?? null,
    disabled: user.disabled,
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime ?? null,
    lastSignInAt: user.metadata.lastSignInTime ?? null,
    providers: user.providerData.map((p) => p.providerId),
  };
}

export class FirebaseUserService {
  constructor(private projectKey: FirebaseProjectKey) {}

  private auth() {
    const auth = firebaseProjectManager.getAuth(this.projectKey);
    if (!auth) {
      throw new AppError(
        "Firebase is not configured for this project",
        "FIREBASE_NOT_CONFIGURED",
        503,
      );
    }
    return auth;
  }

  async listUsers(params: {
    pageToken?: string;
    maxResults?: number;
    search?: string;
  }) {
    const auth = this.auth();
    const maxResults = Math.min(params.maxResults ?? 50, 1000);

    if (params.search) {
      const q = params.search.trim().toLowerCase();
      // Firebase Admin has no native search; fetch a page and filter.
      const result = await auth.listUsers(1000, params.pageToken);
      const filtered = result.users
        .map(mapUser)
        .filter(
          (u) =>
            u.email?.toLowerCase().includes(q) ||
            u.displayName?.toLowerCase().includes(q) ||
            u.uid.toLowerCase().includes(q) ||
            u.phoneNumber?.includes(q),
        );
      return {
        users: filtered.slice(0, maxResults),
        pageToken: result.pageToken ?? null,
        configured: true,
      };
    }

    const result = await auth.listUsers(maxResults, params.pageToken);
    return {
      users: result.users.map(mapUser),
      pageToken: result.pageToken ?? null,
      configured: true,
    };
  }

  async getUser(uid: string) {
    const auth = this.auth();
    try {
      const user = await auth.getUser(uid);
      return mapUser(user);
    } catch {
      throw new AppError("User not found", "USER_NOT_FOUND", 404);
    }
  }

  async getUserByEmail(email: string) {
    const auth = this.auth();
    try {
      const user = await auth.getUserByEmail(email);
      return mapUser(user);
    } catch {
      return null;
    }
  }

  async deleteUser(uid: string) {
    const auth = this.auth();
    await auth.deleteUser(uid);
  }

  async countApprox() {
    if (!firebaseProjectManager.isConfigured(this.projectKey)) {
      return { total: null, configured: false as const };
    }
    const auth = this.auth();
    let total = 0;
    let pageToken: string | undefined;
    // Cap pages to avoid long admin waits; enough for overview.
    for (let i = 0; i < 5; i++) {
      const page = await auth.listUsers(1000, pageToken);
      total += page.users.length;
      pageToken = page.pageToken;
      if (!pageToken) break;
    }
    return { total, configured: true as const, truncated: Boolean(pageToken) };
  }
}

export const budgetingSathiFirebaseService = new FirebaseUserService(
  "budgeting-sathi",
);
export const yantraMedFirebaseService = new FirebaseUserService("yantramed");
