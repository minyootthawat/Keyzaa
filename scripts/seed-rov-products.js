/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
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

// 50 ROV diamond packages
const rovProducts = [
  // Package 1-10: Small diamonds
  { diamonds: 100, price: 95, originalPrice: 120, stock: 9999 },
  { diamonds: 180, price: 165, originalPrice: 200, stock: 9999 },
  { diamonds: 280, price: 255, originalPrice: 290, stock: 9999 },
  { diamonds: 350, price: 320, originalPrice: 380, stock: 9999 },
  { diamonds: 500, price: 450, originalPrice: 500, stock: 9999 },
  { diamonds: 600, price: 540, originalPrice: 600, stock: 9999 },
  { diamonds: 720, price: 650, originalPrice: 720, stock: 9999 },
  { diamonds: 800, price: 720, originalPrice: 800, stock: 9999 },
  { diamonds: 900, price: 810, originalPrice: 900, stock: 9999 },
  { diamonds: 1000, price: 890, originalPrice: 1000, stock: 9999 },
  // Package 11-20: Medium diamonds
  { diamonds: 1200, price: 1050, originalPrice: 1200, stock: 9999 },
  { diamonds: 1400, price: 1220, originalPrice: 1400, stock: 9999 },
  { diamonds: 1500, price: 1290, originalPrice: 1500, stock: 9999 },
  { diamonds: 1680, price: 1440, originalPrice: 1680, stock: 9999 },
  { diamonds: 1800, price: 1530, originalPrice: 1800, stock: 9999 },
  { diamonds: 2000, price: 1690, originalPrice: 2000, stock: 9999 },
  { diamonds: 2200, price: 1850, originalPrice: 2200, stock: 9999 },
  { diamonds: 2400, price: 1990, originalPrice: 2400, stock: 9999 },
  { diamonds: 2700, price: 2230, originalPrice: 2700, stock: 9999 },
  { diamonds: 3000, price: 2450, originalPrice: 3000, stock: 9999 },
  // Package 21-30: Large diamonds
  { diamonds: 3300, price: 2690, originalPrice: 3300, stock: 9999 },
  { diamonds: 3600, price: 2890, originalPrice: 3600, stock: 9999 },
  { diamonds: 4000, price: 3190, originalPrice: 4000, stock: 9999 },
  { diamonds: 4400, price: 3490, originalPrice: 4400, stock: 9999 },
  { diamonds: 4800, price: 3790, originalPrice: 4800, stock: 9999 },
  { diamonds: 5000, price: 3950, originalPrice: 5000, stock: 9999 },
  { diamonds: 5600, price: 4390, originalPrice: 5600, stock: 9999 },
  { diamonds: 6000, price: 4690, originalPrice: 6000, stock: 9999 },
  { diamonds: 6600, price: 5150, originalPrice: 6600, stock: 9999 },
  { diamonds: 7200, price: 5590, originalPrice: 7200, stock: 9999 },
  // Package 31-40: Premium diamonds
  { diamonds: 8000, price: 6190, originalPrice: 8000, stock: 9999 },
  { diamonds: 8800, price: 6790, originalPrice: 8800, stock: 9999 },
  { diamonds: 9600, price: 7390, originalPrice: 9600, stock: 9999 },
  { diamonds: 10000, price: 7690, originalPrice: 10000, stock: 9999 },
  { diamonds: 11000, price: 8390, originalPrice: 11000, stock: 9999 },
  { diamonds: 12000, price: 9090, originalPrice: 12000, stock: 9999 },
  { diamonds: 13200, price: 9990, originalPrice: 13200, stock: 9999 },
  { diamonds: 14400, price: 10890, originalPrice: 14400, stock: 9999 },
  { diamonds: 16000, price: 12090, originalPrice: 16000, stock: 9999 },
  { diamonds: 18000, price: 13490, originalPrice: 18000, stock: 9999 },
  // Package 41-50: Ultimate diamonds
  { diamonds: 20000, price: 14990, originalPrice: 20000, stock: 9999 },
  { diamonds: 22000, price: 16390, originalPrice: 22000, stock: 9999 },
  { diamonds: 24000, price: 17790, originalPrice: 24000, stock: 9999 },
  { diamonds: 26400, price: 19490, originalPrice: 26400, stock: 9999 },
  { diamonds: 28800, price: 21190, originalPrice: 28800, stock: 9999 },
  { diamonds: 32000, price: 23490, originalPrice: 32000, stock: 9999 },
  { diamonds: 36000, price: 26290, originalPrice: 36000, stock: 9999 },
  { diamonds: 40000, price: 28990, originalPrice: 40000, stock: 9999 },
  { diamonds: 44000, price: 31690, originalPrice: 44000, stock: 9999 },
  { diamonds: 50000, price: 35790, originalPrice: 50000, stock: 9999 },
];

async function main() {
  loadEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date().toISOString();

  // Get first seller
  const { data: sellers, error: sellerErr } = await supabase
    .from('sellers')
    .select('id')
    .limit(1);

  if (sellerErr || !sellers || sellers.length === 0) {
    console.error('No sellers found. Run seed-supabase.js first.');
    process.exit(1);
  }

  const sellerId = sellers[0].id;
  console.log(`Using seller: ${sellerId}`);

  // Insert 50 ROV products
  const products = rovProducts.map((p, i) => {
    const discount = p.originalPrice > 0 ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
    return {
      seller_id: sellerId,
      name: `ROV ${p.diamonds.toLocaleString()} เพชร / ${p.diamonds.toLocaleString()} Diamonds`,
      description: `เติม ROV ${p.diamonds.toLocaleString()} เพชร สำหรับบัญชีไทย ส่งทันทีภายใน 1 นาที รับโค้ดและเติมเพชรผ่านระบบอัตโนมัติ`,
      category: 'ROV Diamonds',
      price: p.price,
      stock: p.stock,
      image_url: '/products/rov.png',
      is_active: true,
      created_at: now,
      updated_at: now,
    };
  });

  // Delete existing ROV products first
  await supabase.from('products').delete().like('name', 'ROV%');

  const { data, error } = await supabase.from('products').insert(products).select();

  if (error) {
    console.error('Insert error:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${data.length} ROV products successfully!`);
}

main().catch(err => { console.error(err); process.exit(1); });
