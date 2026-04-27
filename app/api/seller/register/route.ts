import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth/server";
import { getSellerByUserId, createSeller } from "@/lib/db/collections/sellers";
import { updateUser } from "@/lib/db/collections/users";

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

    // Create seller record
    const seller = await createSeller({
      userId,
      storeName: shopName.trim(),
      phone: phone.trim(),
    });

    // Get current user to decide whether to set 'seller' or 'both'
    const { findUserById } = await import("@/lib/db/collections/users");
    const currentUser = await findUserById(userId);
    const currentRole = currentUser?.role;
    const newRole = currentRole === "buyer" ? "both" : "seller";

    // Update user role to 'seller' (or 'both' if already a buyer)
    await updateUser(userId, { role: newRole });

    return NextResponse.json({
      seller: {
        id: seller._id!.toString(),
        userId: seller.user_id,
        shopName: seller.store_name,
        phone: seller.phone,
        verified: seller.verified,
        createdAt: seller.created_at,
      },
      user: { id: userId, role: newRole },
    }, { status: 201 });
  } catch (error) {
    console.error("Seller register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
