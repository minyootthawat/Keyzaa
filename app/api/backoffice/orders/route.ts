import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface OrderWithDetails {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerStoreName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(req: NextRequest) {
  try {
    const access = await getAdminAccessFromRequest(req);
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const buyerId = searchParams.get("buyerId");

    const supabase = createServiceRoleClient();

    // Fetch orders without joins to avoid null-related issues
    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq("status", status);
    if (sellerId) query = query.eq("seller_id", sellerId);
    if (buyerId) query = query.eq("buyer_id", buyerId);

    const { data: orderRows, error, count } = await query;

    if (error) {
      console.error("Orders query error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!orderRows || orderRows.length === 0) {
      return NextResponse.json({ orders: [], total: count ?? 0, page, limit });
    }

    // Batch fetch buyer and seller names
    const buyerIds = [...new Set(orderRows.map((o) => o.buyer_id).filter(Boolean))];
    const sellerIds = [...new Set(orderRows.map((o) => o.seller_id).filter(Boolean))];

    const [{ data: buyerRows }, { data: sellerRows }] = await Promise.all([
      buyerIds.length > 0
        ? supabase.from("users").select("id, name, email").in("id", buyerIds)
        : { data: null },
      sellerIds.length > 0
        ? supabase.from("sellers").select("id, store_name").in("id", sellerIds)
        : { data: null },
    ]);

    const buyerMap: Record<string, { name: string; email: string }> = {};
    for (const u of buyerRows ?? []) {
      buyerMap[u.id] = { name: u.name ?? "", email: u.email ?? "" };
    }

    const sellerMap: Record<string, string> = {};
    for (const s of sellerRows ?? []) {
      sellerMap[s.id] = s.store_name ?? "";
    }

    const orders: OrderWithDetails[] = orderRows.map((row) => ({
      id: row.id,
      buyerId: row.buyer_id ?? "",
      buyerName: buyerMap[row.buyer_id]?.name ?? (row.buyer_id ?? "").slice(0, 8),
      buyerEmail: buyerMap[row.buyer_id]?.email ?? "",
      sellerId: row.seller_id ?? "",
      sellerStoreName: sellerMap[row.seller_id] ?? (row.seller_id ?? "").slice(0, 8),
      productId: row.product_id ?? "",
      productName: "",
      quantity: Number(row.quantity ?? 1),
      totalPrice: Number(row.total_price ?? 0),
      status: row.status,
      paymentMethod: row.payment_method ?? "",
      createdAt: row.created_at ?? "",
      updatedAt: row.updated_at ?? "",
    }));

    return NextResponse.json({ orders, total: count ?? 0, page, limit });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
