import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db/mongodb";

interface OverviewStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAdminAccessFromRequest(req);
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const supabase = createServiceRoleClient();
    const { db } = await connectDB();
    const ordersCol = db.collection("orders");

    const [usersResult, sellersResult, productsResult, ordersCount, revenueResult] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("sellers").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      // MongoDB: count all orders
      ordersCol.countDocuments(),
      // MongoDB: sum gross_amount for paid orders
      ordersCol
        .aggregate([
          { $match: { status: "paid", payment_status: "paid" } },
          { $group: { _id: null, total: { $sum: "$gross_amount" } } },
        ])
        .toArray(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? Number(revenueResult[0].total) : 0;

    const stats: OverviewStats = {
      totalUsers: usersResult.count ?? 0,
      totalSellers: sellersResult.count ?? 0,
      totalProducts: productsResult.count ?? 0,
      totalOrders: ordersCount,
      totalRevenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
