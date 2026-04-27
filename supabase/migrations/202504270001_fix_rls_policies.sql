-- Migration: Fix RLS policy gaps identified during security review
-- Run with: supabase db push (or apply via Supabase dashboard)
-- Date: 2026-04-27

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 1: game_accounts lacks public read policy (present in schema.sql but missing here)
-- Fix: Add public read policy for active game accounts
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_active_game_accounts" ON game_accounts;
CREATE POLICY "public_read_active_game_accounts" ON game_accounts
    FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 2: products lacks public read policy (present in schema.sql but missing here)
-- Fix: Add public read policy for active products
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products
    FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 3: sellers has no public read (needed for seller profile pages)
-- Fix: Add public read policy for verified sellers only
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_verified_sellers" ON sellers;
CREATE POLICY "public_read_verified_sellers" ON sellers
    FOR SELECT USING (verified = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 4: Conflict between schema.sql (RLS disabled for orders) and this migration (RLS enabled)
-- The migration 202504260001 enabled RLS on orders with service_role only.
-- This is CORRECT. schema.sql disabling RLS on orders is WRONG.
-- Ensure orders has RLS enabled (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Verify orders has proper policy (service_role only - correct for order data security)
DROP POLICY IF EXISTS "orders_all" ON orders;
CREATE POLICY "orders_all" ON orders
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 5: order_items has no public read - needed for order confirmation pages
-- Fix: Add SELECT policy for service_role only (order items contain sensitive price info)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "order_items_all" ON order_items;
CREATE POLICY "order_items_all" ON order_items
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 6: seller_ledger_entries has RLS disabled in schema.sql but enabled in migration
-- The migration approach is correct. Enforce RLS.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE seller_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller_ledger_all" ON seller_ledger_entries;
CREATE POLICY "seller_ledger_all" ON seller_ledger_entries
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 7: users table - add policy that allows service_role full access
-- The migration has: users_select, users_update (service_role OR uid = id)
-- We need a separate policy for service_role full access
-- ─────────────────────────────────────────────────────────────────────────────
-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_update" ON users;

-- Service role gets full access
DROP POLICY IF EXISTS "service_role_all_users" ON users;
CREATE POLICY "service_role_all_users" ON users
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Users can read their own data (for profile pages)
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users
    FOR SELECT USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 8: sellers table - ensure service_role full access
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "sellers_all" ON sellers;
CREATE POLICY "sellers_all" ON sellers
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 9: products table - ensure service_role full access + public read
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "products_all" ON products;
CREATE POLICY "products_all" ON products
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- ISSUE 10: game_accounts - ensure service_role full access
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "game_accounts_all" ON game_accounts;
CREATE POLICY "game_accounts_all" ON game_accounts
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

COMMIT;
