import { NextRequest } from "next/server";
import { getSession, SessionPayload, verifySessionToken, SESSION_COOKIE } from "./session";
import { AppError } from "@/lib/api/response";
import { AdminRole } from "@prisma/client";

export async function requireAdminSession(
  request?: NextRequest,
): Promise<SessionPayload> {
  let session: SessionPayload | null = null;

  if (request) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    session = token ? await verifySessionToken(token) : null;
  } else {
    session = await getSession();
  }

  if (!session) {
    throw new AppError("Authentication required", "UNAUTHORIZED", 401);
  }

  return session;
}

export async function requireAdminRole(
  allowed: AdminRole[],
  request?: NextRequest,
): Promise<SessionPayload> {
  const session = await requireAdminSession(request);
  if (!allowed.includes(session.role)) {
    throw new AppError("Insufficient permissions", "FORBIDDEN", 403);
  }
  return session;
}
