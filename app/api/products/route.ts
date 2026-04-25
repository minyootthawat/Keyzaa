import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

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

    const supabase = createServiceRoleClient();

    // Count query (with all filters applied)
    let countQuery = supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (category) {
      countQuery = countQuery.eq("category", category);
    }

    if (sellerId) {
      countQuery = countQuery.eq("seller_id", sellerId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Products count error:", countError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Main query with seller join
    let productsQuery = supabase
      .from("products")
      .select(`
        *,
        sellers:seller_id(id, store_name, verified)
      `)
      .eq("is_active", true);

    if (category) {
      productsQuery = productsQuery.eq("category", category);
    }

    if (sellerId) {
      productsQuery = productsQuery.eq("seller_id", sellerId);
    }

    const { data: products, error: productsError } = await productsQuery
      .order(actualSortBy as "created_at" | "price" | "name", { ascending: actualSortOrder === "asc" })
      .range((page - 1) * limit, page * limit - 1);

    if (productsError) {
      console.error("Products list error:", productsError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const total = count ?? 0;

    // Map to response shape (handle both array result and potential single seller object)
    const result: ProductWithSeller[] = (products ?? []).map((row) => {
      const sellerData = row.sellers as unknown as { id: string; store_name: string; verified: boolean } | null;
      return {
        id: row.id,
        sellerId: row.seller_id,
        title: row.name,
        category: row.category,
        price: Number(row.price),
        stock: row.stock,
        image: row.image_url || "",
        isActive: row.is_active,
        seller: {
          id: sellerData?.id || row.seller_id,
          storeName: sellerData?.store_name || "",
          verified: sellerData?.verified || false,
        },
      };
    });

    return NextResponse.json({
      products: result,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Public products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
