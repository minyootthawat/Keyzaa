-- Keyzaa Marketplace Schema
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table if not exists public.users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    name text not null,
    password_hash text,
    role text not null default 'buyer' check (role in ('buyer', 'seller', 'both')),
    provider text,
    provider_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    last_login_at timestamptz
);
create index if not exists idx_users_email on public.users (email);

-- SELLERS TABLE
create table if not exists public.sellers (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references public.users(id) on delete cascade,
    store_name text not null,
    phone text,
    id_card_url text,
    verified boolean not null default false,
    rating numeric(3, 2) default 0,
    sales_count integer default 0,
    balance numeric(10, 2) default 0,
    pending_balance numeric(10, 2) default 0,
    payout_status text default 'manual' check (payout_status in ('manual', 'enabled')),
    response_time_minutes integer default 5,
    fulfillment_rate numeric(5, 2) default 100,
    dispute_rate numeric(5, 2) default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- PRODUCTS TABLE
create table if not exists public.products (
    id uuid primary key default uuid_generate_v4(),
    seller_id uuid not null references public.sellers(id) on delete cascade,
    name text not null,
    description text,
    category text not null,
    price numeric(10, 2) not null,
    stock integer not null default 0,
    image_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_products_seller_id on public.products (seller_id);

-- ORDERS TABLE
create table if not exists public.orders (
    id uuid primary key default uuid_generate_v4(),
    buyer_id uuid not null references public.users(id) on delete restrict,
    seller_id uuid not null references public.sellers(id) on delete restrict,
    product_id uuid not null references public.products(id) on delete restrict,
    quantity integer not null check (quantity > 0),
    total_price numeric(10, 2) not null,
    gross_amount numeric(10, 2) default 0,
    commission_amount numeric(10, 2) default 0,
    seller_net_amount numeric(10, 2) default 0,
    platform_fee_rate numeric(5, 4) default 0.05,
    currency text default 'THB',
    status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled')),
    payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
    fulfillment_status text default 'pending' check (fulfillment_status in ('pending', 'processing', 'delivered', 'failed', 'cancelled')),
    payment_method text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ORDER ITEMS TABLE (supports multiple items per order)
create table if not exists public.order_items (
    id uuid primary key default uuid_generate_v4(),
    order_id uuid not null references public.orders(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete restrict,
    title text not null,
    title_th text,
    title_en text,
    image text,
    price numeric(10, 2) not null,
    quantity integer not null check (quantity > 0),
    platform text,
    region_code text,
    activation_method_th text,
    activation_method_en text
);
create index if not exists idx_orders_seller_id on public.orders (seller_id);
create index if not exists idx_orders_buyer_id on public.orders (buyer_id);

-- SELLER LEDGER ENTRIES TABLE
create table if not exists public.seller_ledger_entries (
    id uuid primary key default uuid_generate_v4(),
    seller_id uuid not null references public.sellers(id) on delete cascade,
    type text not null check (type in ('sale', 'commission_fee', 'withdrawal')),
    amount numeric(10, 2) not null,
    order_id uuid references public.orders(id) on delete set null,
    description text,
    created_at timestamptz not null default now()
);
create index if not exists idx_seller_ledger_entries_seller_id on public.seller_ledger_entries (seller_id);

-- TRIGGER FUNCTIONS
create or replace function public.handle_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create or replace function public.handle_users_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.handle_users_updated_at();

create or replace function public.handle_sellers_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists set_sellers_updated_at on public.sellers;
create trigger set_sellers_updated_at before update on public.sellers for each row execute function public.handle_sellers_updated_at();

create or replace function public.handle_products_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.handle_products_updated_at();

create or replace function public.handle_orders_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.handle_orders_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.seller_ledger_entries enable row level security;

-- USERS POLICIES
drop policy if exists "Users can read own data" on public.users;
create policy "Users can read own data" on public.users for select using (auth.uid() = id);

drop policy if exists "Users can update own data" on public.users;
create policy "Users can update own data" on public.users for update using (auth.uid() = id);

drop policy if exists "Users can insert own data" on public.users;
create policy "Users can insert own data" on public.users for insert with check (auth.uid() = id);

drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users" on public.users for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'both')
);

-- SELLERS POLICIES
drop policy if exists "Sellers can read own record" on public.sellers;
create policy "Sellers can read own record" on public.sellers for select using (user_id in (select id from public.users where auth.uid() = id));

drop policy if exists "Sellers can update own record" on public.sellers;
create policy "Sellers can update own record" on public.sellers for update using (user_id in (select id from public.users where auth.uid() = id));

drop policy if exists "Sellers can insert own record" on public.sellers;
create policy "Sellers can insert own record" on public.sellers for insert with check (user_id in (select id from public.users where auth.uid() = id));

drop policy if exists "Admins can read all sellers" on public.sellers;
create policy "Admins can read all sellers" on public.sellers for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'both')
);

-- PRODUCTS POLICIES
drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products" on public.products for select using (is_active = true);

drop policy if exists "Sellers can manage own products" on public.products;
create policy "Sellers can manage own products" on public.products for all using (
    seller_id in (select s.id from public.sellers s inner join public.users u on s.user_id = u.id where u.id = auth.uid())
);

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products" on public.products for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'both')
);

