import { readFileSync, existsSync } from "fs";
import path from "path";
import { App, cert, getApps, initializeApp, ServiceAccount } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";

export type FirebaseProjectKey = "budgeting-sathi" | "yantramed";

export type FirebaseHealthStatus =
  | "connected"
  | "not_configured"
  | "error";

export type FirebaseHealthResult = {
  projectKey: FirebaseProjectKey;
  displayName: string;
  projectId: string | null;
  status: FirebaseHealthStatus;
  message: string;
  configured: boolean;
};

type ResolvedCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  source: "env" | "file" | "json";
};

type ResolveResult =
  | { ok: true; credentials: ResolvedCredentials }
  | { ok: false; error?: string };

const DISPLAY: Record<FirebaseProjectKey, string> = {
  "budgeting-sathi": "Budgeting Sathi (Aarthik)",
  yantramed: "YantraMed",
};

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n").replace(/^"|"$/g, "").trim();
}

function loadFromFile(filePath: string): ServiceAccount {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(/*turbopackIgnore: true*/ process.cwd(), filePath);

  if (!existsSync(absolute)) {
    throw new Error(`Credentials file not found: ${filePath}`);
  }

  const raw = JSON.parse(readFileSync(absolute, "utf8")) as {
    type?: string;
    project_id?: string;
    client_email?: string;
    private_key?: string;
    project_info?: { project_id?: string };
  };

  // Android google-services.json — wrong file for Admin SDK
  if (raw.project_info && !raw.private_key) {
    throw new Error(
      `Wrong JSON type: "${filePath}" is google-services.json (mobile app). ` +
        `Admin needs Service Account JSON (has "private_key" + "client_email"). ` +
        `Firebase Console → Project settings → Service accounts → Generate new private key → save to secrets/`,
    );
  }

  if (!raw.project_id || !raw.client_email || !raw.private_key) {
    throw new Error(
      `Invalid service account file "${filePath}". Expected project_id, client_email, private_key.`,
    );
  }

  return {
    projectId: raw.project_id,
    clientEmail: raw.client_email,
    privateKey: normalizePrivateKey(raw.private_key),
  };
}

function resolveCredentials(key: FirebaseProjectKey): ResolveResult {
  const prefix =
    key === "budgeting-sathi" ? "BUDGETING_SATHI_FIREBASE" : "YANTRAMED_FIREBASE";

  const filePath = process.env[`${prefix}_CREDENTIALS_FILE`];
  if (filePath) {
    try {
      const fromFile = loadFromFile(filePath);
      return {
        ok: true,
        credentials: {
          projectId: fromFile.projectId!,
          clientEmail: fromFile.clientEmail!,
          privateKey: fromFile.privateKey!,
          source: "file",
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid credentials file",
      };
    }
  }

  const jsonRaw = process.env[`${prefix}_CREDENTIALS_JSON`];
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          ok: true,
          credentials: {
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: normalizePrivateKey(parsed.private_key),
            source: "json",
          },
        };
      }
    } catch {
      return { ok: false, error: "Invalid CREDENTIALS_JSON" };
    }
  }

  const projectId = process.env[`${prefix}_PROJECT_ID`];
  const clientEmail = process.env[`${prefix}_CLIENT_EMAIL`];
  const privateKey = process.env[`${prefix}_PRIVATE_KEY`];

  if (projectId && clientEmail && privateKey) {
    return {
      ok: true,
      credentials: {
        projectId,
        clientEmail,
        privateKey: normalizePrivateKey(privateKey),
        source: "env",
      },
    };
  }

  return { ok: false };
}

class FirebaseProjectManager {
  private apps = new Map<FirebaseProjectKey, App>();

  getDisplayName(key: FirebaseProjectKey) {
    return DISPLAY[key];
  }

  isConfigured(key: FirebaseProjectKey): boolean {
    return resolveCredentials(key).ok;
  }

  getProjectId(key: FirebaseProjectKey): string | null {
    const resolved = resolveCredentials(key);
    if (resolved.ok) return resolved.credentials.projectId;
    return (
      (key === "budgeting-sathi"
        ? process.env.BUDGETING_SATHI_FIREBASE_PROJECT_ID
        : process.env.YANTRAMED_FIREBASE_PROJECT_ID) || null
    );
  }

  getApp(key: FirebaseProjectKey): App | null {
    const resolved = resolveCredentials(key);
    if (!resolved.ok) return null;

    const existing = this.apps.get(key);
    if (existing) return existing;

    const already = getApps().find((app) => app.name === key);
    if (already) {
      this.apps.set(key, already);
      return already;
    }

    const { credentials } = resolved;
    const serviceAccount: ServiceAccount = {
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey,
    };

    const app = initializeApp(
      {
        credential: cert(serviceAccount),
        projectId: credentials.projectId,
      },
      key,
    );
    this.apps.set(key, app);
    return app;
  }

  getAuth(key: FirebaseProjectKey): Auth | null {
    const app = this.getApp(key);
    return app ? getAuth(app) : null;
  }

  async checkHealth(
    key: FirebaseProjectKey,
    options?: { live?: boolean },
  ): Promise<FirebaseHealthResult> {
    const displayName = DISPLAY[key];
    const projectId = this.getProjectId(key);
    const resolved = resolveCredentials(key);

    if (!resolved.ok) {
      return {
        projectKey: key,
        displayName,
        projectId,
        status: resolved.error ? "error" : "not_configured",
        configured: false,
        message:
          resolved.error ||
          "Add a Firebase Admin service account JSON (not google-services.json). See Firebase Connection page.",
      };
    }

    const live = options?.live !== false;
    if (!live) {
      return {
        projectKey: key,
        displayName,
        projectId,
        status: "connected",
        configured: true,
        message: "Credentials present",
      };
    }

    try {
      const auth = this.getAuth(key);
      if (!auth) {
        return {
          projectKey: key,
          displayName,
          projectId,
          status: "error",
          configured: true,
          message: "Failed to initialize Firebase Auth",
        };
      }
      await auth.listUsers(1);
      return {
        projectKey: key,
        displayName,
        projectId,
        status: "connected",
        configured: true,
        message: "Connected — Firebase Auth reachable",
      };
    } catch (error) {
      return {
        projectKey: key,
        displayName,
        projectId,
        status: "error",
        configured: true,
        message:
          error instanceof Error
            ? error.message
            : "Unknown Firebase connection error",
      };
    }
  }

  async checkAll(options?: { live?: boolean }): Promise<FirebaseHealthResult[]> {
    return Promise.all([
      this.checkHealth("budgeting-sathi", options),
      this.checkHealth("yantramed", options),
    ]);
  }
}

export const firebaseProjectManager = new FirebaseProjectManager();
