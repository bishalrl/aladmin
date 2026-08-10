import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { bannerSchema } from "@/lib/api/validators";
import { bannerService } from "@/services/BannerService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ project: string }> },
) {
  try {
    await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER],
      request,
    );
    const { project } = await context.params;
    return ok(await bannerService.list(project));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ project: string }> },
) {
  try {
    const session = await requireAdminRole(
      [AdminRole.SUPER_ADMIN, AdminRole.ADMIN],
      request,
    );
    const { project } = await context.params;
    const form = await request.formData();
    const media = form.get("media") || form.get("image");
    if (!(media instanceof File) || media.size === 0) {
      return fail("Banner image or video is required", "VALIDATION_ERROR", 400);
    }
    const parsed = bannerSchema.safeParse({
      brandId: form.get("brandId"),
      title: form.get("title"),
      clickUrl: form.get("clickUrl") || "",
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      priority: form.get("priority") || 0,
      isActive: form.get("isActive") !== "false",
    });
    if (!parsed.success) {
      return fail("Invalid banner data", "VALIDATION_ERROR", 400);
    }
    const banner = await bannerService.create(
      project,
      { ...parsed.data, media },
      session.sub,
      clientIp(request),
    );
    return ok(banner, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
