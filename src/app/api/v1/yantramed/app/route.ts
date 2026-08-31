import { NextRequest } from "next/server";
import { handleRouteError, ok } from "@/lib/api/response";
import { yantramedAppService } from "@/services/YantramedAppService";
import { enforcePublicApi, logApiRequest } from "@/lib/api/publicGuard";
import { clientIp } from "@/lib/api/rateLimit";
import { projectService } from "@/services/ProjectService";

/** One-stop config for the YantraMed mobile app: pricing, URLs, day flow */
export async function GET(request: NextRequest) {
  const started = Date.now();
  try {
    const blocked = await enforcePublicApi(request, {
      path: "/api/v1/yantramed/app",
    });
    if (blocked) return blocked;

    const project = await projectService.getBySlug("yantramed");
    const data = await yantramedAppService.getAppInfo();

    await logApiRequest({
      projectId: project.id,
      method: "GET",
      path: "/api/v1/yantramed/app",
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
