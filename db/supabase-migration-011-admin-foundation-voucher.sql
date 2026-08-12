-- ============================================================
--  20fit — Migration 011: fondasi admin baru + schema Voucher (Modul 1)
--  Jalankan di Supabase > SQL Editor. Idempoten, ADDITIVE & REVERSIBLE.
--  Semua fitur baru di belakang FEATURE FLAG (default OFF) → aman di prod.
--  Namespace WAJIB my20fit_. RLS deny-public (server/service key saja).
--  Rollback ada di bagian bawah file (komentar).
-- ============================================================

-- 1) FEATURE FLAGS modul admin baru (gate semua fitur baru; default OFF).
create table if not exists public.my20fit_admin_feature_flags (
  key        text primary key,       -- 'voucher_v2' | 'banner' | 'menu_review' | 'email_campaign_v2' | 'corporate_portal' | 'segments'
  enabled    boolean not null default false,
  note       text,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.my20fit_admin_feature_flags enable row level security;
insert into public.my20fit_admin_feature_flags (key, note) values
  ('segments','sistem segmen tersimpan'),
  ('voucher_v2','voucher schema baru + tracking'),
  ('banner','modul banner/promotion'),
  ('menu_review','approval menu shared'),
  ('email_campaign_v2','campaign bilingual + jadwal'),
  ('corporate_portal','portal klien corporate')
on conflict (key) do nothing;

-- 2) SEGMEN TERSIMPAN (reusable: voucher/campaign/banner/laporan).
--    Aturan HANYA atribut netral (membership, bahasa, studio, riwayat beli,
--    tanggal daftar, tingkat aktivitas). Larangan data kesehatan ditegakkan
--    di server (validasi), bukan hanya di sini.
create table if not exists public.my20fit_segments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  rule        jsonb not null default '{}'::jsonb,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.my20fit_segments enable row level security;

-- 3) VOUCHER (Modul 1): tambah field yang diminta handoff.
--    discount_type tetap text; nilai 'free_scans' divalidasi di kode (tanpa enum DB).
alter table public.my20fit_vouchers
  add column if not exists name                text,
  add column if not exists applicable_packages jsonb,     -- paket/kredit yang berlaku (null = semua)
  add column if not exists max_discount        integer,   -- cap diskon (rupiah), null = tak dibatasi
  add column if not exists target_segment_id   uuid;      -- link ke my20fit_segments.id (opsional)

-- 4) VOUCHER ATTEMPTS — sumber data "kode gagal" + redemption rate.
create table if not exists public.my20fit_voucher_attempts (
  id           uuid primary key default gen_random_uuid(),
  code_tried   text not null,
  auth_user_id uuid,
  result       text not null,   -- ok|expired|quota_full|not_applicable|not_found|per_user_limit
  created_at   timestamptz not null default now()
);
create index if not exists my20fit_voucher_attempts_code_idx on public.my20fit_voucher_attempts (code_tried);
create index if not exists my20fit_voucher_attempts_time_idx on public.my20fit_voucher_attempts (created_at desc);
alter table public.my20fit_voucher_attempts enable row level security;

-- ============================================================
--  ROLLBACK (jalankan manual bila perlu — semua additive, aman di-drop):
--    drop table if exists public.my20fit_voucher_attempts;
--    drop table if exists public.my20fit_segments;
--    drop table if exists public.my20fit_admin_feature_flags;
--    alter table public.my20fit_vouchers
--      drop column if exists name, drop column if exists applicable_packages,
--      drop column if exists max_discount, drop column if exists target_segment_id;
-- ============================================================