-- ORDERS POLICIES
-- NOTE: Orders have been migrated to MongoDB. The Supabase orders table is deprecated.
-- All order access is now enforced via NextAuth JWT + MongoDB queries (see lib/db/mongodb.ts).
-- These RLS policies are kept as no-ops because Supabase client calls in the app use
-- the service role key (bypassing RLS). Order-level security is enforced in the API routes.

drop policy if exists "Buyers can read own orders" on public.orders;
create policy "Buyers can read own orders" on public.orders for select using (true);

drop policy if exists "Sellers can read own orders" on public.orders;
create policy "Sellers can read own orders" on public.orders for select using (true);

drop policy if exists "Buyers can create orders" on public.orders;
create policy "Buyers can create orders" on public.orders for insert with check (true);

drop policy if exists "Buyers can update own orders" on public.orders;
create policy "Buyers can update own orders" on public.orders for update using (true);

drop policy if exists "Sellers can update order status" on public.orders;
create policy "Sellers can update order status" on public.orders for update using (true);

drop policy if exists "Admins can read all orders" on public.orders;
create policy "Admins can read all orders" on public.orders for select using (true);

-- LEDGER POLICIES
drop policy if exists "Sellers can read own ledger" on public.seller_ledger_entries;
create policy "Sellers can read own ledger" on public.seller_ledger_entries for select using (
    seller_id in (select s.id from public.sellers s inner join public.users u on s.user_id = u.id where u.id = auth.uid())
);

drop policy if exists "System can insert ledger entries" on public.seller_ledger_entries;
create policy "System can insert ledger entries" on public.seller_ledger_entries for insert with check (
    seller_id in (select s.id from public.sellers s inner join public.users u on s.user_id = u.id where u.id = auth.uid())
);

drop policy if exists "Admins can read all ledger entries" on public.seller_ledger_entries;
create policy "Admins can read all ledger entries" on public.seller_ledger_entries for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'both')
);

-- UTILITY FUNCTIONS
create or replace function public.get_seller_balance(seller_uuid uuid)
returns numeric(10, 2) as $$
declare
    total_sales numeric(10, 2);
    total_fees numeric(10, 2);
    total_withdrawals numeric(10, 2);
begin
    select coalesce(sum(amount), 0) into total_sales from public.seller_ledger_entries where seller_id = seller_uuid and type = 'sale';
    select coalesce(sum(amount), 0) into total_fees from public.seller_ledger_entries where seller_id = seller_uuid and type = 'commission_fee';
    select coalesce(sum(amount), 0) into total_withdrawals from public.seller_ledger_entries where seller_id = seller_uuid and type = 'withdrawal';
    return total_sales - total_fees - total_withdrawals;
end;
$$ language plpgsql security definer;

create or replace function public.record_sale(order_uuid uuid, commission_amount numeric(10, 2))
returns void as $$
declare v_seller_id uuid; v_total_price numeric(10, 2);
begin
    select seller_id, total_price into v_seller_id, v_total_price from public.orders where id = order_uuid;
    insert into public.seller_ledger_entries (seller_id, type, amount, order_id, description)
    values (v_seller_id, 'sale', v_total_price, order_uuid, 'Sale from order ' || order_uuid::text);
    insert into public.seller_ledger_entries (seller_id, type, amount, order_id, description)
    values (v_seller_id, 'commission_fee', commission_amount, order_uuid, 'Commission fee for order ' || order_uuid::text);
    update public.orders set status = 'completed', updated_at = now() where id = order_uuid;
end;
$$ language plpgsql security definer;