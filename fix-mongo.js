/**
 * Drop all MongoDB collections so migration can run fresh
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function fix() {
  const mongoClient = new MongoClient(process.env.MONGODB_URI);
  const db = mongoClient.db(process.env.MONGODB_DB || 'keyzaa');
  await mongoClient.connect();

  const collections = ['users', 'sellers', 'products', 'orders', 'order_items', 'ledger', 'admins', 'platform_settings'];
  for (const c of collections) {
    try {
      await db.collection(c).drop();
      console.log('Dropped:', c);
    } catch (e) {
      if (e.codeName !== 'NamespaceNotFound') {
        console.log('Error dropping', c, ':', e.message);
      }
    }
  }

  await mongoClient.close();
  console.log('All collections dropped. Run migration again.');
}

fix().catch(console.error);
