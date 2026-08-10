import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { brandSchema } from "@/lib/api/validators";
import { brandService } from "@/services/BrandService";
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
    const parsed = brandSchema.partial().safeParse({
      name: form.get("name") || undefined,
      website: form.get("website") ?? undefined,
      contact: form.get("contact") ?? undefined,
      isActive:
        form.get("isActive") === null
          ? undefined
          : form.get("isActive") !== "false",
    });
    if (!parsed.success) {
      return fail("Invalid brand data", "VALIDATION_ERROR", 400);
    }
    const logo = form.get("logo");
    const brand = await brandService.update(
      id,
      {
        ...parsed.data,
        logo: logo instanceof File && logo.size > 0 ? logo : null,
      },
      session.sub,
      clientIp(request),
    );
    return ok(brand);
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
    await brandService.softDelete(id, session.sub, clientIp(request));
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
