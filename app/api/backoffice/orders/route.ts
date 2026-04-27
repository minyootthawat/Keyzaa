import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listOrders } from "@/lib/db/collections/orders";
import { getDB } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const status = searchParams.get("status");

    const { orders, total } = await listOrders({
      status: status || undefined,
      limit,
      offset: (page - 1) * limit,
    });

    // Fetch user and seller info
    const db = getDB();
    const buyerIds = [...new Set(orders.map((o) => o.buyer_id))];
    const sellerIds = [...new Set(orders.map((o) => o.seller_id))];

    const [buyers, sellers] = await Promise.all([
      buyerIds.length > 0 ? db.collection("users").find({ _id: { $in: buyerIds.map((id) => new (require("mongodb")).ObjectId(id)) } }).toArray() : [],
      sellerIds.length > 0 ? db.collection("sellers").find({ _id: { $in: sellerIds.map((id) => new (require("mongodb")).ObjectId(id)) } }).toArray() : [],
    ]);

    const buyerMap: Record<string, Record<string, unknown>> = {};
    for (const u of buyers) {
      buyerMap[u._id.toString()] = u;
    }
    const sellerMap: Record<string, Record<string, unknown>> = {};
    for (const s of sellers) {
      sellerMap[s._id.toString()] = s;
    }

    const mapped = orders.map((o) => ({
      id: o._id?.toString() ?? "",
      orderNumber: (o as unknown as Record<string, unknown>).order_number ?? "",
      status: o.status,
      paymentStatus: o.payment_status,
      grossAmount: o.gross_amount ?? 0,
      createdAt: o.created_at,
      user: {
        id: o.buyer_id,
        email: (buyerMap[o.buyer_id] as Record<string, unknown> | undefined)?.email ?? "",
        name: (buyerMap[o.buyer_id] as Record<string, unknown> | undefined)?.name ?? "",
      },
      seller: {
        id: o.seller_id,
        storeName: (sellerMap[o.seller_id] as Record<string, unknown> | undefined)?.store_name ?? "",
      },
    }));

    return NextResponse.json({ orders: mapped, total, page, limit });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
