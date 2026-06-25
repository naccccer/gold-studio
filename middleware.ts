import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth/session-cookie";
import { isLocalDevelopmentHost, LOCAL_VERTICAL_COOKIE_NAME, normalizeUserVisibleVerticalId } from "@/lib/verticals";

const COOKIE_NAME = sessionCookieName();

function applyLocalVerticalOverride(request: NextRequest, response: NextResponse) {
  const requestedVertical = request.nextUrl.searchParams.get("vertical");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!requestedVertical || !isLocalDevelopmentHost(host)) {
    return response;
  }

  response.cookies.set(LOCAL_VERTICAL_COOKIE_NAME, normalizeUserVisibleVerticalId(requestedVertical), {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");

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
    return applyLocalVerticalOverride(request, NextResponse.redirect(loginUrl));
  }

  if (request.nextUrl.searchParams.has("vertical") && isLocalDevelopmentHost(host) && !pathname.startsWith("/admin")) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("vertical");
    return applyLocalVerticalOverride(request, NextResponse.redirect(cleanUrl));
  }

  return applyLocalVerticalOverride(request, NextResponse.next());
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/gallery/:path*", "/projects/:path*", "/admin/:path*", "/uploads/:path*"],
};
