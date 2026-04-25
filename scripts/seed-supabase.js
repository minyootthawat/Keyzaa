/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

async function main() {
  loadEnv();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const passwordHash = await bcrypt.hash('demo123', 12);
  const now = new Date().toISOString();

  const users = [
    { email: 'buyer@demo.keyzaa.local', role: 'buyer', name: 'Demo Buyer' },
    { email: 'seller@demo.keyzaa.local', role: 'seller', name: 'Demo Seller' },
    // Admin: role='buyer' satisfies DB constraint; isAdmin comes from getAdminAccessForEmail (admins table)
    { email: 'admin@demo.keyzaa.local', role: 'buyer', name: 'Demo Admin' },
  ];

  for (const u of users) {
    // Check if exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', u.email)
      .single();

    if (existing) {
      // Update password hash
      const { error: updErr } = await supabase
        .from('users')
        .update({ password_hash: passwordHash, name: u.name, role: u.role, updated_at: now })
        .eq('id', existing.id);
      if (updErr) console.log(u.role + ' update error: ' + updErr.message);
      else console.log(u.role + ': updated');
    } else {
      // Create auth user
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'demo123',
        email_confirm: true,
        user_metadata: { role: u.role, name: u.name }
      });

      if (authErr) {
        console.log(u.role + ' auth error: ' + authErr.message);
        continue;
      }

      if (!authUser.user) {
        console.log(u.role + ' auth error: no user returned');
        continue;
      }
      const userId = authUser.user.id;

      // Insert into users table
      const { error: insErr } = await supabase.from('users').insert({
        id: userId,
        email: u.email,
        password_hash: passwordHash,
        name: u.name,
        role: u.role,
        created_at: now,
        updated_at: now
      });

      if (insErr) console.log(u.role + ' insert error: ' + insErr.message);
      else console.log(u.role + ': created ' + userId);
    }
  }

  // Admin access is determined by ADMIN_EMAILS env var, not a database table.
  // getAdminAccessForEmail checks process.env.ADMIN_EMAILS for admin emails.
  // Set ADMIN_EMAILS=admin@demo.keyzaa.local:super_admin in Vercel for admin access.

  console.log('\nDone. Test credentials: buyer@seller@admin@demo.keyzaa.local / demo123');
}

main().catch(err => { console.error(err); process.exit(1); });
