require('dotenv').config({ path: '/Users/min/dev/Keyzaa/.env.local' });
const { getDB } = require('./lib/mongodb/index.cjs');
const bcrypt = require('bcryptjs');

async function fix() {
  const db = getDB();
  const user = await db.collection('users').findOne({ email: 'admin@keyzaa.local' });
  console.log('Current hash prefix:', user?.password_hash?.substring(0, 15));
  console.log('Has hash:', !!user?.password_hash);

  const match = await bcrypt.compare('demo123', user.password_hash);
  console.log('demo123 matches current hash:', match);

  if (!match) {
    const newHash = await bcrypt.hash('demo123', 10);
    await db.collection('users').updateOne(
      { email: 'admin@keyzaa.local' },
      { $set: { password_hash: newHash } }
    );
    console.log('Password updated to demo123');
  }

  process.exit(0);
}

fix().catch(e => { console.error('Error:', e.message); process.exit(1); });
