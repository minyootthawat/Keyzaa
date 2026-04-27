/**
 * Keyzaa Supabase Seed Script
 * Populates demo data into: users, sellers, products, orders, order_items
 * Uses service_role client for admin access
 */

import { createClient } from "@supabase/supabase-js";

// Load .env.local manually
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sepIdx = trimmed.indexOf("=");
    if (sepIdx === -1) continue;
    const key = trimmed.slice(0, sepIdx).trim();
    const value = trimmed.slice(sepIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://epbitsaowxxmutgmeqro.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Connected to Supabase:", SUPABASE_URL);
  console.log("Starting seed...\n");

  // --- USERS ---
  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("demo123", 12);

  const users = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      email: "buyer@demo.keyzaa.local",
      name: "Demo Buyer",
      password_hash: passwordHash,
      role: "buyer",
      provider: "email",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      email: "seller@demo.keyzaa.local",
      name: "Demo Seller",
      password_hash: passwordHash,
      role: "seller",
      provider: "email",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      email: "admin@demo.keyzaa.local",
      name: "Demo Admin",
      password_hash: passwordHash,
      role: "both",
      provider: "email",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      email: "alice@example.com",
      name: "Alice Smith",
      password_hash: passwordHash,
      role: "buyer",
      provider: "google",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "55555555-5555-5555-5555-555555555555",
      email: "bob@example.com",
      name: "Bob Johnson",
      password_hash: passwordHash,
      role: "both",
      provider: "line",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const user of users) {
    const { error } = await supabase.from("users").upsert(user, { onConflict: "id" });
    if (error) console.error("  Error seeding user", user.email, ":", error.message);
    else console.log("  + user:", user.email);
  }

  // --- SELLERS ---
  console.log("\nSeeding sellers...");
  const sellers = [
    {
      id: "aaaa1111-1111-1111-1111-111111111111",
      user_id: "22222222-2222-2222-2222-222222222222",
      store_name: "Demo Seller Shop",
      phone: "0812345678",
      id_card_url: null,
      verified: true,
      rating: 4.9,
      sales_count: 240,
      balance: 0,
      pending_balance: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "aaaa2222-2222-2222-2222-222222222222",
      user_id: "55555555-5555-5555-5555-555555555555",
      store_name: "Bob's Game Store",
      phone: "0898765432",
      id_card_url: null,
      verified: true,
      rating: 4.7,
      sales_count: 89,
      balance: 1500.0,
      pending_balance: 250.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "aaaa3333-3333-3333-3333-333333333333",
      user_id: "33333333-3333-3333-3333-333333333333",
      store_name: "Admin Games",
      phone: "0611111111",
      id_card_url: null,
      verified: true,
      rating: 5.0,
      sales_count: 1200,
      balance: 50000.0,
      pending_balance: 5000.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const seller of sellers) {
    const { error } = await supabase.from("sellers").upsert(seller, { onConflict: "id" });
    if (error) console.error("  Error seeding seller", seller.store_name, ":", error.message);
    else console.log("  + seller:", seller.store_name);
  }

  // --- PRODUCTS ---
  console.log("\nSeeding products...");
  const products = [
    {
      id: "pppp1111-1111-1111-1111-111111111111",
      seller_id: "aaaa1111-1111-1111-1111-111111111111",
      name: "ROV Diamond Pack 500",
      description: "500 Diamond for Royal Arena | Instant delivery within 5 minutes",
      category: "mobile-topup",
      price: 499.0,
      stock: 100,
      image_url: "https://cdn.keyzaa.com/products/rov-diamond-500.png",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "pppp2222-2222-2222-2222-222222222222",
      seller_id: "aaaa1111-1111-1111-1111-111111111111",
      name: "ROV Diamond Pack 1000",
      description: "1000 Diamond + 100 Bonus | Instant delivery",
      category: "mobile-topup",
      price: 949.0,
      stock: 50,
      image_url: "https://cdn.keyzaa.com/products/rov-diamond-1000.png",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "pppp3333-3333-3333-3333-333333333333",
      seller_id: "aaaa2222-2222-2222-2222-222222222222",
      name: "Garena Shell 100",
      description: "100 Garena Shell | Auto delivery via email",
      category: "gift-card",
      price: 95.0,
      stock: 200,
      image_url: "https://cdn.keyzaa.com/products/garena-shell-100.png",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "pppp4444-4444-4444-4444-444444444444",
      seller_id: "aaaa2222-2222-2222-2222-222222222222",
      name: "Steam Wallet 500 THB",
      description: "Steam Wallet code | Delivered via email instantly",
      category: "gift-card",
      price: 485.0,
      stock: 30,
      image_url: "https://cdn.keyzaa.com/products/steam-wallet-500.png",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "pppp5555-5555-5555-5555-555555555555",
      seller_id: "aaaa3333-3333-3333-3333-333333333333",
      name: "Mobile Legends Diamond 100",
      description: "100 Diamond | Instant delivery to your account",
      category: "mobile-topup",
      price: 99.0,
      stock: 500,
      image_url: "https://cdn.keyzaa.com/products/ml-diamond-100.png",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "pppp6666-6666-6666-6666-666666666666",
      seller_id: "aaaa3333-3333-3333-3333-333333333333",
      name: "Google Play Gift Card 1000 THB",
      description: "Google Play gift card code | Email delivery",
      category: "gift-card",
      price: 950.0,
      stock: 20,
      image_url: "https://cdn.keyzaa.com/products/google-play-1000.png",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const product of products) {
    const { error } = await supabase.from("products").upsert(product, { onConflict: "id" });
    if (error) console.error("  Error seeding product", product.name, ":", error.message);
    else console.log("  + product:", product.name);
  }

  // --- ORDERS ---
  console.log("\nSeeding orders...");
  const orders = [
    {
      id: "oooo1111-1111-1111-1111-111111111111",
      buyer_id: "44444444-4444-4444-4444-444444444444",
      seller_id: "aaaa1111-1111-1111-1111-111111111111",
      product_id: "pppp1111-1111-1111-1111-111111111111",
      quantity: 1,
      total_price: 499.0,
      gross_amount: 499.0,
      commission_amount: 24.95,
      seller_net_amount: 474.05,
      platform_fee_rate: 0.05,
      currency: "THB",
      status: "completed",
      payment_status: "paid",
      fulfillment_status: "delivered",
      payment_method: "promptpay",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "oooo2222-2222-2222-2222-222222222222",
      buyer_id: "44444444-4444-4444-4444-444444444444",
      seller_id: "aaaa2222-2222-2222-2222-222222222222",
      product_id: "pppp3333-3333-3333-3333-333333333333",
      quantity: 2,
      total_price: 190.0,
      gross_amount: 190.0,
      commission_amount: 9.5,
      seller_net_amount: 180.5,
      platform_fee_rate: 0.05,
      currency: "THB",
      status: "completed",
      payment_status: "paid",
      fulfillment_status: "delivered",
      payment_method: "linepay",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "oooo3333-3333-3333-3333-333333333333",
      buyer_id: "11111111-1111-1111-1111-111111111111",
      seller_id: "aaaa3333-3333-3333-3333-333333333333",
      product_id: "pppp5555-5555-5555-5555-555555555555",
      quantity: 1,
      total_price: 99.0,
      gross_amount: 99.0,
      commission_amount: 4.95,
      seller_net_amount: 94.05,
      platform_fee_rate: 0.05,
      currency: "THB",
      status: "paid",
      payment_status: "paid",
      fulfillment_status: "processing",
      payment_method: "promptpay",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "oooo4444-4444-4444-4444-444444444444",
      buyer_id: "11111111-1111-1111-1111-111111111111",
      seller_id: "aaaa1111-1111-1111-1111-111111111111",
      product_id: "pppp2222-2222-2222-2222-222222222222",
      quantity: 1,
      total_price: 949.0,
      gross_amount: 949.0,
      commission_amount: 47.45,
      seller_net_amount: 901.55,
      platform_fee_rate: 0.05,
      currency: "THB",
      status: "pending",
      payment_status: "pending",
      fulfillment_status: "pending",
      payment_method: "credit_card",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "oooo5555-5555-5555-5555-555555555555",
      buyer_id: "55555555-5555-5555-5555-555555555555",
      seller_id: "aaaa3333-3333-3333-3333-333333333333",
      product_id: "pppp6666-6666-6666-6666-666666666666",
      quantity: 1,
      total_price: 950.0,
      gross_amount: 950.0,
      commission_amount: 47.5,
      seller_net_amount: 902.5,
      platform_fee_rate: 0.05,
      currency: "THB",
      status: "shipped",
      payment_status: "paid",
      fulfillment_status: "processing",
      payment_method: "promptpay",
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  for (const order of orders) {
    const { error } = await supabase.from("orders").upsert(order, { onConflict: "id" });
    if (error) console.error("  Error seeding order", order.id, ":", error.message);
    else console.log("  + order:", order.id, "status:", order.status);
  }

  // --- ORDER ITEMS ---
  console.log("\nSeeding order_items...");
  const orderItems = [
    {
      id: "oi001111-1111-1111-1111-111111111111",
      order_id: "oooo1111-1111-1111-1111-111111111111",
      product_id: "pppp1111-1111-1111-1111-111111111111",
      title: "ROV Diamond Pack 500",
      title_th: "แพ็กเพชร ROV 500",
      title_en: "ROV Diamond Pack 500",
      image: "https://cdn.keyzaa.com/products/rov-diamond-500.png",
      price: 499.0,
      quantity: 1,
      platform: "rov",
      region_code: "th",
      activation_method_th: "ส่งทางอีเมลภายใน 5 นาที",
      activation_method_en: "Delivered via email within 5 minutes",
    },
    {
      id: "oi002222-2222-2222-2222-222222222222",
      order_id: "oooo2222-2222-2222-2222-222222222222",
      product_id: "pppp3333-3333-3333-3333-333333333333",
      title: "Garena Shell 100",
      title_th: "Garena Shell 100",
      title_en: "Garena Shell 100",
      image: "https://cdn.keyzaa.com/products/garena-shell-100.png",
      price: 95.0,
      quantity: 2,
      platform: "garena",
      region_code: "th",
      activation_method_th: "ส่งทางอีเมลอัตโนมัติ",
      activation_method_en: "Auto-delivered via email",
    },
    {
      id: "oi003333-3333-3333-3333-333333333333",
      order_id: "oooo3333-3333-3333-3333-333333333333",
      product_id: "pppp5555-5555-5555-5555-555555555555",
      title: "Mobile Legends Diamond 100",
      title_th: "เพชร Mobile Legends 100",
      title_en: "Mobile Legends Diamond 100",
      image: "https://cdn.keyzaa.com/products/ml-diamond-100.png",
      price: 99.0,
      quantity: 1,
      platform: "mobile-legends",
      region_code: "th",
      activation_method_th: "จัดส่งอัตโนมัติไปยังบัญชีของท่าน",
      activation_method_en: "Auto-delivered to your account",
    },
    {
      id: "oi004444-4444-4444-4444-444444444444",
      order_id: "oooo4444-4444-4444-4444-444444444444",
      product_id: "pppp2222-2222-2222-2222-222222222222",
      title: "ROV Diamond Pack 1000",
      title_th: "แพ็กเพชร ROV 1000",
      title_en: "ROV Diamond Pack 1000",
      image: "https://cdn.keyzaa.com/products/rov-diamond-1000.png",
      price: 949.0,
      quantity: 1,
      platform: "rov",
      region_code: "th",
      activation_method_th: "ส่งทางอีเมลภายใน 5 นาที",
      activation_method_en: "Delivered via email within 5 minutes",
    },
    {
      id: "oi005555-5555-5555-5555-555555555555",
      order_id: "oooo5555-5555-5555-5555-555555555555",
      product_id: "pppp6666-6666-6666-6666-666666666666",
      title: "Google Play Gift Card 1000 THB",
      title_th: "บัตรของขวัญ Google Play 1000 บาท",
      title_en: "Google Play Gift Card 1000 THB",
      image: "https://cdn.keyzaa.com/products/google-play-1000.png",
      price: 950.0,
      quantity: 1,
      platform: "google-play",
      region_code: "th",
      activation_method_th: "ส่งรหัสทางอีเมล",
      activation_method_en: "Code sent via email",
    },
  ];

  for (const item of orderItems) {
    const { error } = await supabase.from("order_items").upsert(item, { onConflict: "id" });
    if (error) console.error("  Error seeding order_item", item.id, ":", error.message);
    else console.log("  + order_item:", item.id);
  }

  // --- SELLER LEDGER ---
  console.log("\nSeeding seller_ledger_entries...");
  const ledgerEntries = [
    {
      id: "lle11111-1111-1111-1111-111111111111",
      seller_id: "aaaa1111-1111-1111-1111-111111111111",
      type: "sale",
      amount: 499.0,
      order_id: "oooo1111-1111-1111-1111-111111111111",
      description: "Sale from order oooo1111-1111-1111-1111-111111111111",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "lle22222-2222-2222-2222-222222222222",
      seller_id: "aaaa1111-1111-1111-1111-111111111111",
      type: "commission_fee",
      amount: 24.95,
      order_id: "oooo1111-1111-1111-1111-111111111111",
      description: "Commission fee for order oooo1111-1111-1111-1111-111111111111",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: "lle33333-3333-3333-3333-333333333333",
      seller_id: "aaaa2222-2222-2222-2222-222222222222",
      type: "sale",
      amount: 190.0,
      order_id: "oooo2222-2222-2222-2222-222222222222",
      description: "Sale from order oooo2222-2222-2222-2222-222222222222",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "lle44444-4444-4444-4444-444444444444",
      seller_id: "aaaa2222-2222-2222-2222-222222222222",
      type: "commission_fee",
      amount: 9.5,
      order_id: "oooo2222-2222-2222-2222-222222222222",
      description: "Commission fee for order oooo2222-2222-2222-2222-222222222222",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  for (const entry of ledgerEntries) {
    const { error } = await supabase.from("seller_ledger_entries").upsert(entry, { onConflict: "id" });
    if (error) console.error("  Error seeding ledger entry", entry.id, ":", error.message);
    else console.log("  + ledger entry:", entry.id, entry.type, entry.amount);
  }

  console.log("\n=== Seed Complete ===");
  console.log("Demo credentials (all use password: demo123)");
  console.log("  buyer@demo.keyzaa.local   (buyer role)");
  console.log("  seller@demo.keyzaa.local  (seller role)");
  console.log("  admin@demo.keyzaa.local    (both/admin role)");
  console.log("  alice@example.com          (buyer role)");
  console.log("  bob@example.com            (both role)");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
