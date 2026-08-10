import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

const PUBLIC_PATHS = [
  "/login",
  "/delete-account",
  "/api/v1",
  "/api/storage",
  "/api/admin/auth/login",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const needsAuth =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!needsAuth || isPublic(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(SESSION_COOKIE)?.value;
      if (token && (await verifySessionToken(token))) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // Login endpoint stays public
  if (pathname === "/api/admin/auth/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required",
          error_code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set("x-admin-id", session.sub);
  response.headers.set("x-admin-role", session.role);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
