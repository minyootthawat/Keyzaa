/**
 * Seed additional products + orders to match seed script intent
 * Uses real seller IDs from existing DB data
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epbitsaowxxmutgmeqro.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function uuid() {
  return require('crypto').randomUUID();
}

async function seed() {
  console.log('Fetching existing sellers...');
  const { data: sellers } = await sb.from('sellers').select('id,store_name');
  const sellerMap = {};
  sellers.forEach(s => { sellerMap[s.store_name] = s.id; });

  // GameZone Shop is our main seller
  const gameZoneId = sellerMap['GameZone Shop'] || '0b5b223e-b0b8-4512-9e05-62a961fc9ed2';
  const topupRovId = sellerMap['TopUp ROV Mall'] || '40f524a6-1042-477a-8df4-365ffd9b08df';
  const เติมเพชรId = sellerMap['เติมเพชรราคาถูก'] || '47513ae8-0e8f-4ed8-a25e-24dbf85cbc53';

  console.log('Using seller IDs:', { gameZoneId, topupRovId, เติมเพชรId });

  // Get existing products to avoid duplicates
  const { data: existingProducts } = await sb.from('products').select('name,seller_id');
  const existingSet = new Set(existingProducts.map(p => `${p.seller_id}:${p.name}`));

  // Products to add
  const newProducts = [
    // GameZone Shop products
    { id: uuid(), seller_id: gameZoneId, name: 'ROV Diamond Pack 500', description: '500 Diamond for Royal Arena | Instant delivery within 5 minutes', category: 'Mobile Top-up', price: 499, stock: 100, image_url: 'https://picsum.photos/seed/rov500/400/300', is_active: true },
    { id: uuid(), seller_id: gameZoneId, name: 'ROV Diamond Pack 1000', description: '1000 Diamond + 100 Bonus | Instant delivery', category: 'Mobile Top-up', price: 949, stock: 50, image_url: 'https://picsum.photos/seed/rov1000/400/300', is_active: true },
    { id: uuid(), seller_id: gameZoneId, name: 'Garena Shell 100', description: '100 Garena Shell | Auto delivery via email', category: 'Gift Card', price: 95, stock: 200, image_url: 'https://picsum.photos/seed/garena100/400/300', is_active: true },
    { id: uuid(), seller_id: gameZoneId, name: 'Steam Wallet 500 THB', description: 'Steam Wallet code | Delivered via email instantly', category: 'Gift Card', price: 485, stock: 30, image_url: 'https://picsum.photos/seed/steam500/400/300', is_active: true },
    { id: uuid(), seller_id: gameZoneId, name: 'Mobile Legends Diamond 100', description: '100 Diamond | Instant delivery to your account', category: 'Mobile Top-up', price: 99, stock: 500, image_url: 'https://picsum.photos/seed/mld100/400/300', is_active: true },
    { id: uuid(), seller_id: gameZoneId, name: 'Google Play Gift Card 1000 THB', description: 'Google Play gift card code | Email delivery', category: 'Gift Card', price: 950, stock: 20, image_url: 'https://picsum.photos/seed/gp1000/400/300', is_active: true },
    // TopUp ROV Mall products
    { id: uuid(), seller_id: topupRovId, name: 'Free Fire Diamond 100', description: '100 Diamond | Instant delivery', category: 'Mobile Top-up', price: 89, stock: 300, image_url: 'https://picsum.photos/seed/ff100/400/300', is_active: true },
    { id: uuid(), seller_id: topupRovId, name: 'PUBG Mobile UC 600', description: '600 UC | Auto delivery', category: 'Mobile Top-up', price: 199, stock: 150, image_url: 'https://picsum.photos/seed/pubg600/400/300', is_active: true },
    // เติมเพชรราคาถูก products
    { id: uuid(), seller_id: เติมเพชรId, name: 'Spotify Premium 1 Month', description: 'Spotify Premium 1 month subscription', category: 'Subscription', price: 129, stock: 50, image_url: 'https://picsum.photos/seed/spotify1/400/300', is_active: true },
    { id: uuid(), seller_id: เติมเพชรId, name: 'YouTube Premium 1 Month', description: 'YouTube Premium 1 month subscription', category: 'Subscription', price: 159, stock: 50, image_url: 'https://picsum.photos/seed/yt1/400/300', is_active: true },
  ];

  console.log('\nInserting products...');
  const productIds = {};
  for (const p of newProducts) {
    const key = `${p.seller_id}:${p.name}`;
    if (existingSet.has(key)) {
      console.log('  SKIP (exists):', p.name);
      // Find existing ID
      const existing = existingProducts.find(ep => ep.seller_id === p.seller_id && ep.name === p.name);
      productIds[p.name] = existing ? existing.id : null;
      continue;
    }
    const { data, error } = await sb.from('products').insert(p).select('id').single();
    if (error) {
      console.error('  ERROR:', p.name, error.message);
    } else {
      console.log('  +:', p.name);
      productIds[p.name] = data.id;
    }
  }

  console.log('\nDone! Product IDs for reference:');
  Object.entries(productIds).forEach(([name, id]) => console.log(' ', name, '->', id ? id.slice(0,8) : 'N/A'));
}

seed().catch(console.error);
