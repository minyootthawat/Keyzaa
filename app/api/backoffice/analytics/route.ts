import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { getDB } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 365);
  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const db = getDB();

    // --- Summary stats ---
    const [
      totalOrders,
      revenueData,
      newUsers30d,
      activeSellers,
    ] = await Promise.all([
      db.collection("orders").countDocuments(),
      db.collection("orders").find({ status: "paid", payment_status: "paid" }, { projection: { gross_amount: 1 } }).toArray(),
      db.collection("users").countDocuments({ created_at: { $gte: daysAgo.toISOString() } }),
      db.collection("sellers").countDocuments({ verified: true }),
    ]);

    const revenueDocs = revenueData as unknown as Array<{ gross_amount?: number }>;
    const totalRevenue = revenueDocs.reduce(
      (sum: number, o) => sum + (o.gross_amount ?? 0),
      0
    );
    const orderCount = totalOrders;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // --- Revenue by day (last N days) ---
    const ordersForRevenue = await db
      .collection("orders")
      .find({ status: "paid", payment_status: "paid", created_at: { $gte: daysAgo.toISOString() } }, { projection: { gross_amount: 1, created_at: 1 } })
      .toArray();

    const revenueByDayMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      revenueByDayMap[key] = 0;
    }
    for (const o of ordersForRevenue) {
      const key = (o.created_at as string).split("T")[0];
      if (key in revenueByDayMap) revenueByDayMap[key] += o.gross_amount ?? 0;
    }
    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Orders by status ---
    const ordersByStatusRaw = await db
      .collection("orders")
      .find({}, { projection: { status: 1 } })
      .toArray();

    const statusCountMap: Record<string, number> = {};
    for (const o of ordersByStatusRaw) {
      const s = String((o as Record<string, unknown>).status ?? "unknown");
      statusCountMap[s] = (statusCountMap[s] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusCountMap).map(([status, count]) => ({
      status,
      count,
    }));

    // --- New users by day (last N days) ---
    const newUsersRaw = await db
      .collection("users")
      .find({ created_at: { $gte: daysAgo.toISOString() } }, { projection: { created_at: 1 } })
      .toArray();

    const newUsersMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      newUsersMap[key] = 0;
    }
    for (const u of newUsersRaw) {
      const key = ((u as Record<string, unknown>).created_at as string).split("T")[0];
      if (key in newUsersMap) newUsersMap[key]++;
    }
    const newUsersByDay = Object.entries(newUsersMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Top products (by units sold via order items) ---
    const orderItems = await db
      .collection("order_items")
      .find()
      .toArray();

    const productStatsMap: Record<string, { id: string; name: string; sold: number; revenue: number }> = {};
    for (const item of orderItems) {
      const pid = (item as Record<string, unknown>).product_id as string;
      const pname = ((item as Record<string, unknown>).product as { name?: string } | null)?.name ?? "Unknown";
      if (!productStatsMap[pid]) {
        productStatsMap[pid] = { id: pid, name: pname, sold: 0, revenue: 0 };
      }
      productStatsMap[pid].sold += ((item as Record<string, unknown>).quantity as number) ?? 0;
      productStatsMap[pid].revenue += (((item as Record<string, unknown>).quantity as number) ?? 0) * (((item as Record<string, unknown>).unit_price as number) ?? 0);
    }
    const topProducts = Object.values(productStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // --- Top sellers (by revenue) ---
    const sellerOrders = await db
      .collection("orders")
      .find({ status: "paid", payment_status: "paid" }, { projection: { seller_id: 1, gross_amount: 1 } })
      .toArray();

    const sellerStatsMap: Record<string, { id: string; storeName: string; sales: number; revenue: number }> = {};
    for (const o of sellerOrders) {
      const sid = (o as Record<string, unknown>).seller_id as string;
      if (!sid) continue;
      if (!sellerStatsMap[sid]) {
        sellerStatsMap[sid] = { id: sid, storeName: "Unknown", sales: 0, revenue: 0 };
      }
      sellerStatsMap[sid].sales++;
      sellerStatsMap[sid].revenue += (o as Record<string, unknown>).gross_amount as number ?? 0;
    }

    // Fetch seller store names
    const sellerIds = Object.keys(sellerStatsMap);
    if (sellerIds.length > 0) {
      const sellersData = await db
        .collection("sellers")
        .find({ _id: { $in: sellerIds.map((id) => new (require("mongodb")).ObjectId(id)) } }, { projection: { store_name: 1 } })
        .toArray();
      for (const s of sellersData) {
        const sid = s._id.toString();
        if (sellerStatsMap[sid]) {
          sellerStatsMap[sid].storeName = (s as Record<string, unknown>).store_name as string ?? "Unknown";
        }
      }
    }

    const topSellers = Object.values(sellerStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      revenueByDay,
      ordersByStatus,
      topProducts,
      topSellers,
      newUsersByDay,
      summary: {
        totalRevenue,
        totalOrders: orderCount,
        newUsers: newUsers30d,
        activeSellers,
        avgOrderValue,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
