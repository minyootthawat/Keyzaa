import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (sellerError) {
      console.error("Supabase seller lookup error:", sellerError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const { db } = await connectDB();
    const ledgerRows = await db
      .collection("seller_ledger_entries")
      .find({ seller_id: seller.id })
      .sort({ created_at: -1 })
      .toArray();

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
        id: seller.id,
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
