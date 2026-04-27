import { NextRequest, NextResponse } from "next/server";
import { confirmOrder } from "@/lib/order-service";

/**
 * Mock confirmation endpoint for demo purposes.
 * Called by the checkout page after the 9-second demo timer expires.
 * It performs the same order confirmation logic as the real Stripe webhook.
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const result = await confirmOrder(orderId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[stripe/mock-confirm] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
