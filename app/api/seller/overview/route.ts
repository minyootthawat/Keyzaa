import { NextRequest, NextResponse } from "next/server";
import { getSellerAccessFromRequest } from "@/lib/auth/seller";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface OrderRow {
  id: string;
  buyer_id: string;
  seller_id: string;
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

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  platform: string | null;
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

export async function GET(req: NextRequest) {
  try {
    const authResult = await getSellerAccessFromRequest(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const supabase = createServiceRoleClient();

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
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false }),
    ]);

    if (ordersResult.error) {
      console.error("Seller overview orders error:", ordersResult.error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    if (productsResult.error) {
      console.error("Seller overview products error:", productsResult.error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    if (ledgerResult.error) {
      console.error("Seller overview ledger error:", ledgerResult.error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const ordersData = (ordersResult.data ?? []) as OrderRow[];
    const productsData = (productsResult.data ?? []) as ProductRow[];
    const ledgerData = (ledgerResult.data ?? []) as LedgerRow[];

    // Compute KPIs from ledger entries
    let grossSales = 0;
    let totalCommission = 0;
    let netEarnings = 0;

    for (const entry of ledgerData) {
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

    // Fetch order items for all orders
    const orderIds = ordersData.map((o) => o.id);

    const itemsByOrder: Record<string, OrderItemRow[]> = {};
    if (orderIds.length > 0) {
      const itemsResult = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (!itemsResult.error && itemsResult.data) {
        for (const item of itemsResult.data as OrderItemRow[]) {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
          itemsByOrder[item.order_id].push(item);
        }
      }
    }

    const orders = ordersData.map((order) => ({
      id: order.id,
      orderId: order.id,
      buyerId: order.buyer_id,
      date: order.created_at,
      status: order.status,
      paymentStatus: order.payment_status || "pending",
      fulfillmentStatus: order.fulfillment_status || "pending",
      totalPrice: Number(order.total_price),
      grossAmount: Number(order.gross_amount ?? 0),
      commissionAmount: Number(order.commission_amount ?? 0),
      sellerNetAmount: Number(order.seller_net_amount ?? 0),
      platformFeeRate: Number(order.platform_fee_rate ?? 0.05),
      currency: order.currency || "THB",
      paymentMethod: order.payment_method || "",
      items: (itemsByOrder[order.id] ?? []).map((item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        title: item.title ?? "",
        price: Number(item.price),
        quantity: Number(item.quantity),
        sellerId,
        keys: [],
        platform: item.platform ?? "",
      })),
    }));

    const products = productsData.map((p) => ({
      id: p.id,
      title: p.name,
      stock: p.stock,
      soldCount: 0,
      price: Number(p.price),
    }));

    return NextResponse.json({
      kpis: {
        grossSales,
        platformFees: totalCommission,
        netEarnings,
        availableForPayout: Math.max(0, netEarnings),
        orderCount: ordersData.length,
      },
      orders,
      products,
    });
  } catch (error) {
    console.error("Seller overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}