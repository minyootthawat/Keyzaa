import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listSellers } from "@/lib/db/collections/sellers";
import { findUserById } from "@/lib/db/supabase";

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

    // verified=true/false query param maps to is_verified boolean filter
    const isVerified =
      verified === "true" ? true : verified === "false" ? false : undefined;

    const { sellers, total } = await listSellers({
      isVerified,
      limit,
      offset: (page - 1) * limit,
    });

    // Fetch user info for each seller from Supabase
    const sellersWithUsers = await Promise.all(
      sellers.map(async (s) => {
        const user = s.user_id ? await findUserById(s.user_id) : null;
        return {
          id: s.id,
          storeName: s.store_name,
          storeSlug: s.store_slug,
          description: s.description ?? "",
          avatarUrl: s.avatar_url ?? "",
          phone: s.phone ?? "",
          idCardUrl: s.id_card_url ?? "",
          status: s.status,
          verified: s.is_verified,
          balance: s.balance ?? 0,
          pendingBalance: s.pending_balance ?? 0,
          salesCount: s.total_sales ?? 0,
          rating: s.rating ?? 0,
          createdAt: s.created_at,
          user: {
            id: s.user_id,
            email: user?.email ?? "",
            name: user?.name ?? "",
          },
        };
      })
    );

    return NextResponse.json({ sellers: sellersWithUsers, total, page, limit });
  } catch (error) {
    console.error("Admin sellers GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
