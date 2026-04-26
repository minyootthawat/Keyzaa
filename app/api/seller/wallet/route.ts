import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

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
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    const { data: ledgerData, error: ledgerError } = await supabase
      .from("seller_ledger_entries")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (ledgerError) {
      console.error("Seller wallet ledger error:", ledgerError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const entries = (ledgerData ?? []) as LedgerRow[];

    const mappedEntries = entries.map((entry) => ({
      id: entry.id,
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
} catch {
      console.error("Seller wallet error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
