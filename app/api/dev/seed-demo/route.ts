import { NextResponse } from "next/server";
import { getDB } from "@/lib/mongodb/client";
import bcrypt from "bcryptjs";

const DEMO_USERS = [
  { email: "testbuyer@keyzaa.local", name: "Test Buyer", password: "demo123", role: "buyer" },
  { email: "testseller@keyzaa.local", name: "Test Seller", password: "demo123", role: "seller" },
  { email: "admin@keyzaa.local", name: "Admin", password: "demo123", role: "admin" },
];

export async function GET() {
  try {
    const db = getDB();
    const usersCol = db.collection("users");

    const oldEmails = DEMO_USERS.map((u) => u.email);
    const delResult = await usersCol.deleteMany({ email: { $in: oldEmails } });

    const inserted = [];
    for (const user of DEMO_USERS) {
      const { password, ...rest } = user;
      const password_hash = await bcrypt.hash(password, 10);
      await usersCol.insertOne({ ...rest, password_hash, createdAt: new Date(), updatedAt: new Date() });
      inserted.push(user.email);
    }

    // Ensure seller record for testseller
    const existingSeller = await db.collection("sellers").findOne({ email: "testseller@keyzaa.local" });
    if (!existingSeller) {
      await db.collection("sellers").insertOne({
        email: "testseller@keyzaa.local",
        name: "Test Seller Shop",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, deleted: delResult.deletedCount, inserted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
