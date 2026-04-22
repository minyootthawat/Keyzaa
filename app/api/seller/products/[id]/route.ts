import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const { db } = await connectDB();
    const users = db.collection("users");
    const products = db.collection("products");
    const user = await users.findOne({ _id: new ObjectId(userId) });
    const sellerId = typeof user?.sellerId === "string" ? user.sellerId : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const result = await products.deleteOne({ productId: id, sellerId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seller product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
