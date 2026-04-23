import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { findUserById } from "@/lib/db/supabase";
import { getAdminAccessForEmail } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const adminAccess = getAdminAccessForEmail(user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: (user as unknown as { role?: string }).role ?? "buyer",
        sellerId: (user as unknown as { seller_id?: string }).seller_id ?? null,
        isAdmin: adminAccess.isAdmin,
        adminRole: adminAccess.adminRole,
        adminPermissions: adminAccess.permissions,
        createdAt: user.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
