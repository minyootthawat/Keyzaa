import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
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

function mapRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.name,
    nameTh: row.name,
    nameEn: row.name,
    descriptionTh: row.description || "",
    descriptionEn: row.description || "",
    shortDescriptionTh: row.description || "",
    shortDescriptionEn: row.description || "",
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = data as ProductRow;
    if (product.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ product: mapRowToProduct(product) });
  } catch (error) {
    console.error("Seller product get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if ((existing as ProductRow).seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description === "" ? null : body.description;
    }

    if (body.category !== undefined) {
      if (typeof body.category !== "string" || body.category.trim() === "") {
        return NextResponse.json({ error: "Category cannot be empty" }, { status: 400 });
      }
      updates.category = body.category.trim();
    }

    if (body.price !== undefined) {
      if (typeof body.price !== "number" || body.price <= 0) {
        return NextResponse.json({ error: "Price must be a number greater than 0" }, { status: 400 });
      }
      updates.price = body.price;
    }

    if (body.stock !== undefined) {
      if (typeof body.stock !== "number" || body.stock < 0) {
        return NextResponse.json({ error: "Stock must be a number of 0 or greater" }, { status: 400 });
      }
      updates.stock = body.stock;
    }

    if (body.image !== undefined) {
      updates.image_url = body.image === "" ? null : body.image;
    }

    if (body.isActive !== undefined) {
      updates.is_active = Boolean(body.isActive);
    }

    if (body.listingStatus !== undefined) {
      updates.is_active = body.listingStatus === "active";
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Seller product update error:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    return NextResponse.json({ product: mapRowToProduct(data as ProductRow) });
  } catch (error) {
    console.error("Seller product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    const { data: existing, error: fetchError } = await supabase
      .from("products")
      .select("seller_id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if ((existing as ProductRow).seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Seller product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
