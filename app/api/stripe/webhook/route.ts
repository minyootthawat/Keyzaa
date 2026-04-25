import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { buildLedgerEntries } from "@/lib/marketplace-server";
import { randomUUID } from "node:crypto";

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
        await handleCheckoutCompleted(session);
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceRoleClient();

  // Primary: look up order by ID stored in Stripe metadata
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe/webhook] no orderId in session metadata for session:", session.id);
    return;
  }

  const { data: existingOrder, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !existingOrder) {
    console.warn("[stripe/webhook] order not found:", orderId);
    return;
  }

  // Update order status to paid
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "paid",
      fulfillment_status: "pending",
      updated_at: now,
    })
    .eq("id", orderId);

  if (updateError) {
    console.error("[stripe/webhook] failed to update order:", updateError);
    return;
  }

  console.log(`[stripe/webhook] order ${orderId} marked paid`);

  // Insert seller ledger entries (sale credit + commission fee)
  const grossAmount = Number(existingOrder.gross_amount) || Number(existingOrder.total_price) || 0;
  const commissionAmount = Number(existingOrder.commission_amount) || 0;
  const sellerNetAmount = Number(existingOrder.seller_net_amount) || grossAmount;

  const ledgerEntries = buildLedgerEntries({
    sellerId: existingOrder.seller_id,
    orderId,
    grossAmount,
    commissionAmount,
    sellerNetAmount,
    createdAt: now,
  });

  for (const entry of ledgerEntries) {
    const entryType = entry.type === "sale_credit" ? "sale" : entry.type;
    const { error: ledgerError } = await supabase.from("seller_ledger_entries").insert({
      id: `led_${randomUUID()}`,
      seller_id: entry.sellerId,
      order_id: entry.orderId,
      type: entryType,
      amount: entry.amount,
      description: entry.description || null,
      created_at: entry.createdAt,
    });

    if (ledgerError) {
      console.error("[stripe/webhook] failed to insert ledger entry:", ledgerError);
    }
  }
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
