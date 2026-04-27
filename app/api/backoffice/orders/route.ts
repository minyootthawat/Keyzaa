import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(req: Request) {
  try {
    const access = await requireAdminPermission("admin:orders:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const status = searchParams.get("status");

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        gross_amount,
        created_at,
        user:users!orders_user_id_fkey(id, email, full_name),
        seller:sellers!orders_seller_id_fkey(id, store_name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase orders error:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    const orders = (data ?? []).map((o: Record<string, unknown>) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      grossAmount: o.gross_amount ?? 0,
      createdAt: o.created_at,
      user: {
        id: (o.user as Record<string, unknown>)?.id ?? "",
        email: (o.user as Record<string, unknown>)?.email ?? "",
        name: (o.user as Record<string, unknown>)?.full_name ?? "",
      },
      seller: {
        id: (o.seller as Record<string, unknown>)?.id ?? "",
        storeName: (o.seller as Record<string, unknown>)?.store_name ?? "",
      },
    }));

    return NextResponse.json({ orders, total: count ?? 0, page, limit });
  } catch (error) {
    console.error("Admin orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
