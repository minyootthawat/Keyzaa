import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import type { OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

interface OrderRow {
  id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_price: number;
  gross_amount: number;
  commission_amount: number;
  seller_net_amount: number;
  platform_fee_rate: number;
  currency: string;
  payment_method: string;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get seller by user_id
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    // Fetch orders for this seller
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Orders fetch error:", ordersError);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // Collect unique buyer IDs
    const buyerIds = [...new Set(orders.map((o) => o.buyer_id))];

    // Fetch buyer names
    const { data: buyers, error: buyersError } = await supabase
      .from("users")
      .select("id, name")
      .in("id", buyerIds);

    if (buyersError) {
      console.error("Buyers fetch error:", buyersError);
    }

    const buyerMap = new Map<string, string>();
    if (buyers) {
      for (const buyer of buyers) {
        buyerMap.set(buyer.id, buyer.name);
      }
    }

    // Fetch order items for all orders
    const orderIds = orders.map((o) => o.id);
    const { data: allItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) {
      console.error("Order items fetch error:", itemsError);
    }

    // Group items by order_id
    const itemsByOrder = new Map<string, OrderItem[]>();
    if (allItems) {
      for (const item of allItems) {
        const mapped: OrderItem = {
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          title: item.title ?? "",
          titleTh: item.title_th ?? undefined,
          titleEn: item.title_en ?? undefined,
          image: item.image ?? "",
          price: Number(item.price),
          quantity: Number(item.quantity),
          sellerId: sellerId,
          keys: [],
          platform: item.platform ?? "",
          regionCode: item.region_code ?? undefined,
          activationMethodTh: item.activation_method_th ?? undefined,
          activationMethodEn: item.activation_method_en ?? undefined,
        };
        const existing = itemsByOrder.get(item.order_id) ?? [];
        existing.push(mapped);
        itemsByOrder.set(item.order_id, existing);
      }
    }

    // Build response
    const result = orders.map((order: OrderRow) => {
      const items = itemsByOrder.get(order.id) ?? [];

      return {
        id: order.id,
        orderId: order.id,
        buyerId: order.buyer_id,
        buyerName: buyerMap.get(order.buyer_id) ?? "Buyer",
        date: order.created_at,
        status: order.status as OrderStatus,
        paymentStatus: order.payment_status as PaymentStatus,
        fulfillmentStatus: order.fulfillment_status as FulfillmentStatus,
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
} catch {
      console.error("Seller orders error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
