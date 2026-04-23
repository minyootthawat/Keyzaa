import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { connectDB, getSellers, countSellers } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface SellerWithUser {
  id: string;
  storeName: string;
  phone: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
}

function mapMongoToSellerWithUser(row: { _id: { toString(): string }; [key: string]: unknown }, user: { id: string; email: string; name: string; created_at: string }): SellerWithUser {
  return {
    id: row._id.toString(),
    storeName: row.store_name as string,
    phone: (row.phone as string) || "",
    verified: Boolean(row.verified),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
    },
  };
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
    const verifiedParam = searchParams.get("verified");

    const filters: { verified?: boolean } = {};
    if (verifiedParam === "true") {
      filters.verified = true;
    } else if (verifiedParam === "false") {
      filters.verified = false;
    }

    const [sellersRows, total] = await Promise.all([
      getSellers(filters, { page, limit }),
      countSellers(filters.verified),
    ]);

    // Fetch user info from Supabase for each seller
    const supabase = createServiceRoleClient();
    const userIds = sellersRows.map((s) => s.user_id as string);
    const { data: userRows } = await supabase
      .from("users")
      .select("id, email, name, created_at")
      .in("id", userIds);

    const userMap: Record<string, { id: string; email: string; name: string; created_at: string }> = {};
    for (const u of userRows ?? []) {
      userMap[u.id] = { id: u.id, email: u.email, name: u.name, created_at: u.created_at };
    }

    const sellers: SellerWithUser[] = sellersRows.map((row) => {
      const userData = userMap[row.user_id as string] ?? { id: row.user_id as string, email: "", name: "", created_at: "" };
      return mapMongoToSellerWithUser(row as { _id: { toString(): string }; [key: string]: unknown }, userData);
    });

    return NextResponse.json({
      sellers,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin sellers list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}