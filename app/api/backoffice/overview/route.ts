import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { getDB } from "@/lib/mongodb";
import { listUsers } from "@/lib/db/collections/users";
import { listSellers } from "@/lib/db/collections/sellers";
import { listProducts } from "@/lib/db/collections/products";
import { listOrders } from "@/lib/db/collections/orders";

export async function GET() {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const db = getDB();

    const [{ total: usersCount }, { total: sellersCount }, { total: productsCount }, { total: ordersCount, orders: paidOrders }] =
      await Promise.all([
        listUsers({ limit: 0 }),
        listSellers({ limit: 0 }),
        listProducts({ limit: 0 }),
        listOrders({ status: "paid" }),
      ]);

    const activeListingsCount = await db.collection("products").countDocuments({ is_active: true });

    const totalRevenue = (paidOrders ?? []).reduce(
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
