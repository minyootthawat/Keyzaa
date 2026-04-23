import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";

interface DbSeller {
  id: string;
  user_id: string;
  store_name: string;
  phone: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface DbUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

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

async function verifyAdmin(req: NextRequest): Promise<{ authorized: boolean; error?: string; status?: number }> {

function mapDbToSellerWithUser(row: DbSeller, user: DbUser): SellerWithUser {
  return {
    id: row.id,
    storeName: row.store_name,
    phone: row.phone || "",
    verified: row.verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
    const check = await verifyAdmin(req);
    if (!check.authorized) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const verifiedParam = searchParams.get("verified");

    const supabase = createServiceRoleClient();

    let query = supabase
      .from("sellers")
      .select("*, users(id, email, name, created_at)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (verifiedParam === "true") {
      query = query.eq("verified", true);
    } else if (verifiedParam === "false") {
      query = query.eq("verified", false);
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const sellers: SellerWithUser[] = (rows as (DbSeller & { users: DbUser })[]).map((row) =>
      mapDbToSellerWithUser(row, row.users)
    );

    return NextResponse.json({
      sellers,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin sellers list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}