import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { connectDB, countSellers } from "@/lib/db/mongodb";

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

    const { db } = await connectDB();
    const ordersCol = db.collection("orders");

    const [sellersCount, productsCount, ordersCount, revenueResult] = await Promise.all([
      countSellers(),
      db.collection("products").countDocuments({ is_active: true }),
      ordersCol.countDocuments(),
      ordersCol
        .aggregate([
          { $match: { status: "paid", payment_status: "paid" } },
          { $group: { _id: null, total: { $sum: "$gross_amount" } } },
        ])
        .toArray(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? Number(revenueResult[0].total) : 0;

    const stats: OverviewStats = {
      totalUsers: 0,
      totalSellers: sellersCount,
      totalProducts: productsCount,
      totalOrders: ordersCount,
      totalRevenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}