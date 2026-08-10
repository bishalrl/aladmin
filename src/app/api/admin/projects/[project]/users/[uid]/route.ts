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
  context: { params: Promise<{ project: string; uid: string }> },
) {
  try {
    await requireAdminSession(request);
    const { project, uid } = await context.params;
    const svc = serviceFor(project);
    if (!svc) return fail("Unknown project", "PROJECT_NOT_FOUND", 404);
    const user = await svc.getUser(uid);
    return ok(user);
  } catch (error) {
    return handleRouteError(error);
  }
}
