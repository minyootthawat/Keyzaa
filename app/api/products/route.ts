import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";

interface DbProduct {
  _id: string;
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

function mapDbToProduct(row: DbProduct & { seller_store_name?: string; seller_verified?: boolean }): Omit<ProductWithSeller, "seller"> {
  return {
    id: row._id.toString(),
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

    const { db } = await connectDB();

    // Build filter
    const filter: Record<string, unknown> = { is_active: true };
    if (category) {
      filter.category = category;
    }
    if (sellerId) {
      filter.seller_id = sellerId;
    }

    // Sort direction
    const sortDir = actualSortOrder === "asc" ? 1 : -1;

    // Run count and find in parallel
    const [countResult, products] = await Promise.all([
      db.collection("products").countDocuments(filter),
      db
        .collection("products")
        .aggregate([
          { $match: filter },
          {
            $lookup: {
              from: "sellers",
              localField: "seller_id",
              foreignField: "_id",
              as: "seller_data",
            },
          },
          { $unwind: { path: "$seller_data", preserveNullAndEmptyArrays: true } },
          { $sort: { [actualSortBy]: sortDir } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ])
        .toArray(),
    ]);

    const total = countResult;

    const result: ProductWithSeller[] = products.map((row: Record<string, unknown>) => {
      const product = row as unknown as DbProduct & { seller_data?: { _id: string; store_name: string; verified: boolean } };
      return {
        ...mapDbToProduct(product as DbProduct & { seller_store_name?: string; seller_verified?: boolean }),
        seller: {
          id: product.seller_id,
          storeName: product.seller_data?.store_name || "",
          verified: product.seller_data?.verified || false,
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
