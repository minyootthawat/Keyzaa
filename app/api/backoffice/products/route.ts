import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listProducts } from "@/lib/db/collections/products";
import { getSellerById } from "@/lib/db/collections/sellers";
import { findUserById } from "@/lib/db/supabase";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getServerAdminAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const status = searchParams.get("status") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const { products, total } = await listProducts({
      status: status as "active" | "inactive" | "out_of_stock" | "deleted" | undefined,
      category,
      search,
      limit,
      offset: (page - 1) * limit,
    });

    // Fetch seller info for each product
    const sellerIds = [...new Set(products.map((p) => p.seller_id))];
    const sellerMap: Record<string, { storeName: string }> = {};

    await Promise.all(
      sellerIds.map(async (id) => {
        const seller = await getSellerById(id);
        if (seller) {
          sellerMap[id] = { storeName: seller.store_name };
        }
      })
    );

    const mapped = products.map((p) => ({
      id: p.id,
      publicId: p.public_id,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      price: Number(p.price),
      stock: p.stock,
      imageUrl: p.image_url ?? "",
      status: p.status,
      isFeatured: p.is_featured,
      tags: p.tags ?? [],
      seller: {
        id: p.seller_id,
        storeName: sellerMap[p.seller_id]?.storeName ?? "",
      },
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json({
      products: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
