import { firebaseProjectManager } from "@/lib/firebase/FirebaseProjectManager";

export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

export async function verifyYantramedIdToken(
  idToken: string,
): Promise<VerifiedFirebaseUser> {
  const auth = firebaseProjectManager.getAuth("yantramed");
  if (!auth) {
    throw new Error("YantraMed Firebase Admin is not configured");
  }

  const decoded = await auth.verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: decoded.name ?? null,
    picture: decoded.picture ?? null,
  };
}

export function extractBearerToken(
  authorization: string | null,
): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}
