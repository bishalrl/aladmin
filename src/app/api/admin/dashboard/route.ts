import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { analyticsService } from "@/services/AnalyticsService";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    const data = await analyticsService.getDashboardStats();
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
