import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

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

    const supabase = createServiceRoleClient();

    // Check if already registered as seller
    const { data: existingSeller } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingSeller) {
      return NextResponse.json({ error: "Already registered as a seller" }, { status: 409 });
    }

    // Create seller record
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .insert({
        user_id: userId,
        store_name: shopName.trim(),
        phone: phone.trim(),
        verified: false,
      })
      .select()
      .single();

    if (sellerError) {
      console.error("Supabase seller insert error:", sellerError);
      return NextResponse.json({ error: "Failed to register seller" }, { status: 500 });
    }

    // Get current user role to decide whether to set 'seller' or 'both'
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    const currentRole = userData?.role;
    const newRole = currentRole === "buyer" ? "both" : "seller";

    // Update user role to 'seller' (or 'both' if already a buyer)
    const { error: userError } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (userError) {
      console.error("Supabase user update error:", userError);
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }

    return NextResponse.json({
      seller: {
        id: seller.id,
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
