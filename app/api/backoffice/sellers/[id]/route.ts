import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { getSellerById, updateSeller } from "@/lib/db/collections/sellers";
import { getDB } from "@/lib/mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const seller = await getSellerById(id);

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const db = getDB();
    const user = await db.collection("users").findOne({ _id: new (require("mongodb").ObjectId)(seller.user_id) });

    return NextResponse.json({
      seller: {
        id: seller._id?.toString() ?? "",
        storeName: seller.store_name,
        phone: seller.phone ?? "",
        verified: seller.verified,
        balance: seller.balance ?? 0,
        pendingBalance: seller.pending_balance ?? 0,
        salesCount: seller.sales_count ?? 0,
        rating: seller.rating ?? 0,
        createdAt: seller.created_at,
        user: {
          id: seller.user_id,
          email: (user as Record<string, unknown> | null)?.email ?? "",
          name: (user as Record<string, unknown> | null)?.name ?? "",
        },
      },
    });
  } catch (error) {
    console.error("Admin seller GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const verified = action === "approve";
    const updated = await updateSeller(id, { verified });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }

    return NextResponse.json({ seller: updated });
  } catch (error) {
    console.error("Admin seller PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
