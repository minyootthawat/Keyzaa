import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const { db } = await connectDB();
    const [users, sellers, orders, products, ledgerEntries] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("sellers").countDocuments(),
      db.collection("orders").find({}).sort({ date: -1 }).limit(6).toArray(),
      db.collection("products").find({}).sort({ createdAt: -1 }).toArray(),
      db.collection("seller_ledger_entries").find({ type: "commission_fee" }).toArray(),
    ]);

    const grossVolume = orders.reduce((sum, order) => sum + Number(order.grossAmount || order.totalPrice || 0), 0);
    const platformRevenue = ledgerEntries.reduce((sum, entry) => sum + Math.abs(Number(entry.amount || 0)), 0);
    const activeListings = products.filter((product) => (product.listingStatus as string | undefined) !== "archived").length;

    const sellerSalesMap = new Map<string, number>();

    for (const order of orders) {
      const sellerId = String(order.sellerId || "");
      sellerSalesMap.set(sellerId, (sellerSalesMap.get(sellerId) || 0) + Number(order.totalPrice || 0));
    }

    const topSellers = Array.from(sellerSalesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sellerId, totalSales]) => ({
        sellerId,
        totalSales,
      }));

    const listingBreakdown = {
      active: products.filter((product) => (product.listingStatus as string | undefined) === "active").length,
      draft: products.filter((product) => (product.listingStatus as string | undefined) === "draft").length,
      paused: products.filter((product) => (product.listingStatus as string | undefined) === "paused").length,
      archived: products.filter((product) => (product.listingStatus as string | undefined) === "archived").length,
    };

    return NextResponse.json({
      kpis: {
        buyers: Math.max(users - sellers, 0),
        sellers,
        orders: await db.collection("orders").countDocuments(),
        activeListings,
        grossVolume,
        platformRevenue,
      },
      recentOrders: orders.map((order) => ({
        id: String(order.orderId || ""),
        buyerId: String(order.buyerId || ""),
        sellerId: String(order.sellerId || ""),
        totalPrice: Number(order.totalPrice || 0),
        status: String(order.status || ""),
        paymentStatus: String(order.paymentStatus || ""),
        date: String(order.date || ""),
      })),
      topSellers,
      listingBreakdown,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
