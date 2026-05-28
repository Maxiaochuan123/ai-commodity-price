import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSession, getAdminCredentials } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: string; username?: string } | null;
  const credentials = getAdminCredentials();

  if (body?.username !== credentials.username || body?.password !== credentials.password) {
    return NextResponse.json({ message: "账号或密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({ isAdmin: true });
  response.cookies.set(ADMIN_COOKIE, createSession(credentials.username), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
