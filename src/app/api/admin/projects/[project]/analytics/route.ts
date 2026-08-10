import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { analyticsService } from "@/services/AnalyticsService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ project: string }> },
) {
  try {
    await requireAdminSession(request);
    const { project } = await context.params;
    if (project !== "budgeting-sathi" && project !== "yantramed") {
      return fail("Unknown project", "PROJECT_NOT_FOUND", 404);
    }
    const data = await analyticsService.getOverview(project);
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
