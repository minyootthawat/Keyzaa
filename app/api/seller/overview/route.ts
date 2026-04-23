import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { getSellerByUserId, getOrdersBySeller, getProductsBySeller, getLedgerEntriesBySeller } from "@/lib/db/mongodb";
import { connectDB } from "@/lib/db/mongodb";
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

    const [ordersResult, productsResult, ledgerResult] = await Promise.all([
      getOrdersBySeller(sellerId),
      getProductsBySeller(sellerId),
      getLedgerEntriesBySeller(sellerId),
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

    const orderIds = orderDocuments.map((o: Record<string, unknown>) => (o as { _id: { toString(): string } })._id.toString());

    const { db } = await connectDB();
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

    const orders = orderDocuments.map((order: Record<string, unknown>) => {
      const o = order as { _id: { toString(): string }; [key: string]: unknown };
      return ({
        id: o._id.toString(),
        orderId: o._id.toString(),
        buyerId: order.buyer_id as string,
        date: order.created_at as string,
        status: order.status as string,
        paymentStatus: (order.payment_status as string) || "pending",
        fulfillmentStatus: (order.fulfillment_status as string) || "pending",
        totalPrice: Number(order.total_price),
        grossAmount: 0,
        commissionAmount: 0,
        sellerNetAmount: 0,
        platformFeeRate: 0.05,
        currency: "THB",
        paymentMethod: (order.payment_method as string) || "",
        items: (itemsByOrder[o._id.toString()] ?? []).map((item: Record<string, unknown>) => ({
          id: item._id?.toString() ?? "",
          orderId: o._id.toString(),
          productId: item.product_id as string,
          title: item.title ?? "",
          price: Number(item.price),
          quantity: Number(item.quantity),
          sellerId,
          keys: [],
          platform: (item.platform as string) ?? "",
        })),
      });
    });

    return NextResponse.json({
      kpis: {
        grossSales,
        platformFees: totalCommission,
        netEarnings,
        availableForPayout: Math.max(0, netEarnings),
        orderCount,
      },
      orders,
      products: (productsResult ?? []).map((p: Record<string, unknown>) => {
        const pr = p as { _id: { toString(): string }; [key: string]: unknown };
        return {
          id: pr._id.toString(),
          title: pr.name,
          stock: pr.stock,
          soldCount: 0,
          price: Number(pr.price),
        };
      }),
    });
  } catch (error) {
    console.error("Seller overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}