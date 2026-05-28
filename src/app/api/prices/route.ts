import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readPrices } from "@/lib/price-store";
import { buildCatalog } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const isAdmin = isAdminRequest();
  const prices = await readPrices();

  return NextResponse.json({
    groups: buildCatalog(prices, isAdmin),
    isAdmin
  });
}
