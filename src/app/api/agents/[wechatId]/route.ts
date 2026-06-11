import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** PUT — Admin: update agent info */
export async function PUT(
  request: Request,
  { params }: { params: { wechatId: string } }
) {
  const isAdmin = isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const { wechatId } = params;
  const key = `agent:${wechatId}`;

  const existing = await kv.hgetall(key);
  if (!existing || Object.keys(existing).length === 0) {
    return NextResponse.json({ message: "代理不存在" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    level?: 1 | 2;
    remarks?: string;
    newWechatId?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ message: "无效的请求数据" }, { status: 400 });
  }

  const updates: Record<string, string | number> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.level !== undefined && (body.level === 1 || body.level === 2)) updates.level = body.level;
  if (body.remarks !== undefined) updates.remarks = body.remarks;

  // Handle wechatId change
  if (body.newWechatId && body.newWechatId !== wechatId) {
    const newKey = `agent:${body.newWechatId}`;
    const existingNew = await kv.hgetall(newKey);
    if (existingNew && Object.keys(existingNew).length > 0) {
      return NextResponse.json({ message: "新微信号已被其他代理使用" }, { status: 409 });
    }

    // Copy data to new key
    const fullData = { ...existing, ...updates, wechatId: body.newWechatId };
    await kv.hset(newKey, fullData as Record<string, string>);
    await kv.del(key);
    await kv.srem("agents:all", wechatId);
    await kv.sadd("agents:all", body.newWechatId);

    const agent = await kv.hgetall(newKey);
    return NextResponse.json({ agent, message: "更新成功" });
  }

  if (Object.keys(updates).length > 0) {
    await kv.hset(key, updates);
  }

  const agent = await kv.hgetall(key);
  return NextResponse.json({ agent, message: "更新成功" });
}
