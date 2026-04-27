import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

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

interface ProductResponse {
  id: string;
  sellerId: string;
  name: string;
  price: number;
  isActive: boolean;
  stockQuantity: number;
  createdAt: string;
}

function mapDbToProduct(row: DbProduct): ProductResponse {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    price: Number(row.price),
    isActive: row.is_active,
    stockQuantity: row.stock ?? 0,
    createdAt: row.created_at,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminPermission("admin:products:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = {};

    if (body.isActive !== undefined) {
      updates.is_active = Boolean(body.isActive);
    } else if (body.action === "enable") {
      updates.is_active = true;
    } else if (body.action === "disable") {
      updates.is_active = false;
    }

    if (typeof body.price === "number" && body.price >= 0) {
      updates.price = body.price;
    }

    if (typeof body.stockQuantity === "number" && body.stockQuantity >= 0) {
      updates.stock = body.stockQuantity;
    } else if (typeof body.stock === "number" && body.stock >= 0) {
      updates.stock = body.stock;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase PATCH error:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: mapDbToProduct(data as DbProduct) });
  } catch (error) {
    console.error("Admin product PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireAdminPermission("admin:products:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (access.access?.adminRole !== "super_admin") {
      return NextResponse.json(
        { error: "Only super_admin can delete products" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const supabase = createServiceRoleClient();

    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);

    if (orderCount && orderCount > 0) {
      return NextResponse.json(
        { error: `Product has ${orderCount} existing order(s). Cannot delete.`, orderCount },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Admin product DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
