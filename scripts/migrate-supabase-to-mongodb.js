/**
 * Migrate data from Supabase to MongoDB
 * Run: node scripts/migrate-supabase-to-mongodb.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { MongoClient } = require('mongodb');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const mongoClient = new MongoClient(process.env.MONGODB_URI);
const db = mongoClient.db(process.env.MONGODB_DB || 'keyzaa');

let stats = {};

async function migrateUsers() {
  console.log('\n📦 Migrating users...');
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  
  const collection = db.collection('users');
  const docs = data.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone || null,
    avatar_url: u.avatar_url || null,
    role: u.role || 'user',
    email_verified: u.email_verified || false,
    created_at: u.created_at,
    updated_at: u.updated_at || u.created_at,
    last_login: u.last_login || null,
  }));
  
  if (docs.length > 0) {
    await collection.insertMany(docs);
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.createIndex({ id: 1 });
    await collection.createIndex({ role: 1 });
  }
  
  stats.users = docs.length;
  console.log(`  ✅ ${docs.length} users migrated`);
}

async function migrateSellers() {
  console.log('\n📦 Migrating sellers...');
  const { data, error } = await supabase.from('sellers').select('*');
  if (error) throw error;
  
  const collection = db.collection('sellers');
  
  // Use bulk upsert to handle duplicate user_ids
  const operations = data.map(s => ({
    updateOne: {
      filter: { user_id: s.user_id },
      update: {
        $set: {
          id: s.id,
          user_id: s.user_id,
          store_name: s.store_name,
          store_description: s.store_description || null,
          store_logo: s.store_logo || null,
          balance: s.balance || 0,
          status: s.status || 'active',
          created_at: s.created_at,
          updated_at: s.updated_at || s.created_at,
        }
      },
      upsert: true,
    }
  }));
  
  if (operations.length > 0) {
    await collection.bulkWrite(operations, { ordered: false });
    await collection.createIndex({ user_id: 1 }, { unique: true });
    await collection.createIndex({ id: 1 });
    await collection.createIndex({ status: 1 });
  }
  
  stats.sellers = data.length;
  console.log(`  ✅ ${data.length} sellers migrated (upserted)`);
}

async function migrateProducts() {
  console.log('\n📦 Migrating products...');
  const { data, error } = await supabase.from('products').select('*');
  if (error) throw error;
  
  const collection = db.collection('products');
  const docs = data.map(p => ({
    id: p.id,
    seller_id: p.seller_id,
    name: p.name,
    description: p.description || null,
    price: p.price,
    images: p.images || [],
    category: p.category || null,
    stock: p.stock || 0,
    min_balance: p.min_balance || 0,
    game_id: p.game_id || null,
    status: p.status || 'active',
    created_at: p.created_at,
    updated_at: p.updated_at || p.created_at,
  }));
  
  if (docs.length > 0) {
    await collection.insertMany(docs);
    await collection.createIndex({ id: 1 });
    await collection.createIndex({ seller_id: 1 });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ status: 1 });
  }
  
  stats.products = docs.length;
  console.log(`  ✅ ${docs.length} products migrated`);
}

async function migrateOrders() {
  console.log('\n📦 Migrating orders...');
  const { data, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  
  const collection = db.collection('orders');
  const docs = data.map(o => ({
    id: o.id,
    buyer_id: o.buyer_id,
    seller_id: o.seller_id,
    total_amount: o.total_amount,
    status: o.status || 'pending',
    shipping_status: o.shipping_status || null,
    payment_status: o.payment_status || 'pending',
    shipping_address: o.shipping_address || null,
    created_at: o.created_at,
    updated_at: o.updated_at || o.created_at,
  }));
  
  if (docs.length > 0) {
    await collection.insertMany(docs);
    await collection.createIndex({ id: 1 });
    await collection.createIndex({ buyer_id: 1 });
    await collection.createIndex({ seller_id: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ created_at: -1 });
  }
  
  stats.orders = docs.length;
  console.log(`  ✅ ${docs.length} orders migrated`);
}

async function migrateOrderItems() {
  console.log('\n📦 Migrating order_items...');
  const { data, error } = await supabase.from('order_items').select('*');
  if (error) throw error;
  
  const collection = db.collection('order_items');
  const docs = data.map(oi => ({
    id: oi.id,
    order_id: oi.order_id,
    product_id: oi.product_id,
    quantity: oi.quantity,
    price: oi.price,
    created_at: oi.created_at,
  }));
  
  if (docs.length > 0) {
    await collection.insertMany(docs);
    await collection.createIndex({ id: 1 });
    await collection.createIndex({ order_id: 1 });
    await collection.createIndex({ product_id: 1 });
  }
  
  stats.order_items = docs.length;
  console.log(`  ✅ ${docs.length} order_items migrated`);
}

async function migrateLedger() {
  console.log('\n📦 Migrating ledger...');
  const { data, error } = await supabase.from('ledger').select('*');
  if (error) {
    console.log(`  ⚠️  ledger error: ${error.message} (table may not exist)`);
    stats.ledger = 0;
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('  ℹ️  No ledger entries to migrate');
    stats.ledger = 0;
    return;
  }
  
  const collection = db.collection('ledger');
  const docs = data.map(l => ({
    id: l.id,
    seller_id: l.seller_id,
    order_id: l.order_id || null,
    type: l.type,
    amount: l.amount,
    balance_after: l.balance_after,
    description: l.description || null,
    created_at: l.created_at,
  }));
  
  await collection.insertMany(docs);
  await collection.createIndex({ id: 1 });
  await collection.createIndex({ seller_id: 1 });
  await collection.createIndex({ order_id: 1 });
  await collection.createIndex({ created_at: -1 });
  
  stats.ledger = docs.length;
  console.log(`  ✅ ${docs.length} ledger entries migrated`);
}

async function migrateAdmins() {
  console.log('\n📦 Migrating admins...');
  const { data, error } = await supabase.from('admins').select('*');
  if (error) {
    console.log(`  ⚠️  admins error: ${error.message} (table may not exist)`);
    stats.admins = 0;
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('  ℹ️  No admins to migrate');
    stats.admins = 0;
    return;
  }
  
  const collection = db.collection('admins');
  const docs = data.map(a => ({
    id: a.id,
    user_id: a.user_id || null,
    email: a.email,
    role: a.role || 'support_admin',
    permissions: a.permissions || [],
    created_by: a.created_by || null,
    created_at: a.created_at,
    updated_at: a.updated_at || a.created_at,
  }));
  
  await collection.insertMany(docs);
  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ id: 1 });
  await collection.createIndex({ role: 1 });
  
  stats.admins = docs.length;
  console.log(`  ✅ ${docs.length} admins migrated`);
}

async function migratePlatformSettings() {
  console.log('\n📦 Migrating platform_settings...');
  const { data, error } = await supabase.from('platform_settings').select('*');
  if (error) {
    console.log(`  ⚠️  platform_settings error: ${error.message} (table may not exist)`);
    stats.platform_settings = 0;
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('  ℹ️  No platform_settings to migrate — creating default settings');
    const collection = db.collection('platform_settings');
    await collection.insertOne({
      key: 'default',
      platform_fee_percent: 5,
      min_payout_threshold: 100,
      max_refund_days: 7,
      maintenance_mode: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    stats.platform_settings = 1;
    console.log('  ✅ Created default platform_settings');
    return;
  }
  
  const collection = db.collection('platform_settings');
  const docs = data.map(s => ({
    key: s.key,
    platform_fee_percent: s.platform_fee_percent,
    min_payout_threshold: s.min_payout_threshold,
    max_refund_days: s.max_refund_days,
    maintenance_mode: s.maintenance_mode || false,
    created_at: s.created_at,
    updated_at: s.updated_at || s.created_at,
  }));
  
  await collection.insertMany(docs);
  await collection.createIndex({ key: 1 }, { unique: true });
  
  stats.platform_settings = docs.length;
  console.log(`  ✅ ${docs.length} platform_settings migrated`);
}

async function main() {
  console.log('🚀 Starting Supabase → MongoDB migration');
  console.log(`   Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   MongoDB: ${process.env.MONGODB_URI}/${process.env.MONGODB_DB || 'keyzaa'}`);
  
  try {
    await mongoClient.connect();
    console.log('\n✅ Connected to MongoDB');
    
    // Run migrations
    await migrateUsers();
    await migrateSellers();
    await migrateProducts();
    await migrateOrders();
    await migrateOrderItems();
    await migrateLedger();
    await migrateAdmins();
    await migratePlatformSettings();
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    let total = 0;
    for (const [table, count] of Object.entries(stats)) {
      console.log(`   ${table.padEnd(20)} ${count} documents`);
      total += count;
    }
    console.log('='.repeat(50));
    console.log(`   TOTAL: ${total} documents migrated`);
    console.log('='.repeat(50));
    
    // Verify
    console.log('\n🔍 Verifying MongoDB collections...');
    const collections = await db.listCollections().toArray();
    console.log(`   Collections created: ${collections.map(c => c.name).join(', ')}`);
    
    for (const name of ['users', 'sellers', 'products', 'orders', 'admins']) {
      const count = await db.collection(name).estimatedDocumentCount();
      console.log(`   ${name}: ${count} documents`);
    }
    
    console.log('\n🎉 Migration complete!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoClient.close();
    process.exit(0);
  }
}

main();
