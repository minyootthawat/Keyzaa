import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import type { OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller id from Supabase (seller table still in Supabase)
    const supabase = createServiceRoleClient();
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    // Fetch orders from MongoDB
    const { db } = await connectDB();
    const orders = db.collection("orders");
    const orderItems = db.collection("order_items");

    const documents = await orders
      .find({ seller_id: sellerId })
      .sort({ created_at: -1 })
      .toArray();

    // Fetch buyer names from Supabase
    const buyerIds = [...new Set(documents.map((d) => d.buyer_id as string))];
    const { data: buyerRows } = await supabase
      .from("users")
      .select("id, name")
      .in("id", buyerIds);

    const buyerMap: Record<string, string> = {};
    for (const u of buyerRows ?? []) {
      buyerMap[u.id] = u.name;
    }

    // Fetch order items for each order
    const orderIds = documents.map((d) => d._id);
    const itemsCursor = await orderItems.find({ order_id: { $in: orderIds.map(String) } }).toArray();
    const itemsByOrderId: Record<string, Record<string, unknown>[]> = {};
    for (const item of itemsCursor) {
      const oid = item.order_id as string;
      if (!itemsByOrderId[oid]) itemsByOrderId[oid] = [];
      itemsByOrderId[oid].push(item);
    }

    const result = documents.map((doc) => {
      const items = (itemsByOrderId[doc._id.toString()] ?? []).map((item) => ({
        id: item._id.toString(),
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
        id: doc._id.toString(),
        orderId: doc.order_id as string,
        buyerId: doc.buyer_id as string,
        buyerName: buyerMap[doc.buyer_id as string] ?? "Unknown",
        date: doc.created_at as string,
        status: doc.status as OrderStatus,
        paymentStatus: doc.payment_status as PaymentStatus,
        fulfillmentStatus: doc.fulfillment_status as FulfillmentStatus,
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
