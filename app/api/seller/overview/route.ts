import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { calculateWalletSummary } from "@/lib/marketplace-server";
import type { OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus, SellerLedgerEntry } from "@/app/types";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const users = db.collection("users");
    const orders = db.collection("orders");
    const products = db.collection("products");
    const ledgerEntries = db.collection("seller_ledger_entries");
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const sellerId = typeof user?.sellerId === "string" ? user.sellerId : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const [orderDocuments, productDocuments, entryDocuments] = await Promise.all([
      orders.find({ sellerId }).sort({ date: -1 }).toArray(),
      products.find({ sellerId }).sort({ createdAt: -1 }).limit(5).toArray(),
      ledgerEntries.find({ sellerId }).sort({ createdAt: -1 }).toArray(),
    ]);

    const wallet = calculateWalletSummary(
      entryDocuments.map((entry) => ({
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
      kpis: {
        grossSales: wallet.grossSales,
        platformFees: wallet.totalCommission,
        netEarnings: wallet.netEarnings,
        availableForPayout: wallet.availableBalance,
        orderCount: orderDocuments.length,
      },
      orders: orderDocuments.map((document) => ({
        id: document.orderId as string,
        buyerId: document.buyerId as string,
        sellerId: document.sellerId as string,
        date: document.date as string,
        status: document.status as OrderStatus,
        paymentStatus: document.paymentStatus as PaymentStatus,
        fulfillmentStatus: document.fulfillmentStatus as FulfillmentStatus,
        totalPrice: document.totalPrice as number,
        grossAmount: document.grossAmount as number,
        commissionAmount: document.commissionAmount as number,
        sellerNetAmount: document.sellerNetAmount as number,
        platformFeeRate: document.platformFeeRate as number,
        currency: document.currency as string,
        paymentMethod: document.paymentMethod as string,
        items: document.items as OrderItem[],
      })),
      products: productDocuments.map((document) => ({
        id: document.productId as string,
        title: document.title as string,
        stock: document.stock as number,
        soldCount: document.soldCount as number,
        price: document.price as number,
      })),
    });
  } catch (error) {
    console.error("Seller overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
