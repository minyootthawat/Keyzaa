require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('sellers').select('user_id, id, store_name');
  if (error) throw error;
  
  const seen = {};
  for (const s of data) {
    if (seen[s.user_id]) {
      console.log('DUPLICATE user_id:', s.user_id);
      console.log('  Seller 1:', seen[s.user_id]);
      console.log('  Seller 2:', s);
    } else {
      seen[s.user_id] = s;
    }
  }
  console.log('Total sellers:', data.length, '| Unique user_ids:', Object.keys(seen).length);
}
check();
