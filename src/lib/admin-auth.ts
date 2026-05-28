import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "ai_price_admin";

const DEFAULT_ADMIN = "mxcsgnh";

export function getAdminCredentials() {
  return {
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_ADMIN,
    username: process.env.ADMIN_USERNAME ?? DEFAULT_ADMIN
  };
}

export function createSession(username: string) {
  const payload = `${username}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(session?: string) {
  if (!session) return false;

  const parts = session.split(".");
  if (parts.length !== 3) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = sign(payload);
  return safeEqual(parts[2], expected);
}

export function isAdminRequest() {
  return isValidSession(cookies().get(ADMIN_COOKIE)?.value);
}

function sign(payload: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "local-mxcsgnh-session")
    .update(payload)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
