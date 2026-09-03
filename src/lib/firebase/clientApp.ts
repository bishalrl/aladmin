import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import type { YantramedFirebaseWebConfig } from "@/lib/firebase/clientConfig";
import { getYantramedFirebaseWebConfig } from "@/lib/firebase/clientConfig";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getYantramedFirebaseApp(
  config?: YantramedFirebaseWebConfig,
): FirebaseApp {
  if (!app) {
    const resolved = config ?? getYantramedFirebaseWebConfig();
    const existing = getApps().find((a) => a.name === "yantramed-web");
    app =
      existing ??
      initializeApp(
        {
          apiKey: resolved.apiKey,
          authDomain: resolved.authDomain,
          projectId: resolved.projectId,
          appId: resolved.appId,
          storageBucket: resolved.storageBucket,
          messagingSenderId: resolved.messagingSenderId,
        },
        "yantramed-web",
      );
  }
  return app;
}

export function getYantramedFirebaseAuth(
  config?: YantramedFirebaseWebConfig,
): Auth {
  if (!auth) {
    auth = getAuth(getYantramedFirebaseApp(config));
  }
  return auth;
}
