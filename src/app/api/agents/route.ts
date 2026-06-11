import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type Agent = {
  wechatId: string;
  name: string;
  level: 1 | 2;
  remarks: string;
  createdAt: number;
};

const ACTIVATION_CODE = "mxcsgnhdl";
const AGENTS_SET_KEY = "agents:all";
const NEW_AGENT_COUNT_KEY = "admin:new_agent_count";

function agentKey(wechatId: string) {
  return `agent:${wechatId}`;
}

/** GET  — Admin: list all agents */
export async function GET() {
  const isAdmin = isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const wechatIds = await kv.smembers(AGENTS_SET_KEY);
  if (!wechatIds || wechatIds.length === 0) {
    return NextResponse.json({ agents: [] });
  }

  const pipeline = kv.pipeline();
  for (const id of wechatIds) {
    pipeline.hgetall(agentKey(id as string));
  }
  const results = await pipeline.exec();

  const agents: Agent[] = (results ?? [])
    .filter((r): r is Agent => r !== null && typeof r === "object" && "wechatId" in (r as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({ agents });
}

/** POST — Public: register as a 2-level agent */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    wechatId?: string;
    name?: string;
    activationCode?: string;
  } | null;

  if (!body?.wechatId || !body.name || !body.activationCode) {
    return NextResponse.json({ message: "请填写完整信息" }, { status: 400 });
  }

  const wechatId = body.wechatId.trim();
  const name = body.name.trim();

  if (!wechatId || !name) {
    return NextResponse.json({ message: "微信号和姓名不能为空" }, { status: 400 });
  }

  if (body.activationCode !== ACTIVATION_CODE) {
    return NextResponse.json({ message: "激活码错误" }, { status: 400 });
  }

  // Check if already registered
  const existing = await kv.hgetall(agentKey(wechatId));
  if (existing && Object.keys(existing).length > 0) {
    return NextResponse.json({ message: "该微信号已注册" }, { status: 409 });
  }

  const agent: Agent = {
    wechatId,
    name,
    level: 2,
    remarks: "",
    createdAt: Date.now()
  };

  await kv.hset(agentKey(wechatId), agent as unknown as Record<string, string>);
  await kv.sadd(AGENTS_SET_KEY, wechatId);
  await kv.incr(NEW_AGENT_COUNT_KEY);

  return NextResponse.json({ agent, message: "注册成功！您已成为 2 级代理。" });
}
