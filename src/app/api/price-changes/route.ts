import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { readLatestChanges } from "@/lib/price-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (isAdminRequest()) {
    return NextResponse.json({ changes: null });
  }

  const changes = await readLatestChanges();
  return NextResponse.json({ changes });
}
