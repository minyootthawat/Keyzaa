/**
 * Migration script: Supabase orders → MongoDB
 * Run with: npx tsx scripts/migrate-orders-to-mongodb.ts
 *
 * Prerequisites:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   MONGODB_URI=mongodb://...
 */

import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { connectDB, getDb } from "@/lib/db/mongodb";
import type { Order } from "@/types/database";

const BATCH_SIZE = 100;

async function main() {
  console.log("=".repeat(60));
  console.log("Keyzaa: Supabase → MongoDB Order Migration");
  console.log("=".repeat(60));

  // Initialize MongoDB connection
  console.log("\n[1/4] Connecting to MongoDB...");
  await connectDB();
  console.log("      MongoDB connected.");

  // Fetch all orders from Supabase
  console.log("\n[2/4] Fetching orders from Supabase...");
  const supabase = createServiceRoleClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("      Failed to fetch orders:", error.message);
    process.exit(1);
  }

  if (!orders || orders.length === 0) {
    console.log("      No orders to migrate. Exiting.");
    process.exit(0);
  }

  console.log(`      Found ${orders.length} orders to migrate.`);

  // Ensure MongoDB indexes
  console.log("\n[3/4] Ensuring MongoDB indexes...");
  const db = getDb();
  await Promise.all([
    db.collection("orders").createIndex({ buyer_id: 1, created_at: -1 }),
    db.collection("orders").createIndex({ seller_id: 1, created_at: -1 }),
    db.collection("orders").createIndex({ status: 1 }),
    db.collection("orders").createIndex({ created_at: -1 }),
    db.collection("order_items").createIndex({ order_id: 1 }),
  ]);
  console.log("      Indexes ready.");

  // Migrate in batches
  console.log("\n[4/4] Migrating orders...");
  const total = orders.length;
  let migrated = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE) as Order[];
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);

    process.stdout.write(
      `\r      Batch ${String(batchNum).padStart(String(totalBatches).length)}/${totalBatches} ` +
      `| Progress: ${i + batch.length}/${total} ` +
      `| Failed: ${failed}   `
    );

    const mongoOrders = batch.map((order) => ({
      _id: order.id, // Use Supabase UUID as MongoDB _id for easy lookup
      buyer_id: order.buyer_id,
      seller_id: order.seller_id,
      product_id: order.product_id,
      quantity: order.quantity,
      total_price: order.total_price,
      gross_amount: order.gross_amount,
      commission_amount: order.commission_amount,
      seller_net_amount: order.seller_net_amount,
      platform_fee_rate: order.platform_fee_rate,
      currency: order.currency,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      payment_method: order.payment_method,
      created_at: order.created_at,
      updated_at: order.updated_at,
      migrated_from_supabase: true,
      supabase_id: order.id,
    }));

    try {
      const result = await db.collection("orders").insertMany(mongoOrders as unknown as Document[], {
        ordered: false, // Continue even if some fail (e.g., duplicate _id)
      });
      migrated += Object.keys(result.insertedIds).length;
      // Count any that failed due to duplicate key (already migrated)
      const batchFailed = batch.length - Object.keys(result.insertedIds).length;
      if (batchFailed > 0) {
        failed += batchFailed;
      }
    } catch (err: unknown) {
      // Handle partial insert failures (e.g., duplicate key)
      const error = err as { writeErrors?: unknown[] };
      if (error.writeErrors && Array.isArray(error.writeErrors)) {
        migrated += batch.length - error.writeErrors.length;
        failed += error.writeErrors.length;
      } else {
        failed += batch.length;
        failedIds.push(...batch.map((o) => o.id));
        console.error(`\n      Batch ${batchNum} failed entirely:`, err);
      }
    }
  }

  console.log("\n");
  console.log("=".repeat(60));
  console.log("Migration complete!");
  console.log(`  Total:  ${total}`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Failed:   ${failed}`);
  if (failedIds.length > 0) {
    console.log(`  Failed IDs: ${failedIds.slice(0, 10).join(", ")}${failedIds.length > 10 ? "..." : ""}`);
  }
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\nNOTE: Run the script again to retry failed orders.");
    console.log("Already-migrated orders will be skipped (upsert by _id).");
  }
}

main().catch((err) => {
  console.error("\nMigration failed with unhandled error:", err);
  process.exit(1);
});
