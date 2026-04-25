-- Migration: Add missing tables and columns for KeyZaa
-- Run with: supabase db push (or apply via Supabase dashboard)

BEGIN;

-- Add listing_status to products if not exists
DO $$ BEGIN
  ALTER TABLE products ADD COLUMN listing_status TEXT DEFAULT 'active';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add missing seller columns if not exist
DO $$ BEGIN
  ALTER TABLE sellers ADD COLUMN rating DECIMAL(3,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE sellers ADD COLUMN sales_count INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE sellers ADD COLUMN balance DECIMAL(12,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE sellers ADD COLUMN pending_balance DECIMAL(12,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID,
  game_account_id UUID,
  seller_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  product_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing order columns
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN buyer_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN seller_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN product_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN fulfillment_status TEXT DEFAULT 'pending';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN gross_amount DECIMAL(12,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(12,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN seller_net_amount DECIMAL(12,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN platform_fee_rate DECIMAL(5,4) DEFAULT 0.05;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN payment_method TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create game_accounts table
CREATE TABLE IF NOT EXISTS game_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  game_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_level INTEGER DEFAULT 1,
  price DECIMAL(12,2) NOT NULL,
  description TEXT,
  image_urls TEXT[] DEFAULT '{}',
  listing_status TEXT DEFAULT 'active' CHECK (listing_status IN ('active', 'sold', 'inactive')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create seller_ledger_entries table (may already exist)
CREATE TABLE IF NOT EXISTS seller_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sale', 'commission_fee', 'withdrawal', 'refund', 'topup')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop broken RLS policies that cause infinite recursion on users
DROP POLICY IF EXISTS "Allow authenticated inserts" ON users;
DROP POLICY IF EXISTS "Allow authenticated reads" ON users;
DROP POLICY IF EXISTS "Allow authenticated updates" ON users;
DROP POLICY IF EXISTS "users auth insert" ON users;
DROP POLICY IF EXISTS "users auth select" ON users;
DROP POLICY IF EXISTS "users auth update" ON users;

-- Recreate RLS policies for users (simple version)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = id);

-- RLS for sellers
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sellers auth all" ON sellers;
CREATE POLICY "sellers_all" ON sellers FOR ALL USING (auth.role() = 'service_role');

-- RLS for products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products auth all" ON products;
CREATE POLICY "products_all" ON products FOR ALL USING (auth.role() = 'service_role');

-- RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders auth all" ON orders;
CREATE POLICY "orders_all" ON orders FOR ALL USING (auth.role() = 'service_role');

-- RLS for game_accounts
ALTER TABLE game_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_accounts_all" ON game_accounts FOR ALL USING (auth.role() = 'service_role');

-- RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_all" ON order_items FOR ALL USING (auth.role() = 'service_role');

-- RLS for seller_ledger_entries
ALTER TABLE seller_ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller_ledger_all" ON seller_ledger_entries FOR ALL USING (auth.role() = 'service_role');

COMMIT;
