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
      path: "/api/v1/yantramed/music",
    });
    if (blocked) return blocked;

    const page = Number(request.nextUrl.searchParams.get("page") || 1);
    const limit = Number(request.nextUrl.searchParams.get("limit") || 50);
    const dayParam = request.nextUrl.searchParams.get("day");
    const day = dayParam ? Number(dayParam) : undefined;
    const project = await projectService.getBySlug("yantramed");
    const data = await yantramedCourseService.listMusic({
      day: day && Number.isInteger(day) ? day : undefined,
      page,
      limit,
    });

    await logApiRequest({
      projectId: project.id,
      method: "GET",
      path: "/api/v1/yantramed/music",
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
