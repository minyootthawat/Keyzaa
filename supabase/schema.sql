-- KeyZaa Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard
-- ⚠️  This will DROP all existing tables and recreate them

-- ─── USERS ───────────────────────────────────────────────────────────────────
create table public.users (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,
  name             text not null,
  role             text not null default 'buyer'
                   check (role in ('buyer', 'seller', 'both')),
  password_hash    text,
  provider         text,
  provider_id      text,
  is_email_verified boolean not null default false,
  avatar_url       text,
  phone            text,
  last_login_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── SELLERS ─────────────────────────────────────────────────────────────────
create table public.sellers (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique
                      references public.users(id) on delete cascade,
  store_name          text not null,
  store_slug          text not null unique,
  description         text,
  avatar_url          text,
  phone               text,
  id_card_url         text,
  status              text not null default 'pending_verification'
                      check (status in ('active', 'suspended', 'pending_verification', 'deleted')),
  is_verified         boolean not null default false,
  rating              numeric(2, 1) not null default 0,
  total_sales         integer not null default 0,
  balance             numeric(12, 2) not null default 0,
  pending_balance     numeric(12, 2) not null default 0,
  payout_status       text not null default 'manual',
  response_time_minutes integer not null default 5,
  fulfillment_rate    numeric(5, 2) not null default 100,
  dispute_rate        numeric(5, 2) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  public_id    text not null unique default gen_random_uuid()::text,
  seller_id    uuid not null
               references public.sellers(id) on delete cascade,
  name         text not null,
  description  text,
  category     text not null default 'general',
  price        numeric(10, 2) not null,
  stock        integer not null default 0,
  image_url    text,
  status       text not null default 'active'
               check (status in ('active', 'inactive', 'out_of_stock', 'deleted')),
  is_featured  boolean not null default false,
  tags         jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── ORDERS ─────────────────────────────────────────────────────────────────
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  public_id           text not null unique default gen_random_uuid()::text,
  buyer_id            uuid
                     references public.users(id) on delete set null,
  seller_id           uuid
                     references public.sellers(id) on delete set null,
  items               jsonb not null default '[]',
  -- items format: [{ product_id, title, price, quantity }]
  total_price         numeric(12, 2) not null,
  gross_amount        numeric(12, 2) not null,
  commission_amount   numeric(12, 2) not null,
  seller_net_amount   numeric(12, 2) not null,
  platform_fee_rate   numeric(3, 2) not null default 0.05,
  currency            text not null default 'THB',
  status              text not null default 'pending'
                     check (status in ('pending', 'paid', 'processing', 'completed', 'cancelled')),
  payment_status      text not null default 'pending'
                     check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status  text not null default 'pending'
                     check (fulfillment_status in ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
  payment_method      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── LEDGER_ENTRIES ──────────────────────────────────────────────────────────
create table public.ledger_entries (
  id          uuid primary key default gen_random_uuid(),
  public_id   text not null unique default gen_random_uuid()::text,
  seller_id   uuid not null
              references public.sellers(id) on delete cascade,
  type        text not null
              check (type in ('sale', 'commission_fee', 'withdrawal', 'refund', 'topup')),
  amount      numeric(12, 2) not null,
  order_id    uuid references public.orders(id) on delete set null,
  description text,
  created_at  timestamptz not null default now()
);

-- ─── ADMINS ──────────────────────────────────────────────────────────────────
create table public.admins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'super_admin',
  is_super_admin boolean not null default false,
  permissions   jsonb not null default '[]',
  created_by    uuid references public.admins(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index idx_admins_email on public.admins(email);

-- ─── GAME_ACCOUNTS ───────────────────────────────────────────────────────────
create table public.game_accounts (
  id                 uuid primary key default gen_random_uuid(),
  seller_id          uuid not null
                     references public.sellers(id) on delete cascade,
  game_name          text not null,
  game_name_th       text,
  account_username   text not null,
  account_password   text not null,
  description        text,
  price              numeric(10, 2) not null default 0,
  stock              integer not null default 1,
  is_active          boolean not null default true,
  platform           text,
  region             text,
  image_url          text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
create index idx_products_seller_id   on public.products(seller_id);
create index idx_products_status      on public.products(status);
create index idx_products_category    on public.products(category);
create index idx_orders_buyer_id      on public.orders(buyer_id);
create index idx_orders_seller_id     on public.orders(seller_id);
create index idx_orders_status        on public.orders(status);
create index idx_orders_created_at     on public.orders(created_at desc);
create index idx_ledger_seller_id     on public.ledger_entries(seller_id);
create index idx_ledger_order_id       on public.ledger_entries(order_id);
create index idx_sellers_user_id      on public.sellers(user_id);
create index idx_sellers_status       on public.sellers(status);
create index idx_admins_user_id       on public.admins(user_id);
create index idx_game_accounts_seller_id on public.game_accounts(seller_id);
create index idx_game_accounts_is_active on public.game_accounts(is_active);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.users         enable row level security;
alter table public.sellers       enable row level security;
alter table public.products      enable row level security;
alter table public.orders        enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.admins         enable row level security;
alter table public.game_accounts  enable row level security;

-- Service role bypasses RLS (used by server-side API routes)
create policy "Service role full access" on public.users
  using (auth.role() = 'service_role');
create policy "Service role full access" on public.sellers
  using (auth.role() = 'service_role');
create policy "Service role full access" on public.products
  using (auth.role() = 'service_role');
create policy "Service role full access" on public.orders
  using (auth.role() = 'service_role');
create policy "Service role full access" on public.ledger_entries
  using (auth.role() = 'service_role');
create policy "Service role full access" on public.admins
  using (auth.role() = 'service_role');
create policy "Service role full access" on public.game_accounts
  using (auth.role() = 'service_role');
