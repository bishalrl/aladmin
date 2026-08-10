import { NextRequest } from "next/server";
import { handleRouteError, ok } from "@/lib/api/response";
import { yantramedCourseService } from "@/services/YantramedCourseService";
import { enforcePublicApi, logApiRequest } from "@/lib/api/publicGuard";
import { clientIp } from "@/lib/api/rateLimit";
import { projectService } from "@/services/ProjectService";

export async function GET(request: NextRequest) {
  const started = Date.now();
  try {
    const blocked = await enforcePublicApi(request, {
      path: "/api/v1/yantramed/course",
    });
    if (blocked) return blocked;

    const project = await projectService.getBySlug("yantramed");
    const data = await yantramedCourseService.getCourseOutline();

    await logApiRequest({
      projectId: project.id,
      method: "GET",
      path: "/api/v1/yantramed/course",
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
