import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { connectDB } from "@/lib/db/mongodb";
import { getSellersByIds } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

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

export async function GET(req: NextRequest) {
  try {
    const access = await getAdminAccessFromRequest(req);
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status");
    const sellerId = searchParams.get("sellerId");
    const buyerId = searchParams.get("buyerId");

    const supabase = createServiceRoleClient();
    const { db } = await connectDB();
    const ordersCol = db.collection("orders");

    // Build MongoDB filter
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (sellerId) filter.seller_id = sellerId;
    if (buyerId) filter.buyer_id = buyerId;

    // Get total count
    const total = await ordersCol.countDocuments(filter);

    // Get paginated orders
    const documents = await ordersCol
      .find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Collect unique buyer/seller ids for name lookups
    const buyerIds = [...new Set(documents.map((d) => d.buyer_id as string))];
    const sellerIds = [...new Set(documents.map((d) => d.seller_id as string))];

    // Batch fetch buyer names from Supabase
    const { data: buyerRows } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", buyerIds);

    const buyerMap: Record<string, { name: string; email: string }> = {};
    for (const u of buyerRows ?? []) {
      buyerMap[u.id] = { name: u.name, email: u.email };
    }

    const sellersFromMongo = await getSellersByIds(sellerIds) as { _id: { toString(): string }; store_name: string }[];
    const sellerMap: Record<string, string> = {};
    for (const s of sellersFromMongo) {
      sellerMap[s._id.toString()] = s.store_name;
    }

    const orders: OrderWithDetails[] = documents.map((row) => ({
      id: row._id.toString(),
      buyerId: row.buyer_id as string,
      buyerName: buyerMap[row.buyer_id as string]?.name ?? "",
      buyerEmail: buyerMap[row.buyer_id as string]?.email ?? "",
      sellerId: row.seller_id as string,
      sellerStoreName: sellerMap[row.seller_id as string] ?? "",
      productId: (row.product_id as string) ?? "",
      productName: "",
      quantity: Number(row.quantity ?? 1),
      totalPrice: Number(row.total_price ?? 0),
      status: row.status as string,
      paymentMethod: (row.payment_method as string) ?? "",
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
