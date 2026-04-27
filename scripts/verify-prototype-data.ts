/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * verify-prototype-data.ts
 *
 * Verifies that the prototype seed data is present and correct in Supabase.
 * Run: npx tsx scripts/verify-prototype-data.ts
 */

const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const val = trimmed.slice(sep + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

function createSupabaseClient() {
  loadEnv();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const key = rawKey.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key);
}

interface VerifyResult {
  passed: boolean;
  label: string;
  detail: string;
}

const DEMO_EMAILS = [
  "admin@demo.keyzaa.local",
  "buyer@demo.keyzaa.local",
  "seller@demo.keyzaa.local",
  "seller2@demo.keyzaa.local",
  "seller3@demo.keyzaa.local",
];

const SEEDED_SELLER_STORE_NAMES = [
  "Demo Seller Shop",
  "Neon Game Shop",
  "Fast Topup Store",
];

async function getDemoUserIds(supabase: ReturnType<typeof createClient>): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("users")
    .select("id, email")
    .in("email", DEMO_EMAILS);

  const map: Record<string, string> = {};
  for (const u of data ?? []) {
    map[u.email] = u.id;
  }
  return map;
}

async function verifyUsers(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  const { data, error, count } = await supabase
    .from("users")
    .select("*", { count: "exact" })
    .in("email", DEMO_EMAILS);

  if (error) return { passed: false, label: "users table", detail: error.message };
  if (!data || count === null) return { passed: false, label: "users table", detail: "No data returned" };

  const emails = data.map((u: { email: string }) => u.email).sort();
  const missing = DEMO_EMAILS.slice().sort().filter((e) => !emails.includes(e));

  if (missing.length > 0) {
    return { passed: false, label: "users table", detail: `Missing users: ${missing.join(", ")}` };
  }

  const passwordsOk = data.every((u: { password_hash: string | null }) => u.password_hash && u.password_hash.startsWith("$2"));
  if (!passwordsOk) {
    return { passed: false, label: "users.password_hash", detail: "Some users are missing password hashes" };
  }

  return { passed: true, label: "users table", detail: `${count} demo users found with valid password hashes` };
}

async function verifySellers(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  const { data, error, count } = await supabase
    .from("sellers")
    .select("*", { count: "exact" });

  if (error) return { passed: false, label: "sellers table", detail: error.message };
  if (!data || count === null) return { passed: false, label: "sellers table", detail: "No data returned" };

  const verified = data.filter((s: { verified: boolean }) => s.verified).length;
  const unverified = data.length - verified;
  const storeNames = data.map((s: { store_name: string }) => s.store_name).join(", ");

  return {
    passed: true,
    label: "sellers table",
    detail: `${count} sellers (${verified} verified, ${unverified} unverified): ${storeNames}`,
  };
}

