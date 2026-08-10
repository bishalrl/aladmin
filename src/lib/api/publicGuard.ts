import { NextRequest } from "next/server";
import { apiKeyService } from "@/services/ApiKeyService";
import { prisma } from "@/lib/db/prisma";
import { fail } from "@/lib/api/response";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";

export async function enforcePublicApi(
  request: NextRequest,
  options?: { projectId?: string; path?: string },
): Promise<Response | null> {
  const ip = clientIp(request);
  const limited = rateLimit(`public:${ip}:${options?.path ?? request.nextUrl.pathname}`, 120, 60_000);
  if (!limited.ok) {
    return fail("Too many requests", "RATE_LIMITED", 429);
  }

  const apiKey = request.headers.get("x-api-key");
  const valid = await apiKeyService.validate(apiKey);
  if (!valid) {
    return fail("Invalid or missing API key", "INVALID_API_KEY", 401);
  }

  const started = Date.now();
  // Fire-and-forget log after response would be ideal; log intent here for simplicity.
  void prisma.apiRequestLog
    .create({
      data: {
        projectId: options?.projectId ?? null,
        method: request.method,
        path: options?.path ?? request.nextUrl.pathname,
        statusCode: 0,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
        responseMs: Date.now() - started,
      },
    })
    .catch(() => undefined);

  return null;
}

export async function logApiRequest(input: {
  projectId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  responseMs?: number;
}) {
  try {
    await prisma.apiRequestLog.create({
      data: {
        projectId: input.projectId ?? null,
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        responseMs: input.responseMs ?? null,
      },
    });
  } catch {
    // never break the API for logging
  }
}
