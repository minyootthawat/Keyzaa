import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getBearerPayload } from "@/lib/auth/jwt";
import type { Product } from "@/app/types";

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

function mapDbToProduct(row: DbProduct): Product {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    description: row.description || "",
    category: row.category,
    platform: "", // Not in schema
    price: Number(row.price),
    stock: row.stock,
    image: row.image_url || "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getSellerIdFromUserId(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("id, verified")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.id;
}

async function getSellerVerificationStatus(sellerId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("verified")
    .eq("id", sellerId)
    .single();

  if (error || !data) return false;
  return data.verified === true;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = payload?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const products = (data as DbProduct[]).map(mapDbToProduct);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Seller products list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = payload?.userId as string | undefined;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const isVerified = await getSellerVerificationStatus(sellerId);
    if (!isVerified) {
      return NextResponse.json({ error: "Seller not verified" }, { status: 403 });
    }

    const body = await req.json();

    // Validate required fields
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
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    return NextResponse.json({ product: mapDbToProduct(data as DbProduct) }, { status: 201 });
  } catch (error) {
    console.error("Seller product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
