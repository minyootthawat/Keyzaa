import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import type { Product } from "@/app/types";
import { ObjectId } from "mongodb";

interface DbProduct {
  _id: ObjectId;
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

function mapDbToProduct(row: DbProduct): Partial<Product> {
  return {
    id: row._id.toString(),
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

    const { db } = await connectDB();
    const products = await db
      .collection("products")
      .find({ seller_id: sellerId })
      .sort({ created_at: -1 })
      .toArray();

    const mapped = (products as unknown as DbProduct[]).map(mapDbToProduct);
    return NextResponse.json({ products: mapped });
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

    const { db } = await connectDB();
    const now = new Date().toISOString();
    const result = await db.collection("products").insertOne({
      seller_id: sellerId,
      name: name.trim(),
      description: body.description || null,
      category: category.trim(),
      price: price,
      stock: stock,
      image_url: body.image || null,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    const inserted = await db.collection("products").findOne({ _id: result.insertedId });
    return NextResponse.json({ product: mapDbToProduct(inserted as unknown as DbProduct) }, { status: 201 });
  } catch (error) {
    console.error("Seller product create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
