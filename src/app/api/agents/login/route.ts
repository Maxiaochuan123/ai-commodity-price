import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST — Public: agent login by wechatId */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    wechatId?: string;
  } | null;

  if (!body?.wechatId) {
    return NextResponse.json({ message: "请输入微信号" }, { status: 400 });
  }

  const wechatId = body.wechatId.trim();
  if (!wechatId) {
    return NextResponse.json({ message: "微信号不能为空" }, { status: 400 });
  }

  const agent = await kv.hgetall(`agent:${wechatId}`);
  if (!agent || Object.keys(agent).length === 0) {
    return NextResponse.json({ message: "该微信号未注册为代理" }, { status: 404 });
  }

  return NextResponse.json({ agent });
}
