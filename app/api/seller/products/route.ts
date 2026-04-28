import { NextRequest, NextResponse } from "next/server";
import { getServerSellerAccess } from "@/lib/auth/server";
import { getProductsBySeller, createProduct } from "@/lib/db/collections/products";

function mapRowToProduct(row: { id: string; seller_id: string; name: string; description?: string | null; category: string; price: number; stock: number; image_url?: string | null; status: "active" | "inactive" | "out_of_stock" | "deleted" }) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.name,
    nameTh: row.name,
    nameEn: row.name,
    category: row.category,
    platform: "",
    price: Number(row.price),
    originalPrice: Number(row.price),
    discount: 0,
    stock: row.stock,
    soldCount: 0,
    image: row.image_url || "",
    isActive: row.status === "active",
  };
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const products = await getProductsBySeller(sellerId);

    const total = products.length;
    const totalPages = 1;
    const mapped = products.map(mapRowToProduct);
    return NextResponse.json({ products: mapped, total, page: 1, limit: total, totalPages });
  } catch (error) {
    console.error("Seller products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getServerSellerAccess(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId, isVerified } = authResult.access!;

    if (!isVerified) {
      return NextResponse.json({ error: "Seller not verified" }, { status: 403 });
    }

    const body = await req.json();

    const { name, category, price, stock } = body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!category || typeof category !== "string" || category.trim() === "") {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (price === undefined || typeof price !== "number" || price <= 0) {
      return NextResponse.json({ error: "Price must be a number greater than 0" }, { status: 400 });
    }
    if (stock === undefined || typeof stock !== "number" || stock < 0) {
      return NextResponse.json({ error: "Stock must be a number of 0 or greater" }, { status: 400 });
    }

    const product = await createProduct({
      sellerId,
      name: name.trim(),
      description: body.description,
      category: category.trim(),
      price,
      imageUrl: body.image,
    });

    if (!product) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    // Update stock separately since createProduct sets stock to 0
    if (stock > 0) {
      const { updateProduct } = await import("@/lib/db/collections/products");
      await updateProduct(product.id, { stock });
    }

    return NextResponse.json({ product: mapRowToProduct(product) }, { status: 201 });
  } catch (error) {
    console.error("Seller product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
