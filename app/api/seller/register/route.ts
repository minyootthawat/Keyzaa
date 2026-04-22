import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      verificationStatus: "verified",
      payoutStatus: "manual",
      responseTimeMinutes: 5,
      fulfillmentRate: 100,
      disputeRate: 0,
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
