import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

function getSafeRedirectTarget(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/login";
  }

  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectTarget = getSafeRedirectTarget(searchParams.get("redirect"));
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));

  response.cookies.delete(SESSION_COOKIE);

  return response;
}
