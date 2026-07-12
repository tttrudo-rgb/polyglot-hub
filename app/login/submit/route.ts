import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, hashPassword, safeEqual } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const from = String(formData.get("from") ?? "/");
  const expectedPassword = process.env.APP_PASSWORD;

  if (!expectedPassword || !safeEqual(password, expectedPassword)) {
    const url = new URL(`/login?error=1&from=${encodeURIComponent(from)}`, request.url);
    return NextResponse.redirect(url, { status: 303 });
  }

  const destination = from.startsWith("/") ? from : "/";
  const response = NextResponse.redirect(new URL(destination, request.url), { status: 303 });
  response.cookies.set(AUTH_COOKIE, hashPassword(expectedPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
