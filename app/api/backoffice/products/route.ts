import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(req: Request) {
  try {
    const access = await requireAdminPermission("admin:products:read");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const filter = searchParams.get("filter") ?? "all";
    const search = searchParams.get("search") ?? "";

    const supabase = createServiceRoleClient();

    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        price,
        is_active,
        stock_quantity,
        created_at,
        seller:sellers!products_seller_id_fkey(id, store_name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (filter === "active") {
      query = query.eq("is_active", true);
    } else if (filter === "inactive") {
      query = query.eq("is_active", false);
    }

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error, count } = await query.range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Supabase products error:", error);
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    const products = (data ?? []).map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      price: p.price ?? 0,
      isActive: p.is_active,
      stockQuantity: p.stock_quantity ?? 0,
      createdAt: p.created_at,
      seller: {
        id: (p.seller as Record<string, unknown>)?.id ?? "",
        storeName: (p.seller as Record<string, unknown>)?.store_name ?? "",
      },
    }));

    return NextResponse.json({ products, total: count ?? 0, page, limit });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
