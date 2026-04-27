require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const tables = ['users', 'sellers', 'products', 'orders', 'order_items', 'ledger', 'admins', 'platform_settings'];
  for (const table of tables) {
    const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`${table}: ${error ? 'ERROR: ' + error.message : count + ' rows'}`);
  }
}
check();
