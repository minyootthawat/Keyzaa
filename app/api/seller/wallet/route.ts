import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get seller id from Supabase (seller table still in Supabase)
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    // Fetch ledger entries from MongoDB
    const { db } = await connectDB();
    const entries = await db
      .collection("seller_ledger_entries")
      .find({ seller_id: sellerId })
      .sort({ created_at: -1 })
      .toArray();

    // Map to API type
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

    // Calculate summary
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
