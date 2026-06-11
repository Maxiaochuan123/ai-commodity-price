import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NEW_AGENT_COUNT_KEY = "admin:new_agent_count";

/** GET — Admin: get new agent notification count */
export async function GET() {
  const isAdmin = isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ count: 0 });
  }

  const count = (await kv.get<number>(NEW_AGENT_COUNT_KEY)) ?? 0;
  return NextResponse.json({ count });
}

/** PUT — Admin: clear notifications */
export async function PUT() {
  const isAdmin = isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  await kv.set(NEW_AGENT_COUNT_KEY, 0);
  return NextResponse.json({ count: 0 });
}
