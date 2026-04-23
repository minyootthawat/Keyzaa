import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";

interface DbProduct {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductWithSeller {
  id: string;
  sellerId: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
  seller: {
    id: string;
    storeName: string;
    verified: boolean;
  };
}

function mapDbToProduct(row: DbProduct): Omit<ProductWithSeller, "seller"> {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.name,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    image: row.image_url || "",
    isActive: row.is_active,
  };
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
    const category = searchParams.get("category") || "";

    const supabase = createServiceRoleClient();

    let query = supabase
      .from("products")
      .select("*, sellers(store_name, verified)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const products: ProductWithSeller[] = (rows as (DbProduct & { sellers: { store_name: string; verified: boolean } })[]).map((row) => ({
      ...mapDbToProduct(row),
      seller: {
        id: row.seller_id,
        storeName: (row as unknown as { sellers: { store_name: string; verified: boolean } }).sellers?.store_name || "",
        verified: (row as unknown as { sellers: { store_name: string; verified: boolean } }).sellers?.verified || false,
      },
    }));

    return NextResponse.json({
      products,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}