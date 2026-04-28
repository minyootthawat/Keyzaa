import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listOrders } from "@/lib/db/collections/orders";
import type { OrderStatus } from "@/lib/db/collections/orders";
import { findUserById } from "@/lib/db/collections/users";
import { getSellerById } from "@/lib/db/collections/sellers";

export async function GET(req: NextRequest) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const status = searchParams.get("status") as OrderStatus | null;

    const { orders, total } = await listOrders({
      status: (status ?? undefined) as "pending" | "paid" | "processing" | "completed" | "cancelled" | undefined,
      limit,
      offset: (page - 1) * limit,
    });

    // Fetch user and seller info for each order
    const buyerIds = [...new Set(orders.map((o) => o.buyer_id).filter(Boolean))];
    const sellerIds = [...new Set(orders.map((o) => o.seller_id).filter(Boolean))];

    const buyerMap: Record<string, { email: string; name: string }> = {};
    const sellerMap: Record<string, { store_name: string }> = {};

    await Promise.all([
      Promise.all(buyerIds.map(async (id) => {
        if (id) {
          const user = await findUserById(id);
          if (user) {
            buyerMap[id] = { email: user.email, name: user.name };
          }
        }
      })),
      Promise.all(sellerIds.map(async (id) => {
        if (id) {
          const seller = await getSellerById(id);
          if (seller) {
            sellerMap[id] = { store_name: seller.store_name };
          }
        }
      })),
    ]);

    const mapped = orders.map((o) => ({
      id: o.id,
      orderNumber: o.public_id ?? "",
      status: o.status,
      paymentStatus: o.payment_status,
      grossAmount: o.gross_amount ?? 0,
      createdAt: o.created_at,
      user: {
        id: o.buyer_id,
        email: buyerMap[o.buyer_id ?? ""]?.email ?? "",
        name: buyerMap[o.buyer_id ?? ""]?.name ?? "",
      },
      seller: {
        id: o.seller_id,
        storeName: sellerMap[o.seller_id ?? ""]?.store_name ?? "",
      },
    }));

    return NextResponse.json({ orders: mapped, total, page, limit });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
