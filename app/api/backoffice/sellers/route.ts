import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(req: Request) {
  try {
    const access = await requireAdminPermission("admin:sellers:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const verified = searchParams.get("verified");

    const supabase = createServiceRoleClient();
    let query = supabase
      .from("sellers")
      .select(
        `
        id,
        store_name,
        phone,
        verified,
        balance,
        pending_balance,
        sales_count,
        rating,
        created_at,
        user:users!sellers_user_id_fkey(id, email, full_name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (verified === "true") query = query.eq("verified", true);
    else if (verified === "false") query = query.eq("verified", false);

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase sellers error:", error);
      return NextResponse.json({ error: "Failed to fetch sellers" }, { status: 500 });
    }

    const sellers = (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id,
      storeName: s.store_name,
      phone: s.phone ?? "",
      verified: s.verified,
      balance: s.balance ?? 0,
      pendingBalance: s.pending_balance ?? 0,
      salesCount: s.sales_count ?? 0,
      rating: s.rating ?? 0,
      createdAt: s.created_at,
      user: {
        id: (s.user as Record<string, unknown>)?.id ?? "",
        email: (s.user as Record<string, unknown>)?.email ?? "",
        name: (s.user as Record<string, unknown>)?.full_name ?? "",
      },
    }));

    return NextResponse.json({ sellers, total: count ?? 0, page, limit });
  } catch (error) {
    console.error("Admin sellers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
