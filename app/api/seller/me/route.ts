import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { calculateWalletSummary } from "@/lib/marketplace-server";
import type { SellerLedgerEntry } from "@/app/types";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const sellers = db.collection("sellers");
    const ledgerEntries = db.collection("seller_ledger_entries");

    const seller = await sellers.findOne({ userId });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const entries = await ledgerEntries.find({ sellerId: seller._id.toString() }).sort({ createdAt: -1 }).toArray();
    const walletSummary = calculateWalletSummary(
      entries.map((entry) => ({
        id: entry._id.toString(),
        sellerId: entry.sellerId as string,
        orderId: entry.orderId as string | undefined,
        type: entry.type as SellerLedgerEntry["type"],
        amount: entry.amount as number,
        currency: entry.currency as string,
        createdAt: entry.createdAt as string,
        description: entry.description as string,
        metadata: entry.metadata as SellerLedgerEntry["metadata"],
      }))
    );

    return NextResponse.json({
      seller: {
        id: seller._id.toString(),
        userId: seller.userId,
        shopName: seller.shopName,
        phone: seller.phone,
        rating: seller.rating,
        salesCount: seller.salesCount,
        balance: walletSummary.availableBalance,
        pendingBalance: walletSummary.pendingBalance,
        createdAt: seller.createdAt,
        verificationStatus: seller.verificationStatus,
        payoutStatus: seller.payoutStatus,
        totalGrossSales: walletSummary.grossSales,
        totalNetEarnings: walletSummary.netEarnings,
        totalCommissionPaid: walletSummary.totalCommission,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
