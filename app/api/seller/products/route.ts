import { NextRequest, NextResponse } from "next/server";
import { getSellerAccessFromRequest } from "@/lib/auth/seller";
import { createServiceRoleClient } from "@/lib/db/supabase";
import type { Product } from "@/app/types";

interface ProductRow {
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

function mapRowToProduct(row: ProductRow): Partial<Product> {
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
    isActive: row.is_active,
  };
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await getSellerAccessFromRequest(req);
    if (authResult.status !== 200) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { sellerId } = authResult.access!;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Seller products list error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const mapped = (data as ProductRow[]).map(mapRowToProduct);
    return NextResponse.json({ products: mapped });
  } catch (error) {
    console.error("Seller products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getSellerAccessFromRequest(req);
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

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        seller_id: sellerId,
        name: name.trim(),
        description: body.description || null,
        category: category.trim(),
        price: price,
        stock: stock,
        image_url: body.image || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Seller product create error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    return NextResponse.json({ product: mapRowToProduct(data as ProductRow) }, { status: 201 });
  } catch (error) {
    console.error("Seller product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
