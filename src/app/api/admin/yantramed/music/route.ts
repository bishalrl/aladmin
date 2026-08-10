import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { musicSchema } from "@/lib/api/validators";
import { yantramedMusicService } from "@/services/YantramedMusicService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    return ok(await yantramedMusicService.list());
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
    const parsed = musicSchema.safeParse({
      title: form.get("title"),
      description: form.get("description") || undefined,
      sortOrder: form.get("sortOrder") || 0,
      isActive: form.get("isActive") !== "false",
      duration: form.get("duration") || undefined,
      dayNumber: form.get("dayNumber") || undefined,
    });
    if (!parsed.success) {
      return fail("Invalid music data", "VALIDATION_ERROR", 400);
    }
    const music = await yantramedMusicService.create(
      { ...parsed.data, audio },
      session.sub,
      clientIp(request),
    );
    return ok(music, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
