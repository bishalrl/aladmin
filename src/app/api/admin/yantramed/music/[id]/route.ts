import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { musicSchema } from "@/lib/api/validators";
import { yantramedMusicService } from "@/services/YantramedMusicService";
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
    const parsed = musicSchema.partial().safeParse({
      title: form.get("title") || undefined,
      description: form.get("description") ?? undefined,
      sortOrder: form.get("sortOrder") || undefined,
      dayNumber: form.get("dayNumber") || undefined,
      isActive:
        form.get("isActive") === null
          ? undefined
          : form.get("isActive") !== "false",
      duration: form.get("duration") || undefined,
    });
    if (!parsed.success) {
      return fail("Invalid music data", "VALIDATION_ERROR", 400);
    }
    const audio = form.get("audio");
    const music = await yantramedMusicService.update(
      id,
      {
        ...parsed.data,
        audio: audio instanceof File && audio.size > 0 ? audio : null,
      },
      session.sub,
      clientIp(request),
    );
    return ok(music);
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
    await yantramedMusicService.softDelete(id, session.sub, clientIp(request));
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
