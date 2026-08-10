import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { bannerSchema } from "@/lib/api/validators";
import { bannerService } from "@/services/BannerService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ project: string; id: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { id } = await context.params;
    const form = await request.formData();
    const parsed = bannerSchema.partial().safeParse({
      brandId: form.get("brandId") || undefined,
      title: form.get("title") || undefined,
      clickUrl: form.get("clickUrl") || undefined,
      startDate: form.get("startDate") || undefined,
      endDate: form.get("endDate") || undefined,
      priority: form.get("priority") || undefined,
      isActive:
        form.get("isActive") === null
          ? undefined
          : form.get("isActive") !== "false",
    });
    if (!parsed.success) {
      return fail("Invalid banner data", "VALIDATION_ERROR", 400);
    }
    const media = form.get("media") || form.get("image");
    const banner = await bannerService.update(
      id,
      {
        ...parsed.data,
        media: media instanceof File && media.size > 0 ? media : null,
      },
      session.sub,
      clientIp(request),
    );
    return ok(banner);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ project: string; id: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { id } = await context.params;
    await bannerService.softDelete(id, session.sub, clientIp(request));
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
