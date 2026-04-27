/**
 * Create an admin user with password in MongoDB for testing
 */
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  const db = client.db('keyzaa');
  await client.connect();

  const passwordHash = await bcrypt.hash('admin123', 10);

  // Create admin user
  const adminUserId = '99999999-9999-9999-9999-999999999999';
  const existing = await db.collection('users').findOne({ email: 'admin@keyzaa.local' });
  if (existing) {
    console.log('Admin user already exists');
  } else {
    await db.collection('users').insertOne({
      id: adminUserId,
      _id: adminUserId,
      email: 'admin@keyzaa.local',
      name: 'Admin User',
      phone: null,
      avatar_url: null,
      role: 'buyer',
      email_verified: true,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
    });
    console.log('✅ Created admin user: admin@keyzaa.local / admin123');
  }

  // Create admin entry in admins collection
  const existingAdmin = await db.collection('admins').findOne({ email: 'admin@keyzaa.local' });
  if (existingAdmin) {
    console.log('Admin entry already exists');
  } else {
    await db.collection('admins').insertOne({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      _id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: adminUserId,
      email: 'admin@keyzaa.local',
      role: 'super_admin',
      permissions: [],
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('✅ Created admin entry (super_admin)');
  }

  await client.close();
}

main().catch(console.error);
