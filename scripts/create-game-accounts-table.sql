-- Create game_accounts table for KeyZaa
-- Run this in Supabase SQL Editor

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

-- RLS
ALTER TABLE public.game_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY " Sellers can manage own game accounts"
  ON public.game_accounts
  FOR ALL
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Anyone can view active game accounts"
  ON public.game_accounts
  FOR SELECT
  USING (is_active = true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_accounts_updated_at
  BEFORE UPDATE ON public.game_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
