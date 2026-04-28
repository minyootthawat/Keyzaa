import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId, createSeller } from "@/lib/db/collections/sellers";
import { updateUser } from "@/lib/db/collections/users";
import { findUserById } from "@/lib/db/supabase";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    const userId = user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shopName, phone } = await req.json();
    if (!shopName || typeof shopName !== "string" || shopName.trim() === "") {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }
    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    // Check if already registered as seller
    const existingSeller = await getSellerByUserId(userId);
    if (existingSeller) {
      return NextResponse.json({ error: "Already registered as a seller" }, { status: 409 });
    }

    // Get user email for seller record
    const currentUser = await findUserById(userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const storeSlug = slugify(shopName.trim());

    // Create seller record
    const seller = await createSeller({
      userId,
      storeName: shopName.trim(),
      storeSlug,
      phone: phone.trim(),
    });

    // Update user role to 'seller' (or 'both' if already a buyer)
    const newRole = currentUser.role === "buyer" ? "both" : "seller";
    await updateUser(userId, { role: newRole });

    if (!seller) {
      return NextResponse.json({ error: "Failed to create seller" }, { status: 500 });
    }

    return NextResponse.json({
      seller: {
        id: seller.id,
        userId: seller.user_id,
        shopName: seller.store_name,
        phone: seller.phone,
        verified: seller.is_verified,
        createdAt: seller.created_at,
      },
      user: { id: userId, role: newRole },
    }, { status: 201 });
  } catch (error) {
    console.error("Seller register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
