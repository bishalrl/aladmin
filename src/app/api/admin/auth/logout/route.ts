import { NextRequest } from "next/server";
import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { ok, handleRouteError } from "@/lib/api/response";
import { auditLogService } from "@/services/AuditLogService";
import { clientIp } from "@/lib/api/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    await clearSessionCookie();
    if (session) {
      await auditLogService.log({
        adminId: session.sub,
        action: "admin.logout",
        resourceType: "admin",
        resourceId: session.sub,
        ipAddress: clientIp(request),
      });
    }
    return ok({ loggedOut: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
