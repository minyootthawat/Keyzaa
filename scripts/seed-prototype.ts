/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * seed-prototype.ts
 *
 * Seeds the Supabase prototype database with realistic demo data.
 * Run: npx tsx scripts/seed-prototype.ts
 */

const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
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

const DEMO_PASSWORD = "demo123";
const BCRYPT_ROUNDS = 12;

const DEMO_USERS = [
  { email: "admin@demo.keyzaa.local", name: "Demo Admin", role: "buyer" },
  { email: "buyer@demo.keyzaa.local", name: "Demo Buyer", role: "buyer" },
  { email: "seller@demo.keyzaa.local", name: "Demo Seller", role: "seller" },
  { email: "seller2@demo.keyzaa.local", name: "Neon Game Shop", role: "seller" },
  { email: "seller3@demo.keyzaa.local", name: "Fast Topup Store", role: "seller" },
];

const DEMO_SELLERS = [
  {
    email: "seller@demo.keyzaa.local",
    store_name: "Demo Seller Shop",
    phone: "0812345678",
    id_card_url: null,
    verified: true,
    rating: 4.9,
    sales_count: 240,
    balance: 1500.0,
    pending_balance: 250.0,
  },
  {
    email: "seller2@demo.keyzaa.local",
    store_name: "Neon Game Shop",
    phone: "0898765432",
    id_card_url: null,
    verified: true,
    rating: 4.7,
    sales_count: 1832,
    balance: 8200.0,
    pending_balance: 1100.0,
  },
  {
    email: "seller3@demo.keyzaa.local",
    store_name: "Fast Topup Store",
    phone: "0855512345",
    id_card_url: null,
    verified: false,
    rating: 4.3,
    sales_count: 56,
    balance: 320.0,
    pending_balance: 80.0,
  },
];

const DEMO_PRODUCTS = [
  // seller@demo.keyzaa.local products
  {
    seller_email: "seller@demo.keyzaa.local",
    name: "ROV 100 Gems",
    description: "Top up 100 ROV gems instantly to your account. Delivery within 5 minutes.",
    category: "Mobile Game Top-up",
    price: 49.0,
    stock: 999,
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400",
    listing_status: "active",
    is_active: undefined,
  },
  {
    seller_email: "seller@demo.keyzaa.local",
    name: "ROV 500 Gems",
    description: "Top up 500 ROV gems instantly. Best value pack!",
    category: "Mobile Game Top-up",
    price: 229.0,
    stock: 500,
    image_url: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400",
    is_active: true,
  },
  {
    seller_email: "seller@demo.keyzaa.local",
    name: "Garena Shell 50",
    description: "Garena Shell 50 code delivered instantly via email.",
    category: "Gift Card",
    price: 45.0,
    stock: 200,
    image_url: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400",
    is_active: true,
  },
  // seller2@demo.keyzaa.local products
  {
    seller_email: "seller2@demo.keyzaa.local",
    name: "Mobile Legends 100 Diamonds",
    description: "Fast Mobile Legends diamond top-up. 100 diamonds.",
    category: "Mobile Game Top-up",
    price: 39.0,
    stock: 1000,
    image_url: "https://images.unsplash.com/photo-1550062517-b6c4f58e6b53?w=400",
    is_active: true,
  },
  {
    seller_email: "seller2@demo.keyzaa.local",
    name: "Mobile Legends 500+50 Diamonds",
    description: "Mobile Legends 550 diamonds (500+50 bonus). Best deal!",
    category: "Mobile Game Top-up",
    price: 185.0,
    stock: 300,
    image_url: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400",
    is_active: true,
  },
  {
    seller_email: "seller2@demo.keyzaa.local",
    name: "Free Fire 100 Diamonds",
    description: "Free Fire diamond top-up — 100 diamonds delivered in minutes.",
    category: "Mobile Game Top-up",
    price: 35.0,
    stock: 800,
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
    is_active: true,
  },
  // seller3@demo.keyzaa.local products
  {
    seller_email: "seller3@demo.keyzaa.local",
    name: "PUBG 60 UC",
    description: "PUBG Mobile 60 UC code — instant delivery.",
    category: "Mobile Game Top-up",
    price: 55.0,
    stock: 50,
    image_url: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400",
    is_active: true,
  },
];

const DEMO_GAME_ACCOUNTS = [
  {
    seller_email: "seller2@demo.keyzaa.local",
    game_name: "Mobile Legends",
    game_name_th: "Mobile Legends",
    account_username: "ml_acc_2024",
    account_password: "SecurePass99!",
    description: "Rank Mythic 500 stars, owned all heroes, skins worth 5000+ USD. Fast delivery.",
    price: 8999.0,
    stock: 1,
    platform: "Android",
    region: "Global",
    image_url: "https://images.unsplash.com/photo-1550062517-b6c4f58e6b53?w=400",
    is_active: true,
  },
  {
    seller_email: "seller2@demo.keyzaa.local",
    game_name: "Free Fire",
    game_name_th: "Free Fire",
    account_username: "ff_top_player",
    account_password: "GamePass123!",
    description: "Grandmaster rank, owned all characters and pets. Account comes with 5000+ diamonds.",
    price: 4500.0,
    stock: 1,
    platform: "Android",
    region: "Global",
    image_url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
    is_active: true,
  },
];

