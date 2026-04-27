import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "30", 10), 365);
  const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  try {
    const access = await requireAdminPermission("admin:analytics:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const supabase = createServiceRoleClient();

    // --- Summary stats ---
    const [
      { count: totalOrders },
      { data: revenueData },
      { count: newUsers30d },
      { count: activeSellers },
    ] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("gross_amount")
        .eq("status", "paid")
        .eq("payment_status", "paid"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", daysAgo),
        supabase
          .from("sellers")
          .select("*", { count: "exact", head: true })
          .eq("verified", true),
      ]);

    const totalRevenue = (revenueData ?? []).reduce(
      (sum: number, o: { gross_amount?: number }) => sum + (o.gross_amount ?? 0),
      0
    );
    const orderCount = totalOrders ?? 0;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // --- Revenue by day (last N days) ---
    const { data: ordersForRevenue } = await supabase
      .from("orders")
      .select("gross_amount, created_at")
      .eq("status", "paid")
      .eq("payment_status", "paid")
      .gte("created_at", daysAgo);

    const revenueByDayMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      revenueByDayMap[key] = 0;
    }
    for (const o of ordersForRevenue ?? []) {
      const key = (o.created_at as string).split("T")[0];
      if (key in revenueByDayMap) revenueByDayMap[key] += o.gross_amount ?? 0;
    }
    const revenueByDay = Object.entries(revenueByDayMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Orders by status ---
    const { data: ordersByStatusRaw } = await supabase
      .from("orders")
      .select("status");

    const statusCountMap: Record<string, number> = {};
    for (const o of ordersByStatusRaw ?? []) {
      const s = o.status ?? "unknown";
      statusCountMap[s] = (statusCountMap[s] ?? 0) + 1;
    }
    const ordersByStatus = Object.entries(statusCountMap).map(([status, count]) => ({
      status,
      count,
    }));

    // --- New users by day (last N days) ---
    const { data: newUsersRaw } = await supabase
      .from("users")
      .select("created_at")
      .gte("created_at", daysAgo);

    const newUsersMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      newUsersMap[key] = 0;
    }
    for (const u of newUsersRaw ?? []) {
      const key = (u.created_at as string).split("T")[0];
      if (key in newUsersMap) newUsersMap[key]++;
    }
    const newUsersByDay = Object.entries(newUsersMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Top products (by units sold via order items) ---
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity, unit_price, product:products(id, name)");

    const productStatsMap: Record<string, { id: string; name: string; sold: number; revenue: number }> = {};
    for (const item of orderItems ?? []) {
      const pid = item.product_id;
      const pname = (item.product as { name?: string } | null)?.name ?? "Unknown";
      if (!productStatsMap[pid]) {
        productStatsMap[pid] = { id: pid, name: pname, sold: 0, revenue: 0 };
      }
      productStatsMap[pid].sold += item.quantity ?? 0;
      productStatsMap[pid].revenue += (item.quantity ?? 0) * (item.unit_price ?? 0);
    }
    const topProducts = Object.values(productStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // --- Top sellers (by revenue) ---
    const { data: sellerOrders } = await supabase
      .from("orders")
      .select("seller_id, gross_amount")
      .eq("status", "paid")
      .eq("payment_status", "paid");

    const sellerStatsMap: Record<string, { id: string; storeName: string; sales: number; revenue: number }> = {};
    for (const o of sellerOrders ?? []) {
      const sid = o.seller_id;
      if (!sid) continue;
      if (!sellerStatsMap[sid]) {
        sellerStatsMap[sid] = { id: sid, storeName: "Unknown", sales: 0, revenue: 0 };
      }
      sellerStatsMap[sid].sales++;
      sellerStatsMap[sid].revenue += o.gross_amount ?? 0;
    }

    // Fetch seller store names
    const sellerIds = Object.keys(sellerStatsMap);
    if (sellerIds.length > 0) {
      const { data: sellersData } = await supabase
        .from("sellers")
        .select("id, store_name")
        .in("id", sellerIds);
      for (const s of sellersData ?? []) {
        if (sellerStatsMap[s.id]) {
          sellerStatsMap[s.id].storeName = s.store_name ?? "Unknown";
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
        newUsers: newUsers30d ?? 0,
        activeSellers: activeSellers ?? 0,
        avgOrderValue,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
