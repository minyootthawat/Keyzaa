/**
 * Create a test user with password hash in MongoDB
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const db = client.db('keyzaa');
  await client.connect();

  const passwordHash = await bcrypt.hash('demo123', 10);

  // Create test buyer
  const buyerId = '11111111-1111-1111-1111-111111111111';
  const existing = await db.collection('users').findOne({ email: 'testbuyer@keyzaa.local' });
  if (existing) {
    console.log('Test buyer already exists');
  } else {
    await db.collection('users').insertOne({
      id: buyerId,
      _id: buyerId,
      email: 'testbuyer@keyzaa.local',
      name: 'Test Buyer',
      phone: null,
      avatar_url: null,
      role: 'buyer',
      email_verified: true,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
    });
    console.log('✅ Created test buyer: testbuyer@keyzaa.local / demo123');
  }

  // Create test seller with seller record
  const sellerUserId = '22222222-2222-2222-2222-222222222222';
  const sellerId = '33333333-3333-3333-3333-333333333333';
  const existingSeller = await db.collection('users').findOne({ email: 'testseller@keyzaa.local' });
  if (existingSeller) {
    console.log('Test seller already exists');
  } else {
    await db.collection('users').insertOne({
      id: sellerUserId,
      _id: sellerUserId,
      email: 'testseller@keyzaa.local',
      name: 'Test Seller',
      phone: null,
      avatar_url: null,
      role: 'seller',
      email_verified: true,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
    });

    await db.collection('sellers').insertOne({
      id: sellerId,
      _id: sellerId,
      user_id: sellerUserId,
      store_name: 'Test Store',
      store_description: 'A test store',
      store_logo: null,
      balance: 1000,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('✅ Created test seller: testseller@keyzaa.local / demo123 (sellerId: ' + sellerId + ')');
  }

  await client.close();
}

main().catch(console.error);
