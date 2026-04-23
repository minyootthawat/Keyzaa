import { NextRequest, NextResponse } from "next/server";
import { createServerClientSupabase } from "@/lib/supabase/supabase";

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
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
    description: row.description || "",
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    image: row.image_url || "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Filters
    const category = searchParams.get("category") || "";
    const sellerId = searchParams.get("sellerId") || "";

    // Sorting
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Validate sort options
    const validSortColumns = ["created_at", "price", "name"];
    const validSortOrders = ["asc", "desc"];
    const actualSortBy = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    const actualSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : "desc";

    const supabase = createServerClientSupabase();

    let query = supabase
      .from("products")
      .select("*, sellers(store_name, verified)", { count: "exact" })
      .eq("is_active", true)
      .order(actualSortBy as "created_at" | "price" | "name", { ascending: actualSortOrder === "asc" })
      .range((page - 1) * limit, page * limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const products: ProductWithSeller[] = (
      rows as (DbProduct & { sellers: { store_name: string; verified: boolean } })[]
    ).map((row) => ({
      ...mapDbToProduct(row),
      seller: {
        id: row.seller_id,
        storeName:
          (row as unknown as { sellers: { store_name: string; verified: boolean } }).sellers
            ?.store_name || "",
        verified:
          (row as unknown as { sellers: { store_name: string; verified: boolean } }).sellers
            ?.verified || false,
      },
    }));

    return NextResponse.json({
      products,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Public products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}