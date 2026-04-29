-- KeyZaa Supabase Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- Admin password for all accounts: demo123

-- Clear existing data
delete from public.ledger_entries;
delete from public.orders;
delete from public.products;
delete from public.sellers;
delete from public.admins;
delete from public.users;

-- ─── Admin entry (password_hash lives on admins table directly, no linked user needed) ───
-- password: demo123
insert into public.admins (id, email, password_hash, role, is_super_admin, permissions, created_at)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin@keyzaa.local',
  '$2b$10$zoXnY4DxhBowUHjw9UbybeAYPU4UH2GmGHaLm1JsV/jRUeEJ8L.TW',
  'super_admin',
  true,
  '["admin:access","admin:overview:read","admin:orders:read","admin:orders:write","admin:sellers:read","admin:sellers:write","admin:products:read","admin:products:write","admin:analytics:read","admin:settings:write","admin:listings:read","admin:users:read","admin:users:write"]'::jsonb,
  now()
);

-- ─── Demo buyer user ─────────────────────────────────────────────────────────
insert into public.users (id, email, name, role, password_hash, is_email_verified, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'testbuyer@keyzaa.local',
  'Test Buyer',
  'buyer',
  '$2b$10$zoXnY4DxhBowUHjw9UbybeAYPU4UH2GmGHaLm1JsV/jRUeEJ8L.TW',
  true,
  now(),
  now()
);

-- ─── Demo seller user + seller record ─────────────────────────────────────────
insert into public.users (id, email, name, role, password_hash, is_email_verified, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'testseller@keyzaa.local',
  'Test Seller',
  'seller',
  '$2b$10$zoXnY4DxhBowUHjw9UbybeAYPU4UH2GmGHaLm1JsV/jRUeEJ8L.TW',
  true,
  now(),
  now()
);

insert into public.sellers (
  id, user_id, store_name, store_slug, description,
  status, is_verified, rating, total_sales, balance, pending_balance,
  payout_status, response_time_minutes, fulfillment_rate, dispute_rate,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid,
  'RovZone Shop',
  'rovzone-shop',
  'ร้านเติมเกม ROV และเกมอื่นๆ ราคาถูก จัดส่งทันที',
  'active',
  true,
  4.8,
  1247,
  0,
  0,
  'manual',
  5,
  98.5,
  0.2,
  now(),
  now()
);

-- ─── Demo products ────────────────────────────────────────────────────────────
insert into public.products (id, public_id, seller_id, name, description, category, price, stock, status, is_featured, tags, created_at, updated_at) values
(
  '00000000-0000-0000-0000-000000000010'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'ROV Diamond 100',
  'แรงค์ Diamond 100 เพชร พร้อมสกินฟรี',
  'topup',
  99.00,
  999,
  'active',
  false,
  '["rov", "diamond", "topup"]'::jsonb,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000011'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'ROV Diamond 500',
  'แรงค์ Diamond 500 เพชร',
  'topup',
  459.00,
  999,
  'active',
  true,
  '["rov", "diamond", "topup"]'::jsonb,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000012'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'ROV Diamond 1000',
  'แรงค์ Diamond 1000 เพชร พร้อมสกินพิเศษ',
  'topup',
  899.00,
  999,
  'active',
  false,
  '["rov", "diamond", "topup"]'::jsonb,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000013'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'Genshin Impact 60 Genesis Crystal',
  'Genesis Crystal สำหรับเติมเกม Genshin Impact',
  'topup',
  65.00,
  999,
  'active',
  false,
  '["genshin", "crystal", "topup"]'::jsonb,
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000014'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'Mobile Legends 50 Diamonds',
  'Diamond สำหรับเติม MLBB',
  'topup',
  55.00,
  999,
  'active',
  false,
  '["mlbb", "diamond", "topup"]'::jsonb,
  now(),
  now()
);

-- ─── Demo orders ─────────────────────────────────────────────────────────────
insert into public.orders (id, public_id, buyer_id, seller_id, items, total_price, gross_amount, commission_amount, seller_net_amount, platform_fee_rate, currency, status, payment_status, fulfillment_status, payment_method, created_at, updated_at) values
(
  '00000000-0000-0000-0000-000000000020'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  '[{"product_id":"00000000-0000-0000-0000-000000000010","title":"ROV Diamond 100","price":99.00,"quantity":1}]'::jsonb,
  99.00,
  99.00,
  4.95,
  94.05,
  0.05,
  'THB',
  'completed',
  'paid',
  'delivered',
  'promptpay',
  now() - interval '5 days',
  now() - interval '5 days'
),
(
  '00000000-0000-0000-0000-000000000021'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  '[{"product_id":"00000000-0000-0000-0000-000000000011","title":"ROV Diamond 500","price":459.00,"quantity":1}]'::jsonb,
  459.00,
  459.00,
  22.95,
  436.05,
  0.05,
  'THB',
  'paid',
  'paid',
  'processing',
  'promptpay',
  now() - interval '2 days',
  now() - interval '2 days'
),
(
  '00000000-0000-0000-0000-000000000022'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  '[{"product_id":"00000000-0000-0000-0000-000000000012","title":"ROV Diamond 1000","price":899.00,"quantity":1}]'::jsonb,
  899.00,
  899.00,
  44.95,
  854.05,
  0.05,
  'THB',
  'pending',
  'pending',
  'pending',
  'promptpay',
  now() - interval '1 day',
  now() - interval '1 day'
);

-- ─── Ledger entries ─────────────────────────────────────────────────────────
insert into public.ledger_entries (id, public_id, seller_id, type, amount, order_id, description, created_at) values
(
  '00000000-0000-0000-0000-000000000030'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'sale',
  99.00,
  '00000000-0000-0000-0000-000000000020'::uuid,
  'Order #1 - ROV Diamond 100',
  now() - interval '5 days'
),
(
  '00000000-0000-0000-0000-000000000031'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'commission_fee',
  -4.95,
  '00000000-0000-0000-0000-000000000020'::uuid,
  'Platform fee 5% - Order #1',
  now() - interval '5 days'
),
(
  '00000000-0000-0000-0000-000000000032'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'sale',
  459.00,
  '00000000-0000-0000-0000-000000000021'::uuid,
  'Order #2 - ROV Diamond 500',
  now() - interval '2 days'
),
(
  '00000000-0000-0000-0000-000000000033'::uuid,
  gen_random_uuid()::text,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'commission_fee',
  -22.95,
  '00000000-0000-0000-0000-000000000021'::uuid,
  'Platform fee 5% - Order #2',
  now() - interval '2 days'
);
