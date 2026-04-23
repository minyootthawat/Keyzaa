import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getBearerPayload } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const payload = await getBearerPayload(req);
    const userId = typeof payload?.userId === "string" ? payload.userId : null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get seller id from user_id
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const sellerId = seller.id;

    // Fetch orders for this seller with buyer info
    const { data: orderRows, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        buyer_id,
        total_price,
        status,
        payment_status,
        fulfillment_status,
        currency,
        payment_method,
        created_at,
        order_items (
          id,
          product_id,
          title,
          title_th,
          title_en,
          image,
          price,
          quantity,
          platform,
          region_code,
          activation_method_th,
          activation_method_en
        )
      `)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Supabase orders error:", ordersError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Fetch buyer names
    const buyerIds = [...new Set((orderRows ?? []).map((o: Record<string, unknown>) => o.buyer_id as string))];
    const { data: buyerRows } = await supabase
      .from("users")
      .select("id, name")
      .in("id", buyerIds);

    const buyerMap: Record<string, string> = {};
    for (const u of buyerRows ?? []) {
      buyerMap[u.id] = u.name;
    }

    const orders = (orderRows ?? []).map((order: Record<string, unknown>) => {
      const items = (order.order_items as Record<string, unknown>[] ?? []).map((item: Record<string, unknown>) => ({
        id: item.id,
        orderId: order.id,
        productId: item.product_id,
        title: item.title ?? "",
        titleTh: item.title_th ?? undefined,
        titleEn: item.title_en ?? undefined,
        image: item.image ?? "",
        price: Number(item.price),
        quantity: Number(item.quantity),
        sellerId: sellerId,
        keys: [],
        platform: item.platform ?? "",
        regionCode: item.region_code ?? undefined,
        activationMethodTh: item.activation_method_th ?? undefined,
        activationMethodEn: item.activation_method_en ?? undefined,
      }));

      return {
        id: order.id,
        orderId: order.id,
        buyerId: order.buyer_id,
        buyerName: buyerMap[order.buyer_id as string] ?? "Unknown",
        date: order.created_at,
        status: order.status,
        paymentStatus: order.payment_status,
        fulfillmentStatus: order.fulfillment_status,
        totalPrice: Number(order.total_price),
        grossAmount: 0,
        commissionAmount: 0,
        sellerNetAmount: 0,
        platformFeeRate: 0.05,
        currency: order.currency ?? "THB",
        paymentMethod: order.payment_method ?? "",
        items,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Seller orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
