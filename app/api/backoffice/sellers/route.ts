import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface SellerWithUser {
  id: string;
  storeName: string;
  phone: string;
  verified: boolean;
  balance: number;
  pendingBalance: number;
  salesCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
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
      console.error("Sellers query error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const sellers: SellerWithUser[] = (rows ?? []).map(
      (row: Record<string, unknown>) => ({
        id: row.id as string,
        storeName: (row.store_name as string) ?? "",
        phone: (row.phone as string) ?? "",
        verified: Boolean(row.verified),
        balance: Number(row.balance ?? 0),
        pendingBalance: Number(row.pending_balance ?? 0),
        salesCount: Number(row.sales_count ?? 0),
        rating: Number(row.rating ?? 0),
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        user: {
          id: (row.users as { id: string } | null)?.id ?? (row.user_id as string),
          email: (row.users as { email: string } | null)?.email ?? "",
          name: (row.users as { name: string } | null)?.name ?? "",
          createdAt:
            (row.users as { created_at: string } | null)?.created_at ?? (row.created_at as string),
        },
      })
    );

    return NextResponse.json({ sellers, total: count ?? 0, page, limit });
  } catch (error) {
    console.error("Admin sellers list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
