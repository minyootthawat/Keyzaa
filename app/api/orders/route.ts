import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getBearerPayload } from "@/lib/auth/jwt";
import { connectDB } from "@/lib/db/mongodb";
import { buildLedgerEntries, calculateMarketplaceAmounts, deriveOrderState, mapOrderDocument } from "@/lib/marketplace-server";
import type { Order, OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

interface CreateOrderBody {
  totalPrice: number;
  paymentMethod: string;
  items: OrderItem[];
  status?: OrderStatus;
}

function groupItemsBySeller(items: OrderItem[]) {
  const grouped = new Map<string, OrderItem[]>();

  for (const item of items) {
    const sellerItems = grouped.get(item.sellerId) || [];
    sellerItems.push(item);
    grouped.set(item.sellerId, sellerItems);
  }

  return grouped;
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectDB();
    const orders = db.collection("orders");

    const documents = await orders.find({ buyerId: userId }).sort({ date: -1 }).toArray();

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
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateOrderBody;

    if (!Array.isArray(body.items) || body.items.length === 0 || typeof body.totalPrice !== "number" || !body.paymentMethod) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const status = body.status || "delivered";
    const groupedItems = groupItemsBySeller(body.items);
    const createdAt = new Date().toISOString();

    const { db } = await connectDB();
    const orders = db.collection("orders");
    const ledgerEntries = db.collection("seller_ledger_entries");
    const createdOrders: Order[] = [];

    for (const [sellerId, sellerItems] of groupedItems.entries()) {
      const orderId = `ord_${Date.now()}_${sellerId.replace(/[^a-zA-Z0-9]/g, "").slice(-8)}`;
      const mappedItems = sellerItems.map((item, index) => ({
        ...item,
        id: item.id || `oi_${randomUUID()}`,
        orderId,
        keys: Array.isArray(item.keys) ? item.keys : [],
        quantity: item.quantity || 1,
        image: item.image,
        price: item.price,
        productId: item.productId || item.id || `product_${index}`,
        sellerId: item.sellerId,
        title: item.title,
        platform: item.platform,
      }));

      const grossAmount = mappedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const financials = calculateMarketplaceAmounts(grossAmount);
      const state = deriveOrderState(status);

      const orderDocument = {
        orderId,
        buyerId: userId,
        sellerId,
        date: createdAt,
        status,
        paymentStatus: state.paymentStatus,
        fulfillmentStatus: state.fulfillmentStatus,
        totalPrice: grossAmount,
        grossAmount: financials.grossAmount,
        commissionAmount: financials.commissionAmount,
        sellerNetAmount: financials.sellerNetAmount,
        platformFeeRate: financials.platformFeeRate,
        currency: financials.currency,
        paymentMethod: body.paymentMethod,
        items: mappedItems,
        createdAt,
        updatedAt: createdAt,
      };

      await orders.insertOne(orderDocument);

      const entries = buildLedgerEntries({
        sellerId,
        orderId,
        grossAmount: financials.grossAmount,
        commissionAmount: financials.commissionAmount,
        sellerNetAmount: financials.sellerNetAmount,
        createdAt,
      });

      if (state.paymentStatus === "paid") {
        await ledgerEntries.insertMany(
          entries.map((entry) => ({
            ...entry,
            entryId: `led_${randomUUID()}`,
          }))
        );
      }

      createdOrders.push(
        mapOrderDocument({
          orderId,
          buyerId: userId,
          sellerId,
          date: createdAt,
          status,
          paymentStatus: state.paymentStatus,
          fulfillmentStatus: state.fulfillmentStatus,
          totalPrice: grossAmount,
          grossAmount: financials.grossAmount,
          commissionAmount: financials.commissionAmount,
          sellerNetAmount: financials.sellerNetAmount,
          platformFeeRate: financials.platformFeeRate,
          currency: financials.currency,
          paymentMethod: body.paymentMethod,
          items: mappedItems,
        })
      );
    }

    return NextResponse.json({
      order: createdOrders[0],
      orders: createdOrders,
    });
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
