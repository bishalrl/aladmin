import { NextRequest } from "next/server";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { yantramedCourseService } from "@/services/YantramedCourseService";
import { enforcePublicApi, logApiRequest } from "@/lib/api/publicGuard";
import { clientIp } from "@/lib/api/rateLimit";
import { projectService } from "@/services/ProjectService";

/** Step 1 for a course day: mantra (auth/progress remain in Firebase on the app). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ day: string }> },
) {
  const started = Date.now();
  try {
    const blocked = await enforcePublicApi(request, {
      path: "/api/v1/yantramed/course/days/[day]/mantra",
    });
    if (blocked) return blocked;

    const { day: dayParam } = await context.params;
    const dayNumber = Number(dayParam);
    if (!Number.isInteger(dayNumber)) {
      return fail("Day must be an integer 1–30", "INVALID_DAY", 400);
    }

    const project = await projectService.getBySlug("yantramed");
    const data = await yantramedCourseService.getCourseDayMantra(dayNumber);

    await logApiRequest({
      projectId: project.id,
      method: "GET",
      path: `/api/v1/yantramed/course/days/${dayNumber}/mantra`,
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
