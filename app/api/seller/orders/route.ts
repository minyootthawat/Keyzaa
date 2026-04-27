import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getOrdersBySeller } from "@/lib/db/collections/orders";
import { findUserById } from "@/lib/db/collections/users";
import type { OrderItem } from "@/lib/db/collections/orders";

export async function GET() {
  try {
    const user = await getServerUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller by user_id
    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id!.toString();

    // Fetch orders for this seller
    const orders = await getOrdersBySeller(sellerId);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // Collect unique buyer IDs
    const buyerIds = [...new Set(orders.map((o) => o.buyer_id))];

    // Fetch buyer names
    const buyerMap = new Map<string, string>();
    await Promise.all(
      buyerIds.map(async (buyerId) => {
        const buyer = await findUserById(buyerId);
        if (buyer) {
          buyerMap.set(buyerId, buyer.name);
        }
      })
    );

    // Build response - items are embedded in orders for MongoDB
    const result = orders.map((order) => {
      const items: OrderItem[] = order.items.map((item) => ({
        product_id: item.product_id,
        title: item.title ?? "",
        title_th: item.title_th,
        title_en: item.title_en,
        image: item.image,
        price: Number(item.price),
        quantity: Number(item.quantity),
        platform: item.platform,
        region_code: item.region_code,
        activation_method_th: item.activation_method_th,
        activation_method_en: item.activation_method_en,
      }));

      return {
        id: order._id!.toString(),
        orderId: order._id!.toString(),
        buyerId: order.buyer_id,
        buyerName: buyerMap.get(order.buyer_id) ?? "Buyer",
        date: order.created_at,
        status: order.status,
        paymentStatus: order.payment_status,
        fulfillmentStatus: order.fulfillment_status,
        totalPrice: Number(order.total_price),
        grossAmount: Number(order.gross_amount),
        commissionAmount: Number(order.commission_amount),
        sellerNetAmount: Number(order.seller_net_amount),
        platformFeeRate: Number(order.platform_fee_rate),
        currency: order.currency ?? "THB",
        paymentMethod: order.payment_method ?? "",
        items,
      };
    });

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("Seller orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
