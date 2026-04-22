import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectDB } from "@/lib/db/mongodb";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const { db } = await connectDB();
    const sellers = db.collection("sellers");

    const seller = await sellers.findOne({ userId });
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    return NextResponse.json({
      seller: {
        id: seller._id.toString(),
        userId: seller.userId,
        shopName: seller.shopName,
        phone: seller.phone,
        rating: seller.rating,
        salesCount: seller.salesCount,
        balance: seller.balance,
        pendingBalance: seller.pendingBalance,
        createdAt: seller.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}