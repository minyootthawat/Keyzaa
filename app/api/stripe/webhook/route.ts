import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db/mongodb";

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
  const { db } = await connectDB();
  const orders = db.collection("orders");

  // Try multiple lookup strategies (handles orders created before stripeSessionId was added)
  let result = await orders.findOneAndUpdate(
    { stripe_session_id: session.id },
    {
      $set: {
        status: "paid",
        payment_status: "paid",
        fulfillment_status: "pending",
        paid_at: new Date().toISOString(),
        stripe_payment_intent: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      },
    },
    { returnDocument: "after" }
  );

  if (result) {
    console.log(`[stripe/webhook] order ${result.order_id} marked paid via stripe_session_id`);
    return;
  }

  // Fallback: try stripe_payment_intent
  if (session.payment_intent) {
    result = await orders.findOneAndUpdate(
      { stripe_payment_intent: session.payment_intent as string },
      {
        $set: {
          status: "paid",
          payment_status: "paid",
          fulfillment_status: "pending",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    if (result) {
      console.log(`[stripe/webhook] order ${result.order_id} marked paid via payment_intent`);
      return;
    }
  }

  // Fallback: try buyerId from Stripe metadata
  const buyerId = session.metadata?.buyerId;
  if (buyerId) {
    const pendingOrders = await orders
      .find({ buyer_id: buyerId, payment_status: "pending", status: "pending_payment" })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    if (pendingOrders.length > 0) {
      const order = pendingOrders[0];
      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            status: "paid",
            payment_status: "paid",
            fulfillment_status: "pending",
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }
      );
      console.log(`[stripe/webhook] order ${order.order_id} marked paid via buyerId fallback`);
      return;
    }
  }

  console.warn("[stripe/webhook] no matching order found for session:", session.id);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { db } = await connectDB();
  const orders = db.collection("orders");

  const result = await orders.updateMany(
    { stripe_payment_intent: paymentIntent.id },
    {
      $set: {
        status: "payment_failed",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`[stripe/webhook] ${result.modifiedCount} order(s) marked payment_failed`);
  }
}
