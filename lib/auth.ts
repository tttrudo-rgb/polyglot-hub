import { createHash, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "ph_auth";

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
