import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, getExpectedAuthToken, getRequestOrigin, safeEqual } from "./lib/auth";

export function proxy(request: NextRequest) {
  const expected = getExpectedAuthToken();
  // No APP_PASSWORD configured: gate is disabled (e.g. local dev).
  if (!expected) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && safeEqual(cookie, expected)) return NextResponse.next();

  const loginUrl = new URL("/login", getRequestOrigin(request));
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|manifest.json|icon.svg|sw.js).*)",
  ],
};
