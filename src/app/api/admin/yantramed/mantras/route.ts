import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { mantraSchema } from "@/lib/api/validators";
import { yantramedMantraService } from "@/services/YantramedMantraService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    return ok(await yantramedMantraService.list());
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
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return fail("Audio file is required", "VALIDATION_ERROR", 400);
    }
    const parsed = mantraSchema.safeParse({
      title: form.get("title"),
      description: form.get("description") || undefined,
      category: form.get("category") || undefined,
      mantraHint: form.get("mantraHint") || undefined,
      yantraId: form.get("yantraId") || null,
      sortOrder: form.get("sortOrder") || 0,
      isActive: form.get("isActive") !== "false",
      duration: form.get("duration") || undefined,
    });
    if (!parsed.success) {
      return fail("Invalid mantra data", "VALIDATION_ERROR", 400);
    }
    const mantra = await yantramedMantraService.create(
      { ...parsed.data, audio },
      session.sub,
      clientIp(request),
    );
    return ok(mantra, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
