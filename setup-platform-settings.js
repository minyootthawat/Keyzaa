/**
 * Create default platform_settings in MongoDB
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function main() {
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  const db = mongoClient.db(process.env.MONGODB_DB || 'keyzaa');
  await mongoClient.connect();

  const collection = db.collection('platform_settings');

  // Check if default settings exist
  const existing = await collection.findOne({ key: 'default' });
  if (existing) {
    console.log('platform_settings already exist:', existing);
  } else {
    await collection.insertOne({
      key: 'default',
      platform_fee_percent: 5,
      min_payout_threshold: 100,
      max_refund_days: 7,
      maintenance_mode: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('✅ Created default platform_settings');
  }

  await mongoClient.close();
}

main().catch(console.error);
