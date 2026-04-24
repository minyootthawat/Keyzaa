import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface SellerRow {
  id: string;
  user_id: string;
  store_name: string;
  phone: string | null;
  id_card_url: string | null;
  verified: boolean;
  rating: number;
  sales_count: number;
  balance: number;
  pending_balance: number;
  payout_status: string;
  response_time_minutes: number;
  fulfillment_rate: number;
  dispute_rate: number;
  created_at: string;
  updated_at: string;
}

interface LedgerRow {
  id: string;
  seller_id: string;
  type: string;
  amount: number;
  order_id: string | null;
  description: string | null;
  created_at: string;
}

async function getSellerFromUserId(userId: string): Promise<SellerRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as SellerRow;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerFromUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const supabase = createServiceRoleClient();

    const { data: ledgerData, error: ledgerError } = await supabase
      .from("seller_ledger_entries")
      .select("*")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });

    if (ledgerError) {
      console.error("Seller me ledger error:", ledgerError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const ledgerRows = (ledgerData ?? []) as LedgerRow[];

    let grossSales = 0;
    let totalCommission = 0;
    let netEarnings = 0;

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