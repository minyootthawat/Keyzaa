import { NextRequest, NextResponse } from "next/server";
import { getServerSellerAccess } from "@/lib/auth/server";
import { getSellerById } from "@/lib/db/collections/sellers";
import { getLedgerBySeller } from "@/lib/db/collections/ledger";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const seller = await getSellerById(sellerId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const ledgerRows = await getLedgerBySeller(sellerId);

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
        id: seller._id!.toString(),
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

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const seller = await getSellerById(sellerId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.shopName !== undefined) updates.store_name = body.shopName.trim();
    if (body.phone !== undefined) updates.phone = body.phone.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { updateSeller } = await import("@/lib/db/collections/sellers");
    const updated = await updateSeller(sellerId, updates);

    if (!updated) {
      return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }

    return NextResponse.json({ 
      seller: { 
        id: updated._id!.toString(), 
        shopName: updated.store_name, 
        phone: updated.phone 
      } 
    });
  } catch (error) {
    console.error("Seller PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
