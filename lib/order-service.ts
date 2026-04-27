/**
 * Order service — shared logic for order confirmation.
 * Used by the real Stripe webhook and the demo mock-confirm endpoint.
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { buildLedgerEntries } from "@/lib/marketplace-server";
import { randomUUID } from "node:crypto";

export interface ConfirmOrderResult {
  success: boolean;
  error?: string;
}

export async function confirmOrder(orderId: string): Promise<ConfirmOrderResult> {
  const supabase = createServiceRoleClient();

  const { data: existingOrder, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !existingOrder) {
    console.warn("[order-service] order not found:", orderId);
    return { success: false, error: "order not found" };
  }

  // Idempotency: skip if order is already paid
  if (existingOrder.status === "paid" && existingOrder.payment_status === "paid") {
    console.log(`[order-service] order ${orderId} already paid, skipping`);
    return { success: true };
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
    console.error("[order-service] failed to update order:", updateError);
    return { success: false, error: updateError.message };
  }

  console.log(`[order-service] order ${orderId} marked paid`);

  // Insert seller ledger entries (sale credit + commission fee)
  // Only insert if not already confirmed (avoid double ledger entries on replay)
  const existingLedger = await supabase
    .from("seller_ledger_entries")
    .select("id")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (existingLedger) {
    console.log(`[order-service] ledger entries already exist for order ${orderId}, skipping`);
  } else {
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
        console.error("[order-service] failed to insert ledger entry:", ledgerError);
      }
    }
  }

  return { success: true };
}
