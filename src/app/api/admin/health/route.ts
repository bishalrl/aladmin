import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { handleRouteError, ok } from "@/lib/api/response";
import { firebaseProjectManager } from "@/lib/firebase/FirebaseProjectManager";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    // Default to live probe so the UI shows real connection status
    const live = request.nextUrl.searchParams.get("live") !== "0";
    const health = await firebaseProjectManager.checkAll({ live });
    return ok({ firebase: health, live });
  } catch (error) {
    return handleRouteError(error);
  }
}
