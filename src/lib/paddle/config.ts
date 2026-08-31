import { Environment } from "@paddle/paddle-node-sdk";

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPaddleEnvironment(): Environment {
  const env = requireEnv("PADDLE_ENVIRONMENT");
  if (env === "production") return Environment.production;
  if (env === "sandbox") return Environment.sandbox;
  throw new Error(
    `PADDLE_ENVIRONMENT must be "production" or "sandbox" (got "${env}")`,
  );
}

export function getPublicPaddleEnvironment(): "production" | "sandbox" {
  const env = requireEnv("PADDLE_ENVIRONMENT");
  if (env === "production" || env === "sandbox") return env;
  throw new Error(`PADDLE_ENVIRONMENT must be "production" or "sandbox"`);
}

export function getAppBaseUrl(): string {
  return requireEnv("APP_URL").replace(/\/$/, "");
}
