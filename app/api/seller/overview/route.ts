import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import type { OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { db } = await connectDB();

    const [ordersResult, productsResult, ledgerResult] = await Promise.all([
      db
        .collection("orders")
        .find({ seller_id: sellerId })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray(),
      db
        .collection("products")
        .find({ seller_id: sellerId })
        .sort({ created_at: -1 })
        .limit(5)
        .toArray(),
      db
        .collection("seller_ledger_entries")
        .find({ seller_id: sellerId })
        .sort({ created_at: -1 })
        .toArray(),
    ]);

    let grossSales = 0;
    let totalCommission = 0;
    let netEarnings = 0;

    for (const entry of ledgerResult ?? []) {
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

    const orderDocuments = ordersResult ?? [];
    const orderCount = orderDocuments.length;

    const orderIds = orderDocuments.map((o) => o._id.toString());
    const itemsCursor = await db
      .collection("order_items")
      .find({ order_id: { $in: orderIds } })
      .toArray();

    const itemsByOrder: Record<string, Record<string, unknown>[]> = {};
    for (const item of itemsCursor) {
      const oid = item.order_id as string;
      if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
      itemsByOrder[oid].push(item);
    }

    const orders = orderDocuments.map((order) => ({
      id: order._id.toString(),
      orderId: order._id.toString(),
      buyerId: order.buyer_id as string,
      date: order.created_at as string,
      status: order.status as OrderStatus,
      paymentStatus: (order.payment_status as PaymentStatus) || "pending",
      fulfillmentStatus: (order.fulfillment_status as FulfillmentStatus) || "pending",
      totalPrice: Number(order.total_price),
      grossAmount: 0,
      commissionAmount: 0,
      sellerNetAmount: 0,
      platformFeeRate: 0.05,
      currency: "THB",
      paymentMethod: (order.payment_method as string) || "",
      items: (itemsByOrder[order._id.toString()] ?? []).map((item) => ({
        id: item._id?.toString() ?? "",
        orderId: order._id.toString(),
        productId: item.product_id as string,
        title: item.title ?? "",
        price: Number(item.price),
        quantity: Number(item.quantity),
        sellerId,
        keys: [],
        platform: (item.platform as string) ?? "",
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
      products: (productsResult ?? []).map((p) => ({
        id: p._id.toString(),
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