async function verifyProducts(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  const { data, error, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("listing_status", "active");

  if (error) return { passed: false, label: "products table", detail: error.message };
  if (!data || count === null) return { passed: false, label: "products table", detail: "No data returned" };

  const categories = Array.from(new Set(data.map((p: { category: string }) => p.category)));
  const prices = data.map((p: { price: number }) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    passed: true,
    label: "products table",
    detail: `${count} active products across ${categories.length} categories (${categories.join(", ")}), price range ฿${minPrice}–${maxPrice}`,
  };
}

async function verifyGameAccounts(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  const { data, error, count } = await supabase
    .from("game_accounts")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (error) return { passed: false, label: "game_accounts table", detail: error.message };
  if (!data || count === null || count === 0) {
    return { passed: true, label: "game_accounts table", detail: "0 game accounts (may be normal for fresh DB)" };
  }

  const games = Array.from(new Set(data.map((a: { game_name: string }) => a.game_name)));
  const prices = data.map((a: { price: number }) => a.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    passed: true,
    label: "game_accounts table",
    detail: `${count} active accounts for ${games.join(", ")}, price range ฿${minPrice}–${maxPrice}`,
  };
}

async function verifyOrders(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  const { data, error, count } = await supabase
    .from("orders")
    .select("*", { count: "exact" });

  if (error) return { passed: false, label: "orders table", detail: error.message };
  if (!data || count === null || count === 0) {
    return { passed: true, label: "orders table", detail: "0 orders (may be normal for fresh DB)" };
  }

  const statuses = data.reduce(
    (acc: Record<string, number>, o: { status: string }) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusStr = Object.entries(statuses).map(([s, c]) => `${c} ${s}`).join(", ");

  return { passed: true, label: "orders table", detail: `${count} orders: ${statusStr}` };
}

async function verifySellerProductLink(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  // Only verify sellers that belong to our seeded demo users
  const userIdMap = await getDemoUserIds(supabase);
  const demoUserIds = Object.values(userIdMap);

  if (demoUserIds.length === 0) {
    return { passed: false, label: "seller→product link", detail: "No demo users found" };
  }

  const { data: sellers, error } = await supabase
    .from("sellers")
    .select("id, store_name, user_id")
    .in("store_name", SEEDED_SELLER_STORE_NAMES);

  if (error || !sellers) {
    return { passed: false, label: "seller→product link", detail: error?.message ?? "No sellers" };
  }

  // Verify each of our seeded sellers has at least one active product
  for (const seller of sellers as Array<{ id: string; store_name: string; user_id: string }>) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("seller_id", seller.id)
      .eq("listing_status", "active");

    if (!count || count === 0) {
      return {
        passed: false,
        label: "seller→product link",
        detail: `Seller "${seller.store_name}" (${seller.user_id}) has no active products`,
      };
    }
  }

  return { passed: true, label: "seller→product link", detail: `All ${sellers.length} seeded sellers have active products` };
}

async function verifyOrderLinks(supabase: ReturnType<typeof createClient>): Promise<VerifyResult> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, buyer_id, seller_id, product_id");

  if (error) return { passed: false, label: "order links", detail: error.message };
  if (!orders || orders.length === 0) {
    return { passed: true, label: "order links", detail: "No orders to verify (normal for fresh DB)" };
  }

  for (const order of orders as Array<{ id: string; buyer_id: string; seller_id: string; product_id: string }>) {
    const { data: buyer } = await supabase
      .from("users")
      .select("id")
      .eq("id", order.buyer_id)
      .maybeSingle();

    if (!buyer) return { passed: false, label: "order→buyer link", detail: `Order ${order.id} has invalid buyer_id` };

    const { data: seller } = await supabase
      .from("sellers")
      .select("id")
      .eq("id", order.seller_id)
      .maybeSingle();

    if (!seller) return { passed: false, label: "order→seller link", detail: `Order ${order.id} has invalid seller_id` };

    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", order.product_id)
      .maybeSingle();

    if (!product) return { passed: false, label: "order→product link", detail: `Order ${order.id} has invalid product_id` };
  }

  return { passed: true, label: "order links", detail: `All ${orders.length} orders have valid buyer/seller/product links` };
}

async function main() {
  console.log("🔍 Verifying prototype data in Supabase...\n");

  const supabase = createSupabaseClient();

  const checks = [
    verifyUsers(supabase),
    verifySellers(supabase),
    verifyProducts(supabase),
    verifyGameAccounts(supabase),
    verifyOrders(supabase),
    verifySellerProductLink(supabase),
    verifyOrderLinks(supabase),
  ];

  const results = await Promise.all(checks);

  console.log("Results:");
  for (const result of results) {
    const icon = result.passed ? "✅" : "❌";
    console.log(`  ${icon} [${result.label}] ${result.detail}`);
  }

  console.log("");

  const allPassed = results.every((r) => r.passed);

  if (allPassed) {
    console.log("✅ All checks passed! Prototype data is ready.");
  } else {
    const failed = results.filter((r) => !r.passed);
    console.log(`❌ ${failed.length} check(s) failed:`);
    for (const f of failed) {
      console.log(`  - [${f.label}] ${f.detail}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