async function upsertUser(supabase: ReturnType<typeof createClient>, user: (typeof DEMO_USERS)[number], now: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("users")
      .update({ name: user.name, password_hash: passwordHash, role: user.role, updated_at: now })
      .eq("id", existing.id);

    if (error) {
      console.error(`  [user] Failed to update ${user.email}: ${error.message}`);
      return null;
    }
    console.log(`  [user] Updated: ${user.email}`);
    return existing.id;
  }

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email: user.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { role: user.role, name: user.name },
  });

  if (authErr || !authUser?.user) {
    console.error(`  [user] Auth error for ${user.email}: ${authErr?.message}`);
    return null;
  }

  const userId = authUser.user.id;

  const { error: insErr } = await supabase.from("users").insert({
    id: userId,
    email: user.email,
    name: user.name,
    password_hash: passwordHash,
    role: user.role,
    provider: null,
    provider_id: null,
    created_at: now,
    updated_at: now,
  });

  if (insErr) {
    console.error(`  [user] Insert error for ${user.email}: ${insErr.message}`);
    return null;
  }

  console.log(`  [user] Created: ${user.email} (${userId})`);
  return userId;
}

async function upsertSeller(supabase: ReturnType<typeof createClient>, seller: (typeof DEMO_SELLERS)[number], userId: string, now: string) {
  const { data: existing } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("sellers")
      .update({
        store_name: seller.store_name,
        phone: seller.phone,
        id_card_url: seller.id_card_url,
        verified: seller.verified,
        rating: seller.rating,
        sales_count: seller.sales_count,
        balance: seller.balance,
        pending_balance: seller.pending_balance,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) {
      console.error(`  [seller] Failed to update ${seller.email}: ${error.message}`);
      return null;
    }
    console.log(`  [seller] Updated: ${seller.store_name}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("sellers")
    .insert({
      user_id: userId,
      store_name: seller.store_name,
      phone: seller.phone,
      id_card_url: seller.id_card_url,
      verified: seller.verified,
      rating: seller.rating,
      sales_count: seller.sales_count,
      balance: seller.balance,
      pending_balance: seller.pending_balance,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  [seller] Insert error for ${seller.email}: ${error.message}`);
    return null;
  }

  console.log(`  [seller] Created: ${seller.store_name} (${data.id})`);
  return data.id;
}

async function upsertProduct(supabase: ReturnType<typeof createClient>, product: (typeof DEMO_PRODUCTS)[number], sellerId: string, now: string) {
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("name", product.name)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("products")
      .update({
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        image_url: product.image_url,
        listing_status: product.listing_status,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) {
      console.error(`  [product] Failed to update ${product.name}: ${error.message}`);
      return null;
    }
    console.log(`  [product] Updated: ${product.name}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: sellerId,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      listing_status: product.listing_status,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  [product] Insert error for ${product.name}: ${error.message}`);
    return null;
  }

  console.log(`  [product] Created: ${product.name} (${data.id})`);
  return data.id;
}

async function upsertGameAccount(supabase: ReturnType<typeof createClient>, account: (typeof DEMO_GAME_ACCOUNTS)[number], sellerId: string, now: string) {
  const { data: existing } = await supabase
    .from("game_accounts")
    .select("id")
    .eq("seller_id", sellerId)
    .eq("account_username", account.account_username)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("game_accounts")
      .update({
        game_name: account.game_name,
        game_name_th: account.game_name_th,
        description: account.description,
        price: account.price,
        stock: account.stock,
        platform: account.platform,
        region: account.region,
        image_url: account.image_url,
        is_active: account.is_active,
        updated_at: now,
      })
      .eq("id", existing.id);

    if (error) {
      console.error(`  [game_account] Failed to update ${account.game_name}: ${error.message}`);
      return null;
    }
    console.log(`  [game_account] Updated: ${account.game_name} (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("game_accounts")
    .insert({
      seller_id: sellerId,
      game_name: account.game_name,
      game_name_th: account.game_name_th,
      account_username: account.account_username,
      account_password: account.account_password,
      description: account.description,
      price: account.price,
      stock: account.stock,
      platform: account.platform,
      region: account.region,
      image_url: account.image_url,
      is_active: account.is_active,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  [game_account] Insert error for ${account.game_name}: ${error.message}`);
    return null;
  }

  console.log(`  [game_account] Created: ${account.game_name} (${data.id})`);
  return data.id;
}

