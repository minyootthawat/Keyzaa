import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/db/collections/products";
import { getSellerById } from "@/lib/db/collections/sellers";

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
    const offset = (page - 1) * limit;

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

    const { products, total } = await listProducts({
      search: undefined,
      category: category || undefined,
      limit,
      offset,
    });

    // Fetch seller info for each product
    const sellerIds = [...new Set(products.map((p) => p.seller_id))];
    const sellerResults = await Promise.all(sellerIds.map((id) => getSellerById(id)));
    const sellerMap = new Map<string, { id: string; store_name: string; verified: boolean }>();
    for (const seller of sellerResults) {
      if (seller) {
        sellerMap.set(seller._id!.toString(), {
          id: seller._id!.toString(),
          store_name: seller.store_name,
          verified: seller.verified,
        });
      }
    }

    // Sort in memory (MongoDB doesn't support multi-field sort by arbitrary columns)
    const sortedProducts = [...products].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (actualSortBy === "price") {
        aVal = a.price;
        bVal = b.price;
      } else if (actualSortBy === "name") {
        aVal = a.name;
        bVal = b.name;
      } else {
        aVal = a.created_at;
        bVal = b.created_at;
      }

      if (aVal < bVal) return actualSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return actualSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalPages = Math.ceil(total / limit);

    const result: ProductWithSeller[] = sortedProducts.map((row) => {
      const sid = row.seller_id;
      const sellerData = sellerMap.get(sid);
      return {
        id: row._id!.toString(),
        sellerId: sid,
        title: row.name,
        category: row.category,
        price: Number(row.price),
        stock: row.stock,
        image: row.image_url || "",
        isActive: row.is_active,
        seller: {
          id: sellerData?.id || sid,
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
      totalPages,
    });
  } catch (error) {
    console.error("Public products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
