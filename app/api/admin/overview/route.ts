import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getBearerPayload } from "@/lib/auth/jwt";

interface OverviewStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

async function verifyAdmin(req: NextRequest): Promise<{ authorized: boolean; error?: string; status?: number }> {
  const payload = await getBearerPayload(req);
  const userId = payload?.userId as string | undefined;

  if (!userId) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  const supabase = createServiceRoleClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { authorized: false, error: "User not found", status: 404 };
  }

  if (user.role !== "both") {
    return { authorized: false, error: "Forbidden", status: 403 };
  }

  return { authorized: true };
}

export async function GET(req: NextRequest) {
  try {
    const check = await verifyAdmin(req);
    if (!check.authorized) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const supabase = createServiceRoleClient();

    const [usersResult, sellersResult, productsResult, ordersResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("sellers").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("orders").select("id", { count: "exact", head: true }),
    ]);

    // Use .select with sum() aggregate
    const { data: revenueData } = await supabase
      .from("orders")
      .select("total_price")
      .single();

    const stats: OverviewStats = {
      totalUsers: usersResult.count ?? 0,
      totalSellers: sellersResult.count ?? 0,
      totalProducts: productsResult.count ?? 0,
      totalOrders: ordersResult.count ?? 0,
      // total_price stored as string — convert safely
      totalRevenue: revenueData ? Number(revenueData?.total_price ?? 0) : 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}