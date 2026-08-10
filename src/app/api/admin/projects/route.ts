import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { projectService } from "@/services/ProjectService";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    const projects = await projectService.list();
    return ok(projects);
  } catch (error) {
    return handleRouteError(error);
  }
}
