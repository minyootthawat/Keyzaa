import { NextRequest, NextResponse } from "next/server";
import { getSellerAccessFromSession } from "@/lib/auth/seller";
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

export async function GET() {
  try {
    const authResult = await getSellerAccessFromSession();
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const supabase = createServiceRoleClient();

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", sellerId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerRow = seller as SellerRow;

    const { data: ledgerData, error: ledgerError } = await supabase
      .from("seller_ledger_entries")
      .select("*")
      .eq("seller_id", sellerId)
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
        id: sellerRow.id,
        userId: sellerRow.user_id,
        shopName: sellerRow.store_name,
        phone: sellerRow.phone ?? "",
        rating: Number(sellerRow.rating ?? 0),
        salesCount: sellerRow.sales_count ?? 0,
        balance: Number(sellerRow.balance ?? 0),
        pendingBalance: Number(sellerRow.pending_balance ?? 0),
        verificationStatus: sellerRow.verified ? "verified" : "new",
        payoutStatus: sellerRow.payout_status ?? "manual",
        responseTimeMinutes: sellerRow.response_time_minutes ?? 5,
        fulfillmentRate: Number(sellerRow.fulfillment_rate ?? 100),
        disputeRate: Number(sellerRow.dispute_rate ?? 0),
        createdAt: sellerRow.created_at,
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

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await getSellerAccessFromSession();
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const supabase = createServiceRoleClient();

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", sellerId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.shopName !== undefined) updates.store_name = body.shopName.trim();
    if (body.phone !== undefined) updates.phone = body.phone.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("sellers")
      .update(updates)
      .eq("id", sellerId)
      .select()
      .single();

    if (error) {
      console.error("Seller PATCH error:", error);
      return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }

    return NextResponse.json({ seller: { id: data.id, shopName: data.store_name, phone: data.phone } });
} catch {
      console.error("Seller PATCH error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}