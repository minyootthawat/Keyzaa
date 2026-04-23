/**
 * Migration script: Supabase products → MongoDB
 * Run with: npx tsx scripts/migrate-products-to-mongodb.ts
 *
 * Prerequisites:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 *   MONGODB_URI=mongodb://...
 */

import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { connectDB, getDb } from "@/lib/db/mongodb";
import type { Product } from "@/types/database";

const BATCH_SIZE = 100;

async function main() {
  console.log("=".repeat(60));
  console.log("Keyzaa: Supabase → MongoDB Product Migration");
  console.log("=".repeat(60));

  // Initialize MongoDB connection
  console.log("\n[1/4] Connecting to MongoDB...");
  await connectDB();
  console.log("      MongoDB connected.");

  // Fetch all products from Supabase
  console.log("\n[2/4] Fetching products from Supabase...");
  const supabase = createServiceRoleClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("      Failed to fetch products:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log("      No products to migrate. Exiting.");
    process.exit(0);
  }

  console.log(`      Found ${products.length} products to migrate.`);

  // Ensure MongoDB indexes
  console.log("\n[3/4] Ensuring MongoDB indexes...");
  const db = getDb();
  await Promise.all([
    db.collection("products").createIndex({ seller_id: 1 }),
    db.collection("products").createIndex({ category: 1 }),
    db.collection("products").createIndex({ is_active: 1 }),
    db.collection("products").createIndex({ created_at: -1 }),
  ]);
  console.log("      Indexes ready.");

  // Migrate in batches
  console.log("\n[4/4] Migrating products...");
  const total = products.length;
  let migrated = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE) as Product[];
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);

    process.stdout.write(
      `\r      Batch ${String(batchNum).padStart(String(totalBatches).length)}/${totalBatches} ` +
      `| Progress: ${i + batch.length}/${total} ` +
      `| Failed: ${failed}   `
    );

    const mongoProducts = batch.map((product) => ({
      _id: product.id,
      seller_id: product.seller_id,
      name: product.name,
      description: product.description || null,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || null,
      is_active: product.is_active,
      created_at: product.created_at,
      updated_at: product.updated_at,
      migrated_from_supabase: true,
      supabase_id: product.id,
    }));

    try {
      const result = await db.collection("products").insertMany(mongoProducts, {
        ordered: false,
      });
      migrated += Object.keys(result.insertedIds).length;
      const batchFailed = batch.length - Object.keys(result.insertedIds).length;
      if (batchFailed > 0) {
        failed += batchFailed;
      }
    } catch (err: unknown) {
      const error = err as { writeErrors?: unknown[] };
      if (error.writeErrors && Array.isArray(error.writeErrors)) {
        migrated += batch.length - error.writeErrors.length;
        failed += error.writeErrors.length;
      } else {
        failed += batch.length;
        failedIds.push(...batch.map((p) => p.id));
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
    console.log("\nNOTE: Run the script again to retry failed products.");
    console.log("Already-migrated products will be skipped.");
  }
}

main().catch((err) => {
  console.error("\nMigration failed with unhandled error:", err);
  process.exit(1);
});
