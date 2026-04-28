import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listOrders } from "@/lib/db/supabase";
import { listSellers } from "@/lib/db/collections/sellers";
import { listProducts } from "@/lib/db/collections/products";
import { listUsers } from "@/lib/db/collections/users";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getServerAdminAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const requestedDays = parseInt(searchParams.get("days") ?? "", 10);
    const period = searchParams.get("period") ?? "30d"; // 7d, 30d, 90d, all
    const analyticsDays = Number.isFinite(requestedDays) && requestedDays > 0
      ? Math.min(requestedDays, 365)
      : period === "7d"
        ? 7
        : period === "90d"
          ? 90
          : period === "all"
            ? 365
            : 30;

    // Determine date range
    let startDate: Date | null = null;
    if (period !== "all" || Number.isFinite(requestedDays)) {
      startDate = new Date(Date.now() - analyticsDays * 24 * 60 * 60 * 1000);
    }

    // Fetch all orders (paginated internally, use large limit for analytics)
    const { orders } = await listOrders({ limit: 10000, offset: 0 });

    // Filter by date range if needed
    const filteredOrders = startDate
      ? orders.filter((o) => new Date(o.created_at) >= startDate!)
      : orders;

    // Compute metrics
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter((o) => o.status === "completed");
    const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
    const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled");

    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    const totalCommission = completedOrders.reduce((sum, o) => sum + Number(o.commission_amount), 0);
    const totalGross = completedOrders.reduce((sum, o) => sum + Number(o.gross_amount), 0);

    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Seller stats
    const { sellers } = await listSellers({ limit: 10000, offset: 0 });
    const activeSellers = sellers.filter((s) => s.status === "active").length;
    const pendingSellers = sellers.filter((s) => s.status === "pending_verification").length;

    // Product stats
    const { products } = await listProducts({ limit: 10000, offset: 0, status: undefined });
    const activeProducts = products.filter((p) => p.status === "active").length;
    const outOfStockProducts = products.filter((p) => p.status === "out_of_stock").length;
    const { users } = await listUsers({ limit: 10000, offset: 0 });

    // Revenue by day
    const revenueByDay: Record<string, { date: string; amount: number }> = {};
    const ordersByDay: Record<string, number> = {};
    const newUsersByDayMap: Record<string, { date: string; count: number }> = {};
    for (let i = 0; i < analyticsDays; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      revenueByDay[key] = { date: key, amount: 0 };
      ordersByDay[key] = 0;
      newUsersByDayMap[key] = { date: key, count: 0 };
    }
    for (const order of completedOrders) {
      const key = order.created_at.split("T")[0];
      if (revenueByDay[key]) {
        revenueByDay[key].amount += Number(order.total_price);
        ordersByDay[key] += 1;
      }
    }

    for (const user of users) {
      const key = user.created_at.split("T")[0];
      if (newUsersByDayMap[key]) {
        newUsersByDayMap[key].count += 1;
      }
    }

    const revenueSeries = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));
    const newUsersByDay = Object.values(newUsersByDayMap).sort((a, b) => a.date.localeCompare(b.date));

    const ordersByStatus = Object.entries(
      filteredOrders.reduce<Record<string, number>>((acc, order) => {
        acc[order.status] = (acc[order.status] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([status, count]) => ({ status, count }));

    const productMetrics = filteredOrders.reduce<Record<string, { id: string; name: string; sold: number; revenue: number }>>(
      (acc, order) => {
        for (const item of order.items ?? []) {
          const existing = acc[item.product_id] ?? {
            id: item.product_id,
            name: item.title,
            sold: 0,
            revenue: 0,
          };
          existing.sold += Number(item.quantity ?? 0);
          existing.revenue += Number(item.price ?? 0) * Number(item.quantity ?? 0);
          acc[item.product_id] = existing;
        }
        return acc;
      },
      {}
    );
    const topProducts = Object.values(productMetrics)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top sellers by revenue
    const sellerRevenueMap: Record<string, { revenue: number; sales: number }> = {};
    for (const order of completedOrders) {
      if (order.seller_id) {
        const existing = sellerRevenueMap[order.seller_id] ?? { revenue: 0, sales: 0 };
        existing.revenue += Number(order.total_price);
        existing.sales += 1;
        sellerRevenueMap[order.seller_id] = existing;
      }
    }
    const topSellerIds = Object.entries(sellerRevenueMap)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([id]) => id);
    const topSellers = await Promise.all(
      topSellerIds.map(async (id) => {
        const seller = sellers.find((s) => s.id === id);
        return {
          id,
          storeName: seller?.store_name ?? "Unknown",
          revenue: sellerRevenueMap[id]?.revenue ?? 0,
          sales: sellerRevenueMap[id]?.sales ?? 0,
        };
      })
    );

    const newUsers = newUsersByDay.reduce((sum, item) => sum + item.count, 0);

    return NextResponse.json({
      period,
      summary: {
        totalOrders,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        cancelledOrders: cancelledOrders.length,
        totalRevenue,
        totalCommission,
        totalGross,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        activeSellers,
        pendingSellers,
        activeProducts,
        outOfStockProducts,
        newUsers,
      },
      revenueByDay: revenueSeries,
      ordersByStatus,
      topProducts,
      topSellers,
      newUsersByDay,
    });
  } catch (error) {
    console.error("Admin analytics GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
