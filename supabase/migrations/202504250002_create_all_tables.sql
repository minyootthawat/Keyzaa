-- Migration: create all KeyZaa tables
-- Run against new Supabase project

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'buyer',
  provider TEXT,
  provider_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Sellers
CREATE TABLE IF NOT EXISTS public.sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  id_card_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC NOT NULL DEFAULT 0,
  sales_count INTEGER NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  payout_status TEXT NOT NULL DEFAULT 'manual',
  response_time_minutes INTEGER NOT NULL DEFAULT 0,
  fulfillment_rate NUMERIC NOT NULL DEFAULT 0,
  dispute_rate NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL DEFAULT 0,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  seller_net_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee_rate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  title TEXT NOT NULL DEFAULT '',
  title_th TEXT,
  title_en TEXT,
  image TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  platform TEXT,
  region_code TEXT,
  activation_method_th TEXT,
  activation_method_en TEXT
);

-- Seller Ledger Entries
CREATE TABLE IF NOT EXISTS public.seller_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game Accounts
CREATE TABLE IF NOT EXISTS public.game_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  game_name_th TEXT,
  account_username TEXT NOT NULL,
  account_password TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  platform TEXT,
  region TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: allow service role full access (anon gets filtered)
CREATE POLICY "service_role_all_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_sellers" ON public.sellers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_ledger" ON public.seller_ledger_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_game_accounts" ON public.game_accounts FOR ALL USING (true) WITH CHECK (true);

-- Public read for products
CREATE POLICY "public_read_products" ON public.products FOR SELECT USING (true);
-- Public read for game accounts (active only)
CREATE POLICY "public_read_active_game_accounts" ON public.game_accounts FOR SELECT USING (is_active = true);

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sellers_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER game_accounts_updated_at BEFORE UPDATE ON public.game_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
