import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET() {
  try {
    const access = await requireAdminPermission("admin:overview:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const supabase = createServiceRoleClient();

    const [
      { count: usersCount },
      { count: sellersCount },
      { count: productsCount },
      { count: ordersCount },
      { count: activeListingsCount },
      { data: revenueData },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("sellers").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase
        .from("orders")
        .select("gross_amount")
        .eq("status", "paid")
        .eq("payment_status", "paid"),
    ]);

    const totalRevenue = (revenueData ?? []).reduce(
      (sum: number, o: { gross_amount?: number }) => sum + (o.gross_amount ?? 0),
      0
    );

    const stats = {
      totalUsers: usersCount ?? 0,
      totalSellers: sellersCount ?? 0,
      totalProducts: productsCount ?? 0,
      totalOrders: ordersCount ?? 0,
      totalRevenue,
      activeListings: activeListingsCount ?? 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
