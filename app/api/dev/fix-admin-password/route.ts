import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb/client";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const db = getDB();
    const newHash = await bcrypt.hash("demo123", 10);
    const result = await db.collection("users").updateOne(
      { email: "admin@keyzaa.local" },
      { $set: { password_hash: newHash } }
    );
    return NextResponse.json({
      success: true,
      modified: result.modifiedCount,
      hashPrefix: newHash.substring(0, 15),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
