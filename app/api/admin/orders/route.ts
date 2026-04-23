import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getBearerPayload } from "@/lib/auth/jwt";

interface DbOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

interface DbUser {
  id: string;
  name: string;
  email: string;
}

interface DbProduct {
  id: string;
  name: string;
}

interface DbSeller {
  id: string;
  store_name: string;
}

interface OrderWithDetails {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerStoreName: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

async function verifyAdmin(req: NextRequest): Promise<{ authorized: boolean; error?: string; status?: number }> {
  const payload = await getBearerPayload(req);
  const userId = payload?.userId as string | undefined;

  if (!userId) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  const supabase = createServiceRoleClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { authorized: false, error: "User not found", status: 404 };
  }

  if (user.role !== "both") {
    return { authorized: false, error: "Forbidden", status: 403 };
  }

  return { authorized: true };
}

export async function GET(req: NextRequest) {
  try {
    const check = await verifyAdmin(req);
    if (!check.authorized) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const buyerId = searchParams.get("buyerId");

    const supabase = createServiceRoleClient();

    let query = supabase
      .from("orders")
      .select(
        "*, buyers:buyer_id(id, name, email), sellers:seller_id(id, store_name), products:product_id(id, name)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq("status", status);
    }
    if (sellerId) {
      query = query.eq("seller_id", sellerId);
    }
    if (buyerId) {
      query = query.eq("buyer_id", buyerId);
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const typedRows = rows as (DbOrder & {
      buyers: DbUser;
      sellers: DbSeller;
      products: DbProduct;
    })[];

    const orders: OrderWithDetails[] = typedRows.map((row) => ({
      id: row.id,
      buyerId: row.buyer_id,
      buyerName: row.buyers?.name || "",
      buyerEmail: row.buyers?.email || "",
      sellerId: row.seller_id,
      sellerStoreName: row.sellers?.store_name || "",
      productId: row.product_id,
      productName: row.products?.name || "",
      quantity: row.quantity,
      totalPrice: Number(row.total_price),
      status: row.status,
      paymentMethod: row.payment_method || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      orders,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}