import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getSellerByIdFromDb, mapOrderDocument } from "@/lib/marketplace-server";
import type { OrderItem, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/app/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = createServiceRoleClient();

    // Fetch the order
    const { data: orderRow, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("buyer_id", userId)
      .single();

    if (orderError || !orderRow) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch order items
    const { data: itemRows, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    if (itemsError) {
      console.error("Supabase order_items fetch error:", itemsError);
    }

    const items: OrderItem[] = (itemRows ?? []).map((item) => ({
      id: item.id as string,
      orderId: orderRow.id as string,
      productId: item.product_id as string,
      title: item.title as string,
      titleTh: item.title_th as string | undefined,
      titleEn: item.title_en as string | undefined,
      image: (item.image as string) || "",
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      sellerId: orderRow.seller_id as string,
      keys: [],
      platform: (item.platform as string) || "",
      regionCode: item.region_code as string | undefined,
      activationMethodTh: item.activation_method_th as string | undefined,
      activationMethodEn: item.activation_method_en as string | undefined,
    }));

    // Fetch seller info
    const sellerId = orderRow.seller_id as string;
    const { data: sellerRow } = await supabase
      .from("sellers")
      .select("store_name, verified, rating, sales_count")
      .eq("id", sellerId)
      .single();

    const dbSeller = await getSellerByIdFromDb(sellerId);

    return NextResponse.json({
      order: mapOrderDocument({
        orderId: orderRow.id as string,
        buyerId: orderRow.buyer_id as string,
        sellerId,
        date: (orderRow.created_at as string) || new Date().toISOString(),
        status: (orderRow.status as OrderStatus) || "pending",
        paymentStatus: (orderRow.payment_status as PaymentStatus) || "pending",
        fulfillmentStatus: (orderRow.fulfillment_status as FulfillmentStatus) || "pending",
        totalPrice: Number(orderRow.total_price ?? 0),
        grossAmount: Number(orderRow.gross_amount ?? 0),
        commissionAmount: Number(orderRow.commission_amount ?? 0),
        sellerNetAmount: Number(orderRow.seller_net_amount ?? 0),
        platformFeeRate: Number(orderRow.platform_fee_rate ?? 0.12),
        currency: (orderRow.currency as string) || "THB",
        paymentMethod: (orderRow.payment_method as string) || "",
        items,
      }),
      seller: {
        id: sellerId,
        shopName:
          (sellerRow?.store_name as string | undefined) ||
          dbSeller?.shopName ||
          sellerId,
        verificationStatus:
          (sellerRow?.verified === true ? "verified" : undefined) ||
          dbSeller?.verificationStatus ||
          "verified",
        rating: (sellerRow?.rating as number | undefined) || dbSeller?.rating || 0,
        salesCount: (sellerRow?.sales_count as number | undefined) || dbSeller?.salesCount || 0,
      },
    });
  } catch (error) {
    console.error("Order detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
