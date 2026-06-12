import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ANNOUNCEMENT_KEY = "config:announcements";

type Announcements = {
  guest: string;
  agent: string;
};

export async function GET() {
  try {
    const raw = await kv.get<Announcements>(ANNOUNCEMENT_KEY);
    if (!raw) {
      return NextResponse.json({ announcements: { guest: "", agent: "" } });
    }
    return NextResponse.json({ announcements: raw });
  } catch {
    return NextResponse.json({ announcements: { guest: "", agent: "" } });
  }
}

export async function PUT(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    guest?: string;
    agent?: string;
  } | null;

  const current = (await kv.get<Announcements>(ANNOUNCEMENT_KEY)) || { guest: "", agent: "" };
  
  const updated: Announcements = {
    guest: body?.guest !== undefined ? body.guest : current.guest,
    agent: body?.agent !== undefined ? body.agent : current.agent,
  };

  await kv.set(ANNOUNCEMENT_KEY, updated);

  return NextResponse.json({ message: "保存成功", announcements: updated });
}
