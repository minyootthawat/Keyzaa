import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/db/mongodb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { shopName, phone } = await req.json();
    if (!shopName || !phone) {
      return NextResponse.json(
        { error: "Shop name and phone are required" },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    const sellers = db.collection("sellers");
    const users = db.collection("users");

    const existingSeller = await sellers.findOne({ userId });
    if (existingSeller) {
      return NextResponse.json(
        { error: "Already registered as a seller" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const seller = {
      userId,
      shopName,
      phone,
      rating: 0,
      salesCount: 0,
      balance: 0,
      pendingBalance: 0,
      createdAt: now,
    };

    const result = await sellers.insertOne(seller);
    const sellerId = result.insertedId.toString();

    const newRole = "seller";
    await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role: newRole, sellerId } }
    );

    return NextResponse.json({
      seller: { id: sellerId, ...seller },
      user: { id: userId, role: newRole, sellerId },
    });
  } catch (error) {
    console.error("Seller register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}