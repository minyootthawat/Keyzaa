import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { getSellerByUserId } from "@/lib/db/mongodb";
import { getOrdersBySeller } from "@/lib/db/mongodb";
import type { Seller } from "@/types/database";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const seller = await getSellerByUserId(userId) as (Seller & { _id: { toString(): string } }) | null;
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id.toString();

    const documents = await getOrdersBySeller(sellerId);

    const result = documents.map((doc: Record<string, unknown>) => {
      const items = ((doc.items as Record<string, unknown>[]) ?? []).map((item: Record<string, unknown>) => ({
        id: (item._id as { toString(): string })?.toString() ?? "",
        orderId: doc.order_id as string,
        productId: item.product_id as string,
        title: item.title ?? "",
        titleTh: item.title_th ?? undefined,
        titleEn: item.title_en ?? undefined,
        image: item.image ?? "",
        price: Number(item.price),
        quantity: Number(item.quantity),
        sellerId,
        keys: [],
        platform: (item.platform as string) ?? "",
        regionCode: item.region_code as string | undefined,
        activationMethodTh: item.activation_method_th as string | undefined,
        activationMethodEn: item.activation_method_en as string | undefined,
      }));

      return {
        id: doc.order_id as string,
        orderId: doc.order_id as string,
        buyerId: doc.buyer_id as string,
        buyerName: "Buyer",
        date: doc.created_at as string,
        status: doc.status as string,
        paymentStatus: doc.payment_status as string,
        fulfillmentStatus: doc.fulfillment_status as string,
        totalPrice: Number(doc.total_price),
        grossAmount: Number(doc.gross_amount),
        commissionAmount: Number(doc.commission_amount),
        sellerNetAmount: Number(doc.seller_net_amount),
        platformFeeRate: Number(doc.platform_fee_rate),
        currency: (doc.currency as string) ?? "THB",
        paymentMethod: (doc.payment_method as string) ?? "",
        items,
      };
    });

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("Seller orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}