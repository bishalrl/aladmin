import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import {
  budgetingSathiFirebaseService,
  yantraMedFirebaseService,
} from "@/lib/firebase/FirebaseUserService";

function serviceFor(project: string) {
  if (project === "budgeting-sathi") return budgetingSathiFirebaseService;
  if (project === "yantramed") return yantraMedFirebaseService;
  return null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ project: string }> },
) {
  try {
    await requireAdminSession(request);
    const { project } = await context.params;
    const svc = serviceFor(project);
    if (!svc) return fail("Unknown project", "PROJECT_NOT_FOUND", 404);

    const { searchParams } = request.nextUrl;
    const data = await svc.listUsers({
      pageToken: searchParams.get("pageToken") || undefined,
      maxResults: Number(searchParams.get("limit") || 50),
      search: searchParams.get("search") || undefined,
    });
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
