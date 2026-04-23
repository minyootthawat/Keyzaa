import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getBearerPayload } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get seller
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    // Run all queries in parallel
    const [ordersResult, productsResult, ledgerResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total_price, status, created_at")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("products")
        .select("id, name, stock, price")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("seller_ledger_entries")
        .select("type, amount")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false }),
    ]);

    if (ordersResult.error) {
      console.error("Supabase orders error:", ordersResult.error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (productsResult.error) {
      console.error("Supabase products error:", productsResult.error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (ledgerResult.error) {
      console.error("Supabase ledger error:", ledgerResult.error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Calculate wallet summary
    let grossSales = 0;
    let totalCommission = 0;
    let netEarnings = 0;

    for (const entry of ledgerResult.data ?? []) {
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

    // Count orders by status
    const orderDocuments = ordersResult.data ?? [];
    const orderCount = orderDocuments.length;

    // Recent orders with items
    const orderIds = orderDocuments.map((o: Record<string, unknown>) => o.id as string);
    const { data: allOrderItems } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    const itemsByOrder: Record<string, Record<string, unknown>[]> = {};
    for (const item of allOrderItems ?? []) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }

    const orders = orderDocuments.map((order: Record<string, unknown>) => ({
      id: order.id,
      orderId: order.id,
      buyerId: "",
      date: order.created_at,
      status: order.status,
      paymentStatus: "pending",
      fulfillmentStatus: "pending",
      totalPrice: Number(order.total_price),
      grossAmount: 0,
      commissionAmount: 0,
      sellerNetAmount: 0,
      platformFeeRate: 0.05,
      currency: "THB",
      paymentMethod: "",
      items: (itemsByOrder[order.id as string] ?? []).map((item: Record<string, unknown>) => ({
        id: item.id,
        orderId: order.id,
        productId: item.product_id,
        title: item.title ?? "",
        price: Number(item.price),
        quantity: Number(item.quantity),
        sellerId: sellerId,
        keys: [],
        platform: item.platform ?? "",
      })),
    }));

    return NextResponse.json({
      kpis: {
        grossSales,
        platformFees: totalCommission,
        netEarnings,
        availableForPayout: Math.max(0, netEarnings),
        orderCount,
      },
      orders,
      products: (productsResult.data ?? []).map((p: Record<string, unknown>) => ({
        id: p.id,
        title: p.name,
        stock: p.stock,
        soldCount: 0,
        price: Number(p.price),
      })),
    });
  } catch (error) {
    console.error("Seller overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
