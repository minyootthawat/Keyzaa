import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb/client";
import { ObjectId } from "mongodb";

export async function POST() {
  try {
    const db = getDB();
    const admin = await db.collection("admins").findOne({ email: "admin@keyzaa.local" });
    console.log("Admin doc:", JSON.stringify(admin));

    // Find user by ObjectId
    const userId = admin?.user_id;
    const isObjectId = typeof userId === "string" && /^[a-f\d]{24}$/i.test(userId);
    let user = null;
    if (userId) {
      user = isObjectId
        ? await db.collection("users").findOne({ _id: new ObjectId(userId as string) })
        : await db.collection("users").findOne({ _id: userId as ObjectId });
    }

    return NextResponse.json({
      admin: { email: admin?.email, user_id: admin?.user_id, userIdType: typeof admin?.user_id },
      user: user ? { email: user.email, hasHash: !!user.password_hash, id: user._id } : null,
      emailCheck: { tried: admin?.email, found: null as string | null },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
