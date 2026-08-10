import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { apiKeyCreateSchema } from "@/lib/api/validators";
import { apiKeyService } from "@/services/ApiKeyService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN], request);
    return ok(await apiKeyService.list());
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const body = await request.json();
    const parsed = apiKeyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid API key payload", "VALIDATION_ERROR", 400);
    }
    const created = await apiKeyService.create(
      parsed.data,
      session.sub,
      clientIp(request),
    );
    return ok(created, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
