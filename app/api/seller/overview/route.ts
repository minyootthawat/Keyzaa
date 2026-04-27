import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getOrdersBySeller } from "@/lib/db/collections/orders";
import { getProductsBySeller } from "@/lib/db/collections/products";
import { getLedgerBySeller } from "@/lib/db/collections/ledger";
import type { OrderItem } from "@/lib/db/collections/orders";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Get seller by user_id
    const seller = await getSellerByUserId(userId);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller._id!.toString();

    // Fetch orders, products, and ledger entries in parallel
    const [ordersData, productsData, ledgerData] = await Promise.all([
      getOrdersBySeller(sellerId),
      getProductsBySeller(sellerId),
      getLedgerBySeller(sellerId),
    ]);

    // Sort orders by created_at desc
    ordersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Paginate orders
    const paginatedOrders = ordersData.slice(from, to + 1);
    const totalOrders = ordersData.length;
    const totalOrdersPages = Math.ceil(totalOrders / limit);

    // Compute sold count map from order items
    const soldCountMap: Record<string, number> = {};
    for (const order of ordersData) {
      for (const item of order.items) {
        soldCountMap[item.product_id] = (soldCountMap[item.product_id] ?? 0) + item.quantity;
      }
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
      (o) => o.payment_status === "paid" || o.status === "completed" || o.status === "shipped"
    ).length;

    const kpis = {
      grossSales,
      netEarnings,
      availableForPayout,
      platformFees,
      orderCount,
    };

    const orders = paginatedOrders.map((order) => ({
      id: order._id!.toString(),
      orderId: order._id!.toString(),
      buyerId: order.buyer_id,
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
      items: order.items.map((item: OrderItem) => ({
        id: item.product_id,
        orderId: order._id!.toString(),
        productId: item.product_id,
        title: item.title ?? "",
        image: item.image ?? "",
        price: Number(item.price),
        quantity: item.quantity,
        sellerId: sellerId,
        keys: [],
        platform: item.platform ?? "",
      })),
    }));

    const products = productsData.map((p) => ({
      id: p._id!.toString(),
      title: p.name,
      stock: p.stock,
      soldCount: soldCountMap[p._id!.toString()] ?? 0,
      price: Number(p.price),
    }));

    return NextResponse.json({ kpis, orders, products, totalOrdersPages });
  } catch (error) {
    console.error("Seller overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
