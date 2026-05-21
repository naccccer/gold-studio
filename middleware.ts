import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "gold_session";

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/uploads/")) {
    return new Response("Not found", { status: 404 });
  }

  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/gallery") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/admin");

  if (needsAuth && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/gallery/:path*", "/projects/:path*", "/admin/:path*", "/uploads/:path*"],
};
