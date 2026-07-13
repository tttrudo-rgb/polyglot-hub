import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE = "ph_auth";

/**
 * Behind Railway's proxy, request.url reflects the container's internal
 * bind address (e.g. localhost:8080), not the public hostname. Reconstruct
 * the real origin from forwarded headers so redirects point somewhere the
 * client can actually reach.
 */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

/** The cookie value a correctly-authenticated visitor should carry. Null if no gate is configured. */
export function getExpectedAuthToken(): string | null {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  return hashPassword(password);
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
