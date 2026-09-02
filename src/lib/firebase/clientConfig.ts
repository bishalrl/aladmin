/** Firebase Web SDK config for YantraMed client (Google Sign-In on /subscribe). */
export type YantramedFirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
};

export function getYantramedFirebaseWebConfig(): YantramedFirebaseWebConfig {
  const apiKey =
    process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_WEB_API_KEY?.trim() ||
    process.env.YANTRAMED_FIREBASE_WEB_API_KEY?.trim();
  const authDomain =
    process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_AUTH_DOMAIN?.trim() ||
    process.env.YANTRAMED_FIREBASE_WEB_AUTH_DOMAIN?.trim();
  const projectId =
    process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_PROJECT_ID?.trim() ||
    process.env.YANTRAMED_FIREBASE_PROJECT_ID?.trim() ||
    "yantramed";
  const appId =
    process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_APP_ID?.trim() ||
    process.env.YANTRAMED_FIREBASE_WEB_APP_ID?.trim();

  if (!apiKey || !authDomain || !appId) {
    throw new Error(
      "Missing Firebase Web config. Set NEXT_PUBLIC_YANTRAMED_FIREBASE_API_KEY, AUTH_DOMAIN, and APP_ID.",
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket:
      process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_STORAGE_BUCKET?.trim() ||
      process.env.YANTRAMED_FIREBASE_WEB_STORAGE_BUCKET?.trim(),
    messagingSenderId:
      process.env.NEXT_PUBLIC_YANTRAMED_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
      process.env.YANTRAMED_FIREBASE_WEB_MESSAGING_SENDER_ID?.trim(),
  };
}

export function isYantramedFirebaseWebConfigured(): boolean {
  try {
    getYantramedFirebaseWebConfig();
    return true;
  } catch {
    return false;
  }
}
