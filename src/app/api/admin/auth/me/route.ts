import { getSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/api/response";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return fail("Authentication required", "UNAUTHORIZED", 401);
  }
  return ok({
    id: session.sub,
    email: session.email,
    name: session.name,
    role: session.role,
  });
}
