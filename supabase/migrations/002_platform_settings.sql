-- Platform Settings table
create table if not exists public.platform_settings (
    id uuid primary key default uuid_generate_v4(),
    key text unique not null,
    value jsonb not null default '{}',
    updated_at timestamptz not null default now()
);

-- Seed default settings
insert into public.platform_settings (key, value) values
    ('general', '{"platformFeePercent": 5, "minPayoutAmount": 300, "supportEmail": "support@keyzaa.com"}'),
    ('features', '{"maintenanceMode": false, "allowNewSellers": true}'),
    ('categories', '["Mobile Top-up", "Genshin Impact", "Honkai Star Rail", "Mobile Legends", "ROV", "PUBG", "Free Fire", "Gift Card", "Steam Wallet", "Google Play", "Spotify", "YouTube Premium", "Netflix", "Subscription", "AI Tools"]')
on conflict (key) do nothing;
