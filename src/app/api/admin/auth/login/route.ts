import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/api/validators";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";
import { auditLogService } from "@/services/AuditLogService";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`login:${ip}`, 10, 60_000);
    if (!limited.ok) {
      return fail("Too many login attempts", "RATE_LIMITED", 429);
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid credentials payload", "VALIDATION_ERROR", 400);
    }

    const admin = await prisma.admin.findFirst({
      where: {
        email: parsed.data.email.toLowerCase(),
        deletedAt: null,
      },
    });

    if (!admin || !admin.isActive) {
      return fail("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
    if (!valid) {
      return fail("Invalid email or password", "INVALID_CREDENTIALS", 401);
    }

    const token = await createSessionToken({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    await setSessionCookie(token);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await auditLogService.log({
      adminId: admin.id,
      action: "admin.login",
      resourceType: "admin",
      resourceId: admin.id,
      ipAddress: ip,
    });

    return ok({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
