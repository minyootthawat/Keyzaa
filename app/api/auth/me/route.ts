import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAdminAccessForEmail } from "@/lib/auth/admin";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const users = db.collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const adminAccess = getAdminAccessForEmail(typeof user.email === "string" ? user.email : null);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        sellerId: user.sellerId,
        isAdmin: adminAccess.isAdmin,
        adminRole: adminAccess.adminRole,
        adminPermissions: adminAccess.permissions,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
