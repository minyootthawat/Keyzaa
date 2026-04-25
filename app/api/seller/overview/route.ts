import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface OrderRow {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  gross_amount: number;
  commission_amount: number;
  seller_net_amount: number;
  platform_fee_rate: number;
  currency: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductRow {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LedgerRow {
  id: string;
  seller_id: string;
  type: string;
  amount: number;
  order_id: string | null;
  description: string | null;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get seller by user_id
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, user_id, verified")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    // Fetch orders, products, and ledger entries in parallel
    const [ordersResult, productsResult, ledgerResult] = await Promise.all([
      supabase
        .from("orders")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false }),
      supabase
        .from("seller_ledger_entries")
        .select("*")
        .eq("seller_id", sellerId),
    ]);

    if (ordersResult.error) {
      console.error("Seller overview orders error:", ordersResult.error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    if (productsResult.error) {
      console.error("Seller overview products error:", productsResult.error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    if (ledgerResult.error) {
      console.error("Seller overview ledger error:", ledgerResult.error);
      return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
    }

    const ordersData = (ordersResult.data ?? []) as OrderRow[];
    const productsData = (productsResult.data ?? []) as ProductRow[];
    const ledgerData = (ledgerResult.data ?? []) as LedgerRow[];

    // Fetch order items for all seller's orders (grouped by product for soldCount)
    const orderIds = ordersData.map((o) => o.id);
    const orderItemsResult = orderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("id, order_id, product_id, quantity, unit_price, created_at")
          .in("order_id", orderIds)
      : { data: [], error: null };

    if (orderItemsResult.error) {
      console.error("Seller overview order items error:", orderItemsResult.error);
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
    }

    const orderItemsData = (orderItemsResult.data ?? []) as OrderItemRow[];

    // Build a map of product_id -> total sold quantity from order_items
    const soldCountMap: Record<string, number> = {};
    for (const item of orderItemsData) {
      soldCountMap[item.product_id] = (soldCountMap[item.product_id] ?? 0) + item.quantity;
    }

    // Compute KPIs from ledger entries
    let grossSales = 0;
    let netEarnings = 0;
    let platformFees = 0;

    for (const entry of ledgerData) {
      const amount = Number(entry.amount ?? 0);
      if (entry.type === "sale") {
        grossSales += amount;
        netEarnings += amount;
      } else if (entry.type === "commission_fee") {
        platformFees += amount;
        netEarnings -= amount;
      } else if (entry.type === "withdrawal") {
        netEarnings -= amount;
      }
    }

    const availableForPayout = Math.max(0, netEarnings);
    const orderCount = ordersData.filter(
      (o) => o.payment_status === "paid" || o.status === "delivered" || o.status === "paid"
    ).length;

    const kpis = {
      grossSales,
      netEarnings,
      availableForPayout,
      platformFees,
      orderCount,
    };

    // Group order items by order_id for efficient lookup
    const itemsByOrder: Record<string, OrderItemRow[]> = {};
    for (const item of orderItemsData) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }

    const orders = ordersData.map((order) => ({
      id: order.id,
      orderId: order.id,
      buyerId: order.buyer_id,
      productId: order.product_id,
      date: order.created_at,
      status: order.status,
      paymentStatus: order.payment_status || "pending",
      fulfillmentStatus: order.fulfillment_status || "pending",
      totalPrice: Number(order.total_price),
      grossAmount: Number(order.gross_amount ?? 0),
      commissionAmount: Number(order.commission_amount ?? 0),
      sellerNetAmount: Number(order.seller_net_amount ?? 0),
      currency: order.currency || "THB",
      paymentMethod: order.payment_method || null,
      items: (itemsByOrder[order.id] ?? []).map((item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        title: "",
        image: "",
        price: Number(item.unit_price),
        quantity: item.quantity,
        sellerId: sellerId,
        keys: [],
        platform: "",
      })),
    }));

    const products = productsData.map((p) => ({
      id: p.id,
      title: p.name,
      stock: p.stock,
      soldCount: soldCountMap[p.id] ?? 0,
      price: Number(p.price),
    }));

    return NextResponse.json({ kpis, orders, products });
  } catch (error) {
    console.error("Seller overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
