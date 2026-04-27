/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('node:fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const sep = trimmed.indexOf('=');
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const val = trimmed.slice(sep + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const storeNames = [
  'ร้านเพชรโรว์ สตอร์',
  'TopUp ROV Mall',
  'เติมเพชรราคาถูก',
  'Fast ROV Topup',
  'เกมช็อปไทย',
  'Diamond King TH',
  'ROV Pro Shop',
  'แร็กซ์โกลบอล',
  'Game Store 4U',
  'ดิจิตอล พลัส',
];

const rovDiamonds = [
  100, 280, 500, 1000, 1500, 2000, 3000, 5000, 8000, 10000,
  1200, 1680, 2400, 3600, 5000, 6600, 9600, 13200, 18000, 22000,
  350, 720, 1400, 2700, 4000, 5600, 8000, 11000, 16000, 26400,
  600, 900, 1800, 3300, 4800, 6000, 8800, 12000, 20000, 32000,
  100, 280, 500, 1000, 1500,
];

async function main() {
  loadEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash('demo123', 12);

  console.log('Creating 10 sellers with 5 products each (50 total ROV products)...\n');

  const sellers = [];

  for (let i = 0; i < 10; i++) {
    const email = `seller${i + 1}@demo.keyzaa.local`;

    // Create user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: 'demo123',
      email_confirm: true,
      user_metadata: { role: 'seller', name: storeNames[i] },
    });

    if (authErr) {
      // User might already exist
      const { data: existingUser } = await supabase
        .from('users').select('id').eq('email', email).single();
      if (existingUser) {
        sellers.push({ id: existingUser.id, store_name: storeNames[i] });
        console.log(`Seller ${i + 1} (existing): ${storeNames[i]}`);
      } else {
        console.log(`Error creating seller ${i + 1}: ${authErr.message}`);
      }
      continue;
    }

    const userId = authUser.user.id;

    // Insert user record
    await supabase.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      name: storeNames[i],
      role: 'seller',
      created_at: now,
      updated_at: now,
    });

    // Insert seller record
    const { data: seller, error: sellerErr } = await supabase
      .from('sellers')
      .insert({
        user_id: userId,
        store_name: storeNames[i],
        phone: `08${String(10000000 + i * 111111)}`,
        verified: true,
        rating: Number((4 + Math.random()).toFixed(1)),
        sales_count: Math.floor(Math.random() * 500),
        balance: 0,
        pending_balance: 0,
        payout_status: 'manual',
        response_time_minutes: Math.floor(5 + Math.random() * 20),
        fulfillment_rate: Number((95 + Math.random() * 5).toFixed(1)),
        dispute_rate: Number((0 + Math.random() * 3).toFixed(1)),
        created_at: now,
        updated_at: now,
      })
      .select().single();

    if (sellerErr) {
      console.log(`Seller insert error (${email}): ${sellerErr.message}`);
      continue;
    }

    sellers.push({ id: seller.id, store_name: storeNames[i] });
    console.log(`Seller ${i + 1} created: ${storeNames[i]} (${seller.id})`);
  }

  console.log(`\nTotal sellers: ${sellers.length}`);

  // Delete existing ROV products
  await supabase.from('products').delete().like('name', 'ROV%');
  console.log('Cleared existing ROV products');

  // Create 5 products per seller
  let productCount = 0;
  for (const seller of sellers) {
    for (let j = 0; j < 5; j++) {
      const diamonds = rovDiamonds[productCount % rovDiamonds.length];
      const basePrice = Math.ceil(diamonds * 0.9);

      const { error } = await supabase.from('products').insert({
        seller_id: seller.id,
        name: `ROV ${diamonds.toLocaleString()} เพชร / ${diamonds.toLocaleString()} Diamonds`,
        description: `เติม ROV ${diamonds.toLocaleString()} เพชร สำหรับบัญชีไทย ส่งทันทีภายใน 1 นาที รับโค้ดและเติมเพชรผ่านระบบอัตโนมัติ`,
        category: 'ROV Diamonds',
        price: basePrice,
        stock: 9999,
        image_url: '/products/rov.png',
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      if (!error) productCount++;
    }
  }

  console.log(`\nInserted ${productCount} ROV products across ${sellers.length} sellers`);
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
