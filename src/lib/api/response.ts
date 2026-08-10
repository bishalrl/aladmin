export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  message: string;
  error_code: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, init);
}

export function fail(
  message: string,
  errorCode: string,
  status = 400,
  init?: ResponseInit,
): Response {
  return Response.json(
    { success: false, message, error_code: errorCode } satisfies ApiError,
    { status, ...init },
  );
}

export class AppError extends Error {
  constructor(
    message: string,
    public errorCode: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleRouteError(error: unknown): Response {
  if (error instanceof AppError) {
    return fail(error.message, error.errorCode, error.status);
  }

  console.error(error);

  const isProd = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  return fail(
    isProd ? "Internal server error" : error instanceof Error ? error.message : "Unknown error",
    "INTERNAL_ERROR",
    500,
  );
}
