import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { getSellerByUserId, getLedgerEntriesBySeller } from "@/lib/db/mongodb";
import type { Seller } from "@/types/database";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId) as (Seller & { _id: { toString(): string } }) | null;
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id.toString();

    const entries = await getLedgerEntriesBySeller(sellerId);

    const mappedEntries = (entries ?? []).map((entry: Record<string, unknown>) => ({
      id: (entry._id as { toString(): string }).toString(),
      sellerId: entry.seller_id as string,
      orderId: entry.order_id as string | undefined,
      type: entry.type === "sale"
        ? "sale_credit"
        : entry.type === "commission_fee"
        ? "commission_fee"
        : entry.type === "withdrawal"
        ? "withdrawal"
        : "manual_adjustment",
      amount: Number(entry.amount),
      currency: "THB",
      createdAt: entry.created_at as string,
      description: (entry.description as string) ?? "",
      metadata: {},
    }));

    let grossSales = 0;
    let totalCommission = 0;
    let netEarnings = 0;

    for (const entry of mappedEntries) {
      if (entry.type === "sale_credit") {
        grossSales += entry.amount;
        netEarnings += entry.amount;
      } else if (entry.type === "commission_fee") {
        totalCommission += entry.amount;
        netEarnings -= entry.amount;
      } else if (entry.type === "withdrawal") {
        netEarnings -= entry.amount;
      }
    }

    return NextResponse.json({
      summary: {
        availableBalance: Math.max(0, netEarnings),
        pendingBalance: 0,
        grossSales,
        totalCommission,
        netEarnings,
        entryCount: mappedEntries.length,
      },
      entries: mappedEntries,
    });
  } catch (error) {
    console.error("Seller wallet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}