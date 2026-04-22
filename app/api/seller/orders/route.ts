import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { mapOrderDocument } from "@/lib/marketplace-server";
import type { OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const users = db.collection("users");
    const orders = db.collection("orders");
    const user = await users.findOne({ _id: new ObjectId(userId) });

    const sellerId = typeof user?.sellerId === "string" ? user.sellerId : null;

    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const documents = await orders.find({ sellerId }).sort({ date: -1 }).toArray();

    return NextResponse.json({
      orders: documents.map((document) =>
        mapOrderDocument({
          orderId: document.orderId as string,
          buyerId: document.buyerId as string,
          sellerId: document.sellerId as string,
          date: document.date as string,
          status: document.status as OrderStatus,
          paymentStatus: document.paymentStatus as PaymentStatus,
          fulfillmentStatus: document.fulfillmentStatus as FulfillmentStatus,
          totalPrice: document.totalPrice as number,
          grossAmount: document.grossAmount as number,
          commissionAmount: document.commissionAmount as number,
          sellerNetAmount: document.sellerNetAmount as number,
          platformFeeRate: document.platformFeeRate as number,
          currency: document.currency as string,
          paymentMethod: document.paymentMethod as string,
          items: document.items as OrderItem[],
        })
      ),
    });
  } catch (error) {
    console.error("Seller orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
