-- ============================================================
--  20fit — Migration 012: Modul Banner / Promotion (baru)
--  Jalankan di Supabase > SQL Editor. Idempoten, ADDITIVE & REVERSIBLE.
--  Di belakang feature flag `banner` (default OFF). Namespace my20fit_.
--  RLS deny-public (server/service key). Rollback di bawah.
-- ============================================================

create table if not exists public.my20fit_banner (
  id                uuid primary key default gen_random_uuid(),
  title             text,
  image_url_id      text,
  image_url_en      text,
  alt_text_id       text,
  alt_text_en       text,
  cta_text_id       text,
  cta_text_en       text,
  cta_url           text,
  cta_type          text not null default 'internal_link',  -- internal_link|external_link|deeplink
  placement         text not null default 'below_aqi',
  target_segment_id uuid,
  priority          integer not null default 0,
  starts_at         timestamptz,
  ends_at           timestamptz,
  is_active         boolean not null default false,
  created_by        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists my20fit_banner_place_idx
  on public.my20fit_banner (placement, is_active, priority desc);
alter table public.my20fit_banner enable row level security;

-- Event impression/click (dicatat async/batch; endpoint publik rate-limited).
create table if not exists public.my20fit_banner_event (
  id         uuid primary key default gen_random_uuid(),
  banner_id  uuid not null,
  user_id    uuid,
  event_type text not null,   -- impression|click
  created_at timestamptz not null default now()
);
create index if not exists my20fit_banner_event_idx
  on public.my20fit_banner_event (banner_id, event_type);
alter table public.my20fit_banner_event enable row level security;

-- Seed feature flag banner (kalau belum ada).
insert into public.my20fit_admin_feature_flags (key, note)
values ('banner','modul banner/promotion')
on conflict (key) do nothing;

-- ============================================================
--  ROLLBACK:
--    drop table if exists public.my20fit_banner_event;
--    drop table if exists public.my20fit_banner;
-- ============================================================
