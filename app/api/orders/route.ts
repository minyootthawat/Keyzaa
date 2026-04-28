import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { getOrdersByBuyer, createOrder } from "@/lib/db/collections/orders";
import { createLedgerEntry } from "@/lib/db/collections/ledger";
import { buildLedgerEntries, deriveOrderState, mapOrderDocument } from "@/lib/marketplace-server";
import type { OrderItem as DbOrderItem } from "@/lib/db/collections/orders";
import type { OrderStatus, PaymentStatus, FulfillmentStatus, OrderItem, Order } from "@/app/types";

interface CreateOrderBody {
  totalPrice: number;
  paymentMethod: string;
  items: ClientOrderItem[];
}

interface ClientOrderItem {
  sellerId: string;
  id?: string;
  productId?: string;
  title: string;
  titleTh?: string;
  titleEn?: string;
  image?: string;
  price: number;
  quantity?: number;
  platform?: string;
  regionCode?: string;
  activationMethodTh?: string;
  activationMethodEn?: string;
}

function groupItemsBySeller(items: ClientOrderItem[]) {
  const grouped = new Map<string, ClientOrderItem[]>();

  for (const item of items) {
    const sellerItems = grouped.get(item.sellerId) || [];
    sellerItems.push(item);
    grouped.set(item.sellerId, sellerItems);
  }

  return grouped;
}

function buildOrderItem(dbItem: DbOrderItem, orderId: string, sellerId: string): OrderItem {
  return {
    id: dbItem.product_id,
    orderId,
    productId: dbItem.product_id,
    sellerId,
    title: dbItem.title,
    titleTh: dbItem.title_th,
    titleEn: dbItem.title_en,
    image: dbItem.image || "",
    price: dbItem.price,
    quantity: dbItem.quantity,
    keys: [],
    platform: dbItem.platform || "",
    regionCode: dbItem.region_code,
    activationMethodTh: dbItem.activation_method_th,
    activationMethodEn: dbItem.activation_method_en,
  };
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderRows = await getOrdersByBuyer(userId);

    const orders = orderRows.map((row) => {
      const orderId = row.id!;
      const items: OrderItem[] = row.items.map((item) =>
        buildOrderItem(item, orderId, row.seller_id!)
      );
      return mapOrderDocument({
        orderId,
        buyerId: row.buyer_id!,
        sellerId: row.seller_id!,
        date: row.created_at,
        status: row.status as OrderStatus,
        paymentStatus: row.payment_status as PaymentStatus,
        fulfillmentStatus: row.fulfillment_status as FulfillmentStatus,
        totalPrice: row.total_price,
        grossAmount: row.gross_amount,
        commissionAmount: row.commission_amount,
        sellerNetAmount: row.seller_net_amount,
        platformFeeRate: row.platform_fee_rate,
        currency: row.currency,
        paymentMethod: row.payment_method || "",
        items,
      });
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateOrderBody;

    if (!Array.isArray(body.items) || body.items.length === 0 || typeof body.totalPrice !== "number" || !body.paymentMethod) {
      return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
    }

    const status: OrderStatus = "delivered";
    const groupedItems = groupItemsBySeller(body.items);
    const createdAt = new Date().toISOString();

    const createdOrders: Order[] = [];
    const groupedEntries = Array.from(groupedItems.entries());

    for (const [sellerId, sellerItems] of groupedEntries) {
      const dbItems: DbOrderItem[] = sellerItems.map((item, index) => ({
        product_id: item.productId || item.id || `product_${index}`,
        title: item.title || "",
        title_th: item.titleTh,
        title_en: item.titleEn,
        image: item.image,
        price: item.price,
        quantity: item.quantity || 1,
        platform: item.platform,
        region_code: item.regionCode,
        activation_method_th: item.activationMethodTh,
        activation_method_en: item.activationMethodEn,
      }));

      const grossAmount = dbItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const commissionAmount = Math.round(grossAmount * 0.05 * 100) / 100;
      const sellerNetAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

      const order = await createOrder({
        buyerId: userId,
        sellerId,
        items: dbItems,
        totalPrice: grossAmount,
        paymentMethod: body.paymentMethod,
      });

      if (!order) {
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }

      const orderId = order.id!;
      const state = deriveOrderState(status);

      // Insert ledger entries for paid orders
      if (state.paymentStatus === "paid") {
        const entries = buildLedgerEntries({
          sellerId,
          orderId,
          grossAmount,
          commissionAmount,
          sellerNetAmount,
          createdAt,
        });

        for (const entry of entries) {
          await createLedgerEntry({
            sellerId: entry.sellerId,
            orderId: entry.orderId,
            amount: entry.type === "commission_fee" ? -entry.amount : entry.amount,
            type: entry.type === "sale_credit" ? "sale" : (entry.type as "sale" | "commission_fee" | "withdrawal"),
            description: entry.description,
          });
        }
      }

      const responseItems: OrderItem[] = dbItems.map((item) =>
        buildOrderItem(item, orderId, sellerId)
      );

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
          grossAmount,
          commissionAmount,
          sellerNetAmount,
          platformFeeRate: 0.05,
          currency: "THB",
          paymentMethod: body.paymentMethod,
          items: responseItems,
        })
      );
    }

    return NextResponse.json(
      {
        order: createdOrders[0],
        orders: createdOrders,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
