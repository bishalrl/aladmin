import { NextRequest } from "next/server";
import { requireAdminRole } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { brandSchema } from "@/lib/api/validators";
import { brandService } from "@/services/BrandService";
import { clientIp } from "@/lib/api/rateLimit";
import { AdminRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ project: string }> },
) {
  try {
    await requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.VIEWER], request);
    const { project } = await context.params;
    const brands = await brandService.list(project);
    return ok(brands);
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
    const parsed = brandSchema.safeParse({
      name: form.get("name"),
      website: form.get("website") || "",
      contact: form.get("contact") || undefined,
      isActive: form.get("isActive") !== "false",
    });
    if (!parsed.success) {
      return fail("Invalid brand data", "VALIDATION_ERROR", 400);
    }
    const logo = form.get("logo");
    const brand = await brandService.create(
      project,
      {
        ...parsed.data,
        logo: logo instanceof File && logo.size > 0 ? logo : null,
      },
      session.sub,
      clientIp(request),
    );
    return ok(brand, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
