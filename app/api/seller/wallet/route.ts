import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getLedgerBySeller } from "@/lib/db/collections/ledger";

export async function GET() {
  try {
    const user = await getServerUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id!.toString();
    const entries = await getLedgerBySeller(sellerId);

    const mappedEntries = entries.map((entry) => ({
      id: entry._id!.toString(),
      sellerId: entry.seller_id,
      orderId: entry.order_id ?? undefined,
      type:
        entry.type === "sale"
          ? "sale_credit"
          : entry.type === "commission_fee"
          ? "commission_fee"
          : entry.type === "withdrawal"
          ? "withdrawal"
          : "manual_adjustment",
      amount: Number(entry.amount),
      currency: "THB",
      createdAt: entry.created_at,
      description: entry.description ?? "",
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
