import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getYantramedFirebaseWebConfig } from "@/lib/firebase/clientConfig";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getYantramedFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getYantramedFirebaseWebConfig();
    const existing = getApps().find((a) => a.name === "yantramed-web");
    app =
      existing ??
      initializeApp(
        {
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          appId: config.appId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
        },
        "yantramed-web",
      );
  }
  return app;
}

export function getYantramedFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getYantramedFirebaseApp());
  }
  return auth;
}
