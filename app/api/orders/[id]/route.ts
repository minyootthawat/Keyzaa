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

    const document = await orders.findOne({ order_id: id, buyer_id: userId });

    if (!document) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sellerId = document.seller_id as string;
    const sellerDocument = await sellers.findOne({ seller_id: sellerId });
    const staticSeller = getStaticSellerSeedById(sellerId);

    return NextResponse.json({
      order: mapOrderDocument({
        orderId: document.order_id as string,
        buyerId: document.buyer_id as string,
        sellerId,
        date: document.created_at as string,
        status: (document.status as OrderStatus) || "pending",
        paymentStatus: (document.payment_status as PaymentStatus) || "pending",
        fulfillmentStatus: (document.fulfillment_status as FulfillmentStatus) || "pending",
        totalPrice: Number(document.total_price ?? 0),
        grossAmount: Number(document.gross_amount ?? 0),
        commissionAmount: Number(document.commission_amount ?? 0),
        sellerNetAmount: Number(document.seller_net_amount ?? 0),
        platformFeeRate: Number(document.platform_fee_rate ?? 0.12),
        currency: (document.currency as string) || "THB",
        paymentMethod: (document.payment_method as string) || "",
        items: (document.items as OrderItem[]) || [],
      }),
      seller: {
        id: sellerId,
        shopName:
          (sellerDocument?.shop_name as string | undefined) ||
          staticSeller?.shopName ||
          sellerId,
        verificationStatus:
          (sellerDocument?.verification_status as string | undefined) ||
          staticSeller?.verificationStatus ||
          "verified",
        rating:
          (sellerDocument?.rating as number | undefined) ||
          staticSeller?.rating ||
          0,
        salesCount:
          (sellerDocument?.sales_count as number | undefined) ||
          staticSeller?.salesCount ||
          0,
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
