import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { confirmOrder } from "@/lib/order-service";

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[stripe/webhook] signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await confirmOrderFromSession(session);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
      default:
        console.log(`[stripe/webhook] unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[stripe/webhook] handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Confirms an order from a Stripe Checkout session.
 * Called by the webhook when Stripe confirms payment.
 */
export async function confirmOrderFromSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe/webhook] no orderId in session metadata for session:", session.id);
    return { success: false, error: "no orderId" };
  }
  return confirmOrder(orderId);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent", paymentIntent.id);

  if (error) {
    console.error("[stripe/webhook] payment_failed update error:", error);
  } else {
    console.log(`[stripe/webhook] order(s) marked payment_failed for payment_intent: ${paymentIntent.id}`);
  }
}
