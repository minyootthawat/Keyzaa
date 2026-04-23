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

    const ledgerRows = await getLedgerEntriesBySeller(sellerId);

    let grossSales = 0;
    let totalCommission = 0;
    let netEarnings = 0;
    const pendingBalance = Number(seller.pending_balance ?? 0);

    for (const entry of ledgerRows) {
      const amount = Number(entry.amount);
      if (entry.type === "sale") {
        grossSales += amount;
        netEarnings += amount;
      } else if (entry.type === "commission_fee") {
        totalCommission += amount;
        netEarnings -= amount;
      } else if (entry.type === "withdrawal") {
        netEarnings -= amount;
      }
    }

    return NextResponse.json({
      seller: {
        id: sellerId,
        userId: seller.user_id,
        shopName: seller.store_name,
        phone: seller.phone ?? "",
        rating: Number(seller.rating ?? 0),
        salesCount: seller.sales_count ?? 0,
        balance: Number(seller.balance ?? 0),
        pendingBalance: Number(seller.pending_balance ?? 0),
        verificationStatus: seller.verified ? "verified" : "new",
        payoutStatus: seller.payout_status ?? "manual",
        responseTimeMinutes: seller.response_time_minutes ?? 5,
        fulfillmentRate: Number(seller.fulfillment_rate ?? 100),
        disputeRate: Number(seller.dispute_rate ?? 0),
        createdAt: seller.created_at,
        totalGrossSales: grossSales,
        totalNetEarnings: netEarnings,
        totalCommissionPaid: totalCommission,
      },
    });
  } catch (error) {
    console.error("Seller me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
