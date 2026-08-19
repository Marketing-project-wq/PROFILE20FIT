-- ============================================================
-- 20260819033627_my20fit_promo_banners
-- Banner promo (Bagian 4): konten & target WA disimpan di DB (bukan hardcode) +
-- pencatatan klik. Namespace my20fit_*. RLS deny-public (server pakai service key).
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt (version 20260819033627).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_promo_banners (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  title_en text, title_id text,
  subtitle_en text, subtitle_id text,
  cta_en text, cta_id text,
  image_url text,
  wa_phone text,
  wa_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table my20fit_promo_banners enable row level security;   -- deny-public; server bypass service key

create table if not exists my20fit_promo_banner_clicks (
  id uuid primary key default gen_random_uuid(),
  banner_id uuid references my20fit_promo_banners(id) on delete set null,
  banner_key text,
  auth_user_id uuid,
  clicked_at timestamptz not null default now(),
  user_agent text
);
create index if not exists my20fit_promo_banner_clicks_idx on my20fit_promo_banner_clicks (banner_id, clicked_at desc);
alter table my20fit_promo_banner_clicks enable row level security;  -- deny-public; server bypass service key

-- Seed banner physio 10% (bilingual). Nomor & pesan WA di DB → bisa diubah tanpa deploy ulang.
insert into my20fit_promo_banners
  (key, active, sort_order, title_en, title_id, subtitle_en, subtitle_id, cta_en, cta_id, image_url, wa_phone, wa_message)
values (
  'physio-10off', true, 1,
  '10% OFF PHYSIO THERAPY AWAITS!', 'DISKON 10% PHYSIO THERAPY MENANTIMU!',
  'Create My20FIT account to claim', 'Buat akun My20FIT untuk klaim',
  'Claim Now', 'Klaim Sekarang',
  null,
  '6281111859109',
  E'Hai 20FIT Clinic, I would like to claim 10%OFF physiotherapy from My.20fit.id\n\nCan you assist me ?'
) on conflict (key) do update set
  active=excluded.active, title_en=excluded.title_en, title_id=excluded.title_id,
  subtitle_en=excluded.subtitle_en, subtitle_id=excluded.subtitle_id,
  cta_en=excluded.cta_en, cta_id=excluded.cta_id, wa_phone=excluded.wa_phone,
  wa_message=excluded.wa_message, updated_at=now();
