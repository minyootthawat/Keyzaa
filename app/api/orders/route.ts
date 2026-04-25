import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getBearerPayload } from "@/lib/auth/jwt";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { buildLedgerEntries, calculateMarketplaceAmounts, deriveOrderState, mapOrderDocument } from "@/lib/marketplace-server";
import type { Order, OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

interface CreateOrderBody {
  totalPrice: number;
  paymentMethod: string;
  items: OrderItem[];
  status?: OrderStatus;
  stripeSessionId?: string;
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

    const supabase = createServiceRoleClient();

    const { data: orderRows, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Supabase orders fetch error:", ordersError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const orders: Order[] = [];

    for (const row of orderRows ?? []) {
      const { data: itemRows, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", row.id);

      if (itemsError) {
        console.error("Supabase order_items fetch error:", itemsError);
        continue;
      }

      const items: OrderItem[] = (itemRows ?? []).map((item) => ({
        id: item.id as string,
        orderId: row.id as string,
        productId: item.product_id as string,
        title: item.title as string,
        titleTh: item.title_th as string | undefined,
        titleEn: item.title_en as string | undefined,
        image: (item.image as string) || "",
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        sellerId: row.seller_id as string,
        keys: [],
        platform: (item.platform as string) || "",
        regionCode: item.region_code as string | undefined,
        activationMethodTh: item.activation_method_th as string | undefined,
        activationMethodEn: item.activation_method_en as string | undefined,
      }));

      orders.push(
        mapOrderDocument({
          orderId: row.id as string,
          buyerId: row.buyer_id as string,
          sellerId: row.seller_id as string,
          date: (row.created_at as string) || new Date().toISOString(),
          status: (row.status as OrderStatus) || "pending",
          paymentStatus: (row.payment_status as PaymentStatus) || "pending",
          fulfillmentStatus: (row.fulfillment_status as FulfillmentStatus) || "pending",
          totalPrice: Number(row.total_price ?? 0),
          grossAmount: Number(row.gross_amount ?? 0),
          commissionAmount: Number(row.commission_amount ?? 0),
          sellerNetAmount: Number(row.seller_net_amount ?? 0),
          platformFeeRate: Number(row.platform_fee_rate ?? 0.12),
          currency: (row.currency as string) || "THB",
          paymentMethod: (row.payment_method as string) || "",
          items,
        })
      );
    }

    return NextResponse.json({ orders });
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

    const supabase = createServiceRoleClient();
    const createdOrders: Order[] = [];

    for (const [sellerId, sellerItems] of groupedItems.entries()) {
      const orderUuid = randomUUID();
      const mappedItems = sellerItems.map((item, index) => ({
        ...item,
        id: item.id || `oi_${randomUUID()}`,
        orderId: orderUuid,
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

      // Insert into orders table
      const { error: orderError } = await supabase.from("orders").insert({
        id: orderUuid,
        buyer_id: userId,
        seller_id: sellerId,
        product_id: mappedItems[0]?.productId ?? null,
        quantity: mappedItems.reduce((s, i) => s + i.quantity, 0),
        total_price: grossAmount,
        gross_amount: financials.grossAmount,
        commission_amount: financials.commissionAmount,
        seller_net_amount: financials.sellerNetAmount,
        platform_fee_rate: financials.platformFeeRate,
        currency: financials.currency,
        status,
        payment_status: state.paymentStatus,
        fulfillment_status: state.fulfillmentStatus,
        payment_method: body.paymentMethod,
        created_at: createdAt,
        updated_at: createdAt,
      });

      if (orderError) {
        console.error("Supabase order insert error:", orderError);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }

      // Insert into order_items table
      for (const item of mappedItems) {
        const { error: itemError } = await supabase.from("order_items").insert({
          id: item.id,
          order_id: orderUuid,
          product_id: item.productId,
          title: item.title,
          title_th: item.titleTh || null,
          title_en: item.titleEn || null,
          image: item.image || null,
          price: item.price,
          quantity: item.quantity,
          platform: item.platform || null,
          region_code: item.regionCode || null,
          activation_method_th: item.activationMethodTh || null,
          activation_method_en: item.activationMethodEn || null,
        });

        if (itemError) {
          console.error("Supabase order_item insert error:", itemError);
        }
      }

      // Insert ledger entries for paid orders
      if (state.paymentStatus === "paid") {
        const entries = buildLedgerEntries({
          sellerId,
          orderId: orderUuid,
          grossAmount: financials.grossAmount,
          commissionAmount: financials.commissionAmount,
          sellerNetAmount: financials.sellerNetAmount,
          createdAt,
        });

        for (const entry of entries) {
          await supabase.from("seller_ledger_entries").insert({
            id: `led_${randomUUID()}`,
            seller_id: sellerId,
            order_id: orderUuid,
            type: entry.type,
            amount: entry.amount,
            description: entry.description || null,
            created_at: createdAt,
          });
        }
      }

      createdOrders.push(
        mapOrderDocument({
          orderId: orderUuid,
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
