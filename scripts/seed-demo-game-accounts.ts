/**
 * Seed script: demo game accounts + wallet ledger entries
 * Run: cd ~/dev/keyzaa && npx tsx scripts/seed-demo-game-accounts.ts
 */
import { createServiceRoleClient } from "../lib/db/supabase";

const SELLER_ID = "4c87d33d-ed3b-4b5b-aefb-c2823708abff"; // seller@demo.keyzaa.local

const GAME_ACCOUNTS = [
  {
    id: `ga_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    seller_id: SELLER_ID,
    game_name: "Mobile Legends",
    game_name_th: "MLBB Diamond 500",
    account_username: "mlbb_pro_player",
    account_password: "SecurePass123!",
    description: "Rank Mythic 500, 120 Win Rate, owned 15 heroes incl. Granger, Mathilde, Yin. เซิร์ฟเวอร์ไทย",
    price: 2999,
    stock: 1,
    is_active: true,
    platform: "Mobile",
    region: "Thai",
    image_url: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&q=80",
  },
  {
    id: `ga_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    seller_id: SELLER_ID,
    game_name: "Genshin Impact",
    game_name_th: "เกมเจนชิน 50 Primogems",
    account_username: "genshin_ar60_whale",
    account_password: "Traveler2024!",
    description: "AR60, C6 Raiden Shogun + C3 Zhongli + C2 Nahida. All 5-star weapons. 100% exploration.",
    price: 15999,
    stock: 1,
    is_active: true,
    platform: "PC",
    region: "Global",
    image_url: "https://images.unsplash.com/photo-1536746803623-cef87080bfc8?w=400&q=80",
  },
  {
    id: `ga_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    seller_id: SELLER_ID,
    game_name: "Free Fire",
    game_name_th: "ฟรีไฟร์ แอคเคาท์",
    account_username: "ff_booyah_top1",
    account_password: "BooyahPass99!",
    description: "Rank Grandmaster, pet Booyah, 50+ pet skins, diamond balance 5000+. เซิร์ฟเวอร์ไทย",
    price: 899,
    stock: 2,
    is_active: true,
    platform: "Mobile",
    region: "Thai",
    image_url: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80",
  },
  {
    id: `ga_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    seller_id: SELLER_ID,
    game_name: "Valorant",
    game_name_th: "วาโรร์แรนท์ แอคเคาท์",
    account_username: "val_radiant_wannabe",
    account_password: "Radiant2024!",
    description: "Rank Diamond 2, 200 hours, Battle Pass fully bought. 5 skins bundles owned.",
    price: 4500,
    stock: 1,
    is_active: false, // paused
    platform: "PC",
    region: "Global",
    image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80",
  },
];

async function main() {
  const supabase = createServiceRoleClient();
  console.log("🌱 Seeding demo game accounts...");

  for (const acc of GAME_ACCOUNTS) {
    const { error } = await supabase.from("game_accounts").upsert(acc, { onConflict: "id" });
    if (error) {
      console.error(`  ❌ ${acc.game_name}:`, error.message);
    } else {
      console.log(`  ✅ ${acc.game_name} — ฿${acc.price}`);
    }
  }

  // Seed ledger entries
  console.log("\n💰 Seeding wallet ledger entries...");
  const now = new Date();
  const ledgerEntries = [
    { daysAgo: 25, type: "sale", amount: 2999, desc: "Order #ORD001 - MLBB Diamond 500" },
    { daysAgo: 23, type: "commission_fee", amount: 210, desc: "ค่าคอมมิชชั่น 7% - Order #ORD001" },
    { daysAgo: 18, type: "sale", amount: 899, desc: "Order #ORD002 - Free Fire Account" },
    { daysAgo: 16, type: "commission_fee", amount: 63, desc: "ค่าคอมมิชชั่น 7% - Order #ORD002" },
    { daysAgo: 10, type: "sale", amount: 15999, desc: "Order #ORD003 - Genshin AR60 C6" },
    { daysAgo: 8, type: "commission_fee", amount: 1120, desc: "ค่าคอมมิชชั่น 7% - Order #ORD003" },
    { daysAgo: 3, type: "sale", amount: 4500, desc: "Order #ORD004 - Valorant Diamond" },
    { daysAgo: 1, type: "commission_fee", amount: 315, desc: "ค่าคอมมิชชั่น 7% - Order #ORD004" },
  ];

  for (const entry of ledgerEntries) {
    const d = new Date(now);
    d.setDate(d.getDate() - entry.daysAgo);
    const { error } = await supabase.from("seller_ledger_entries").insert({
      id: `led_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
      seller_id: SELLER_ID,
      order_id: null,
      type: entry.type as "sale" | "commission_fee" | "withdrawal",
      amount: entry.amount,
      description: entry.desc,
      created_at: d.toISOString(),
    });
    if (error) {
      console.error(`  ❌ Ledger entry ${entry.desc}:`, error.message);
    } else {
      console.log(`  ✅ ${entry.type === "sale" ? "📈" : "📉"} ${entry.desc}`);
    }
  }

  // Seed products
  console.log("\n📦 Seeding demo products...");
  const products = [
    { name: "MLBB Diamond 500", category: "เติมเกม", price: 299, stock: 99, is_active: true },
    { name: "Genshin 1000 Genesis Crystal", category: "เติมเกม", price: 499, stock: 50, is_active: true },
    { name: "Free Fire 500 Diamond", category: "เติมเกม", price: 189, stock: 200, is_active: true },
  ];

  for (const p of products) {
    const { error } = await supabase.from("products").insert({
      id: `prod_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
      seller_id: SELLER_ID,
      name: p.name,
      category: p.category,
      price: p.price,
      stock: p.stock,
      is_active: p.is_active,
      image_url: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&q=80",
    });
    if (error) {
      console.log(`  ⚠️  ${p.name}: ${error.message}`);
    } else {
      console.log(`  ✅ ${p.name}`);
    }
  }

  console.log("\n✨ Done! Game accounts and wallet seeded.");
}

main().catch(console.error);