async function seedDemoOrders(
  supabase: ReturnType<typeof createClient>,
  userIdMap: Record<string, string>,
  sellerIdMap: Record<string, string>,
  productIdMap: Record<string, string>,
  now: string
) {
  const buyerId = userIdMap["buyer@demo.keyzaa.local"];
  const sellerId = sellerIdMap["seller@demo.keyzaa.local"];
  const productId = productIdMap["ROV 100 Gems"];

  if (!buyerId || !sellerId || !productId) {
    console.warn("  [order] Skipping orders — missing buyer/seller/product IDs");
    return;
  }

  const DEMO_ORDERS = [
    {
      buyer_id: buyerId,
      seller_id: sellerId,
      product_id: productId,
      quantity: 2,
      total_price: 98.0,
      gross_amount: 98.0,
      commission_amount: 4.9,
      seller_net_amount: 93.1,
      platform_fee_rate: 0.05,
      status: "completed",
      payment_status: "paid",
      fulfillment_status: "delivered",
      payment_method: "promptpay",
    },
    {
      buyer_id: buyerId,
      seller_id: sellerId,
      product_id: productId,
      quantity: 1,
      total_price: 49.0,
      gross_amount: 49.0,
      commission_amount: 2.45,
      seller_net_amount: 46.55,
      platform_fee_rate: 0.05,
      status: "pending",
      payment_status: "pending",
      fulfillment_status: "pending",
      payment_method: "promptpay",
    },
  ];

  for (const order of DEMO_ORDERS) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("buyer_id", order.buyer_id)
      .eq("product_id", order.product_id)
      .eq("quantity", order.quantity)
      .eq("status", order.status)
      .maybeSingle();

    if (existing) {
      console.log(`  [order] Skipped existing order for product ${order.product_id}`);
      continue;
    }

    const { data: productData } = await supabase
      .from("products")
      .select("name, image_url, price")
      .eq("id", order.product_id)
      .single();

    const { data, error } = await supabase
      .from("orders")
      .insert({ ...order, created_at: now, updated_at: now })
      .select("id")
      .single();

    if (error) {
      console.error(`  [order] Insert error: ${error.message}`);
    } else {
      console.log(`  [order] Created order ${data.id} (${order.status})`);

      if (productData) {
        await supabase.from("order_items").insert({
          order_id: data.id,
          product_id: order.product_id,
          title: productData.name,
          image: productData.image_url,
          price: productData.price,
          quantity: order.quantity,
        });
        console.log(`  [order_item] Created for order ${data.id}`);
      }

      if (order.status === "completed") {
        await supabase.from("seller_ledger_entries").insert({
          seller_id: order.seller_id,
          type: "sale",
          amount: order.seller_net_amount,
          order_id: data.id,
          description: `Sale: ${productData?.name ?? "product"} x${order.quantity}`,
          created_at: now,
        });
        console.log(`  [ledger] Created sale entry for order ${data.id}`);
      }
    }
  }
}

async function main() {
  console.log("🌱 Starting prototype seed...\n");

  const supabase = createSupabaseClient();
  const now = new Date().toISOString();

  // Step 1: Upsert users
  console.log("📦 Seeding users...");
  const userIdMap: Record<string, string> = {};
  for (const user of DEMO_USERS) {
    const uid = await upsertUser(supabase, user, now);
    if (uid) userIdMap[user.email] = uid;
  }

  // Step 2: Upsert sellers
  console.log("\n📦 Seeding sellers...");
  const sellerIdMap: Record<string, string> = {};
  for (const seller of DEMO_SELLERS) {
    const userId = userIdMap[seller.email];
    if (!userId) {
      console.warn(`  [seller] No user found for ${seller.email}, skipping`);
      continue;
    }
    const sid = await upsertSeller(supabase, seller, userId, now);
    if (sid) sellerIdMap[seller.email] = sid;
  }

  // Step 3: Upsert products
  console.log("\n📦 Seeding products...");
  const productIdMap: Record<string, string> = {};
  for (const product of DEMO_PRODUCTS) {
    const sellerId = sellerIdMap[product.seller_email];
    if (!sellerId) {
      console.warn(`  [product] No seller found for ${product.seller_email}, skipping`);
      continue;
    }
    const pid = await upsertProduct(supabase, product, sellerId, now);
    if (pid) productIdMap[product.name] = pid;
  }

  // Step 4: Upsert game accounts
  console.log("\n📦 Seeding game accounts...");
  for (const account of DEMO_GAME_ACCOUNTS) {
    const sellerId = sellerIdMap[account.seller_email];
    if (!sellerId) {
      console.warn(`  [game_account] No seller found for ${account.seller_email}, skipping`);
      continue;
    }
    await upsertGameAccount(supabase, account, sellerId, now);
  }

  // Step 5: Seed demo orders
  console.log("\n📦 Seeding demo orders...");
  await seedDemoOrders(supabase, userIdMap, sellerIdMap, productIdMap, now);

  console.log("\n✅ Prototype seed complete!");
  console.log("\nTest credentials:");
  for (const user of DEMO_USERS) {
    console.log(`  ${user.role.padEnd(10)} ${user.email} / ${DEMO_PASSWORD}`);
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
