import { NextRequest } from "next/server";
import { fail, handleRouteError, ok } from "@/lib/api/response";
import { deletionRequestSchema } from "@/lib/api/validators";
import { accountDeletionService } from "@/services/AccountDeletionService";
import { clientIp, rateLimit } from "@/lib/api/rateLimit";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ project: string }> },
) {
  try {
    const { project } = await context.params;
    if (project !== "budgeting-sathi" && project !== "yantramed") {
      return fail("Unknown project", "PROJECT_NOT_FOUND", 404);
    }

    const ip = clientIp(request);
    const limited = rateLimit(`deletion:${ip}:${project}`, 5, 60_000);
    if (!limited.ok) {
      return fail("Too many requests", "RATE_LIMITED", 429);
    }

    const body = await request.json();
    const parsed = deletionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid deletion request", "VALIDATION_ERROR", 400);
    }

    const result = await accountDeletionService.submitRequest(
      project,
      parsed.data,
      ip,
    );
    return ok(result, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
