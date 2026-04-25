import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";

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
  title: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  isActive: boolean;
}

async function verifyAdmin(req: NextRequest): Promise<{ authorized: boolean; error?: string; status?: number }> {
  const access = await getAdminAccessFromRequest(req);
  if (access.status !== 200) {
    return { authorized: false, error: access.error, status: access.status };
  }
  return { authorized: true };
}

function mapDbToProduct(row: DbProduct): ProductResponse {
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.name,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    image: row.image_url || "",
    isActive: row.is_active,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const check = await verifyAdmin(req);
    if (!check.authorized) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const { id } = await params;
    const body = await req.json();

    const isActive = body.isActive ?? (body.action === "enable" ? true : body.action === "disable" ? false : undefined);

    if (isActive === undefined) {
      return NextResponse.json({ error: "isActive or action is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: mapDbToProduct(data as DbProduct) });
  } catch (error) {
    console.error("Admin product toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}