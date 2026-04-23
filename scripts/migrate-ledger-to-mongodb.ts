/**
 * Migration script: Supabase seller_ledger_entries → MongoDB
 * Run with: npx tsx scripts/migrate-ledger-to-mongodb.ts
 *
 * Prerequisites:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   MONGODB_URI=mongodb://...
 */

import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { connectDB, getDb } from "@/lib/db/mongodb";

const BATCH_SIZE = 100;

async function main() {
  console.log("=".repeat(60));
  console.log("Keyzaa: Supabase → MongoDB Ledger Entry Migration");
  console.log("=".repeat(60));

  // Initialize MongoDB connection
  console.log("\n[1/4] Connecting to MongoDB...");
  await connectDB();
  console.log("      MongoDB connected.");

  // Fetch all ledger entries from Supabase
  console.log("\n[2/4] Fetching ledger entries from Supabase...");
  const supabase = createServiceRoleClient();
  const { data: entries, error } = await supabase
    .from("seller_ledger_entries")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("      Failed to fetch ledger entries:", error.message);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log("      No ledger entries to migrate. Exiting.");
    process.exit(0);
  }

  console.log(`      Found ${entries.length} ledger entries to migrate.`);

  // Ensure MongoDB indexes
  console.log("\n[3/4] Ensuring MongoDB indexes...");
  const db = getDb();
  await db.collection("seller_ledger_entries").createIndex({ seller_id: 1, created_at: -1 });
  console.log("      Indexes ready.");

  // Migrate in batches
  console.log("\n[4/4] Migrating ledger entries...");
  const total = entries.length;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);

    process.stdout.write(
      `\r      Batch ${String(batchNum).padStart(String(totalBatches).length)}/${totalBatches} ` +
      `| Progress: ${i + batch.length}/${total} ` +
      `| Migrated: ${migrated} | Skipped: ${skipped} | Failed: ${failed}   `
    );

    const mongoEntries = batch.map((entry) => ({
      _id: entry.id, // Use Supabase UUID as MongoDB _id for upsert
      seller_id: entry.seller_id,
      type: entry.type,
      amount: entry.amount,
      order_id: entry.order_id ?? null,
      description: entry.description ?? null,
      created_at: entry.created_at,
      migrated_from_supabase: true,
      supabase_id: entry.id,
    }));

    try {
      // Upsert each entry individually for idempotency
      for (const mongoEntry of mongoEntries) {
        const result = await db.collection("seller_ledger_entries").updateOne(
          { _id: mongoEntry._id },
          { $setOnInsert: mongoEntry },
          { upsert: true }
        );
        if (result.upsertedCount) {
          migrated++;
        } else {
          skipped++;
        }
      }
    } catch (err: unknown) {
      failed += batch.length;
      failedIds.push(...batch.map((e) => e.id as string));
      console.error(`\n      Batch ${batchNum} failed:`, err);
    }
  }

  console.log("\n");
  console.log("=".repeat(60));
  console.log("Migration complete!");
  console.log(`  Total:   ${total}`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Failed:   ${failed}`);
  if (failedIds.length > 0) {
    console.log(`  Failed IDs: ${failedIds.slice(0, 10).join(", ")}${failedIds.length > 10 ? "..." : ""}`);
  }
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\nNOTE: Run the script again to retry failed entries.");
    console.log("Already-migrated entries will be skipped (upsert by _id).");
  }
}

main().catch((err) => {
  console.error("\nMigration failed with unhandled error:", err);
  process.exit(1);
});