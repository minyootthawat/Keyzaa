import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { getDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
    const filterParam = searchParams.get("filter") ?? "all";
    const search = searchParams.get("search") ?? "";

    const db = getDB();
    const query: Record<string, unknown> = {};

    if (filterParam === "active") {
      query.status = "active";
    } else if (filterParam === "inactive") {
      query.status = "inactive";
    }

    if (search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      db.collection("products").find(query).sort({ created_at: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("products").countDocuments(query),
    ]);

    // Fetch seller store names
    const sellerIds = [...new Set(products.map((p) => p.seller_id))];
    const sellers = await db.collection("sellers").find({ _id: { $in: sellerIds.map((id) => new (require("mongodb")).ObjectId(id)) } }).toArray();
    const sellerMap: Record<string, Record<string, unknown>> = {};
    for (const s of sellers) {
      sellerMap[s._id.toString()] = s;
    }

    const mapped = products.map((p) => ({
      id: p._id?.toString() ?? "",
      name: p.name,
      price: p.price ?? 0,
      isActive: p.is_active,
      stockQuantity: p.stock ?? 0,
      createdAt: p.created_at,
      seller: {
        id: p.seller_id,
        storeName: (sellerMap[p.seller_id] as Record<string, unknown> | undefined)?.store_name ?? "",
      },
    }));

    return NextResponse.json({ products: mapped, total, page, limit });
  } catch (error) {
    console.error("Admin products GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
