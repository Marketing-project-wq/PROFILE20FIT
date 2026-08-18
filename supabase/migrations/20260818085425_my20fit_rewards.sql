-- ============================================================
-- 20260818085425_my20fit_rewards
-- Papan Rewards/Perks: admin publikasikan perks nyata; member klaim (dapat kode);
-- admin tandai fulfilled. TIDAK ada ekonomi poin yang dipaksakan (cost_label = teks bebas).
-- Namespace my20fit_* (CLAUDE.md §4). RLS deny-public (server pakai service key) — tanpa mass-RLS.
--
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt (version 20260818085425).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_reward_offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  image_url text,
  terms text,
  cost_label text,                       -- teks bebas (mis. "Gratis member") — tak ada ekonomi dipaksakan
  stock integer,                         -- null = tak terbatas
  claimed_count integer not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);
create index if not exists my20fit_reward_offers_browse_idx on my20fit_reward_offers (active, sort_order);
alter table my20fit_reward_offers enable row level security;   -- deny-public; server bypass via service key

create table if not exists my20fit_reward_claims (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references my20fit_reward_offers(id) on delete cascade,
  auth_user_id uuid not null,
  email text,
  name text,
  status text not null default 'pending' check (status in ('pending','fulfilled','cancelled')),
  claim_code text unique,
  note text,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz,
  updated_by text
);
create index if not exists my20fit_reward_claims_user_idx on my20fit_reward_claims (auth_user_id, created_at desc);
alter table my20fit_reward_claims enable row level security;    -- deny-public; server bypass via service key
