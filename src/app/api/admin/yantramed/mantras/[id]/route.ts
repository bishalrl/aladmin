import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { mantraSchema } from "@/lib/api/validators";
import { yantramedMantraService } from "@/services/YantramedMantraService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { id } = await context.params;
    const form = await request.formData();
    const parsed = mantraSchema.partial().safeParse({
      title: form.get("title") || undefined,
      description: form.get("description") ?? undefined,
      category: form.get("category") ?? undefined,
      mantraHint: form.get("mantraHint") ?? undefined,
      yantraId: form.get("yantraId") || undefined,
      sortOrder: form.get("sortOrder") || undefined,
      isActive:
        form.get("isActive") === null
          ? undefined
          : form.get("isActive") !== "false",
      duration: form.get("duration") || undefined,
    });
    if (!parsed.success) {
      return fail("Invalid mantra data", "VALIDATION_ERROR", 400);
    }
    const audio = form.get("audio");
    const mantra = await yantramedMantraService.update(
      id,
      {
        ...parsed.data,
        audio: audio instanceof File && audio.size > 0 ? audio : null,
      },
      session.sub,
      clientIp(request),
    );
    return ok(mantra);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { id } = await context.params;
    await yantramedMantraService.softDelete(id, session.sub, clientIp(request));
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
