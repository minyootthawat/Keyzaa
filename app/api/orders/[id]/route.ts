import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { getStaticSellerSeedById, mapOrderDocument } from "@/lib/marketplace-server";
import type { OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { db } = await connectDB();
    const orders = db.collection("orders");
    const sellers = db.collection("sellers");

    const document = await orders.findOne({ orderId: id, buyerId: userId });

    if (!document) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sellerId = document.sellerId as string;
    const sellerDocument = await sellers.findOne({ sellerId });
    const staticSeller = getStaticSellerSeedById(sellerId);

    return NextResponse.json({
      order: mapOrderDocument({
        orderId: document.orderId as string,
        buyerId: document.buyerId as string,
        sellerId,
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
      }),
      seller: {
        id: sellerId,
        shopName:
          (sellerDocument?.shopName as string | undefined) ||
          staticSeller?.shopName ||
          sellerId,
        verificationStatus:
          (sellerDocument?.verificationStatus as string | undefined) ||
          staticSeller?.verificationStatus ||
          "verified",
        rating:
          (sellerDocument?.rating as number | undefined) ||
          staticSeller?.rating ||
          0,
        salesCount:
          (sellerDocument?.salesCount as number | undefined) ||
          staticSeller?.salesCount ||
          0,
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
