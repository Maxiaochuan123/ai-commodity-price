import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { deletePrices, readPrices, writeLatestChanges, writePrices } from "@/lib/price-store";
import { diffPublicPriceChanges, mergePriceMap } from "@/lib/pricing";
import type { PriceMap, PublicPriceChangeBatch } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { prices?: PriceMap } | null;
  if (!body?.prices) {
    return NextResponse.json({ message: "缺少价格数据" }, { status: 400 });
  }

  const previous = await readPrices();
  const next = mergePriceMap(body.prices);
  const changes = diffPublicPriceChanges(previous, next);

  await writePrices(next);

  let batch: PublicPriceChangeBatch | null = null;
  if (changes.length > 0) {
    batch = {
      changedAt: new Date().toISOString(),
      changes,
      id: `${Date.now()}`
    };
    await writeLatestChanges(batch);
  }

  return NextResponse.json({
    changes: batch,
    prices: next
  });
}

export async function DELETE() {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  await deletePrices();

  return NextResponse.json({
    message: "已重置为代码默认价格"
  });
}
