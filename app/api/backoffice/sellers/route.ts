import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listSellers } from "@/lib/db/collections/sellers";
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
    const verified = searchParams.get("verified");

    const { sellers, total } = await listSellers({
      status: verified === "true" ? "verified" : verified === "false" ? "unverified" : undefined,
      limit,
      offset: (page - 1) * limit,
    });

    // Fetch user info for each seller
    const db = getDB();
    const userIds = [...new Set(sellers.map((s) => s.user_id))];
    const users = await db.collection("users").find({ _id: { $in: userIds.map((id) => new (require("mongodb").ObjectId)(id)) } }).toArray();
    const userMap: Record<string, Record<string, unknown>> = {};
    for (const u of users) {
      userMap[u._id.toString()] = u;
    }

    const mapped = sellers.map((s) => ({
      id: s._id?.toString() ?? "",
      storeName: s.store_name,
      phone: s.phone ?? "",
      verified: s.verified,
      balance: s.balance ?? 0,
      pendingBalance: s.pending_balance ?? 0,
      salesCount: s.sales_count ?? 0,
      rating: s.rating ?? 0,
      createdAt: s.created_at,
      user: {
        id: s.user_id,
        email: (userMap[s.user_id] as Record<string, unknown> | undefined)?.email ?? "",
        name: (userMap[s.user_id] as Record<string, unknown> | undefined)?.name ?? "",
      },
    }));

    return NextResponse.json({ sellers: mapped, total, page, limit });
  } catch (error) {
    console.error("Admin sellers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
