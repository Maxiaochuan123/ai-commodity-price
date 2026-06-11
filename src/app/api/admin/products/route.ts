import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OVERRIDES_KEY = "product:overrides";

type ProductOverride = {
  active?: boolean;
  offlineNote?: string;
};

type OverridesMap = Record<string, ProductOverride>;

/** GET — Public: return all product status/note overrides from KV */
export async function GET() {
  try {
    const raw = await kv.hgetall(OVERRIDES_KEY);
    if (!raw) {
      return NextResponse.json({ overrides: {} });
    }
    const parsed: OverridesMap = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value) {
        if (typeof value === "string") {
          try {
            parsed[key] = JSON.parse(value) as ProductOverride;
          } catch {
            // skip malformed entries
          }
        } else if (typeof value === "object") {
          parsed[key] = value as ProductOverride;
        }
      }
    }
    return NextResponse.json({ overrides: parsed });
  } catch {
    return NextResponse.json({ overrides: {} });
  }
}

/** PUT — Admin: update a single product override (active / offlineNote) */
export async function PUT(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "无权限" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    productId?: string;
    active?: boolean;
    offlineNote?: string;
  } | null;

  if (!body?.productId) {
    return NextResponse.json({ message: "缺少 productId" }, { status: 400 });
  }

  const existing = await kv.hget(OVERRIDES_KEY, body.productId);
  let current: ProductOverride = {};
  if (existing) {
    if (typeof existing === "string") {
      try {
        current = JSON.parse(existing) as ProductOverride;
      } catch {
        // ignore malformed
      }
    } else if (typeof existing === "object") {
      current = existing as ProductOverride;
    }
  }

  const updated: ProductOverride = { ...current };
  if (body.active !== undefined) updated.active = body.active;
  if (body.offlineNote !== undefined) updated.offlineNote = body.offlineNote;

  await kv.hset(OVERRIDES_KEY, { [body.productId]: JSON.stringify(updated) });

  return NextResponse.json({ message: "更新成功", override: updated });
}

