import { NextRequest } from "next/server";
import { handleRouteError, ok } from "@/lib/api/response";
import { bannerService } from "@/services/BannerService";
import { enforcePublicApi, logApiRequest } from "@/lib/api/publicGuard";
import { clientIp } from "@/lib/api/rateLimit";
import { projectService } from "@/services/ProjectService";

export async function GET(request: NextRequest) {
  const started = Date.now();
  try {
    const blocked = await enforcePublicApi(request, {
      path: "/api/v1/budgeting-sathi/banners",
    });
    if (blocked) return blocked;

    const project = await projectService.getBySlug("budgeting-sathi");
    const data = await bannerService.listActivePublic("budgeting-sathi");

    await logApiRequest({
      projectId: project.id,
      method: "GET",
      path: "/api/v1/budgeting-sathi/banners",
      statusCode: 200,
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
      responseMs: Date.now() - started,
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
