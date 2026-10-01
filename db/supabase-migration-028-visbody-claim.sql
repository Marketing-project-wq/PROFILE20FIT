-- 028: Visbody — claim hasil scan (token sekali pakai + audit + persetujuan data).
--
-- Menggantikan claim lama (link QR berisi scan_id mentah, jendela 30 menit, tanpa audit &
-- tanpa persetujuan). Sekarang:
--   * QR timbangan / link dari staf memuat TOKEN ACAK (disimpan sebagai hash sha256), sekali
--     pakai & kedaluwarsa (TTL di lib/journey-config.js).
--   * Tiap claim / penolakan / bind oleh staf / pembuatan link tercatat di audit log.
--   * Persetujuan pemrosesan data komposisi tubuh (UU PDP 27/2022) disimpan per user + versi teks.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4). Idempoten — aman dijalankan ulang.
-- Token & audit: RLS aktif TANPA policy -> hanya server (service_role) yang bisa baca/tulis.
-- Consent: user hanya bisa MEMBACA barisnya sendiri; tulis lewat server.

-- 1) Kolom claim di my20fit_visbody_scan (migration 019).
alter table public.my20fit_visbody_scan add column if not exists claimed_at  timestamptz;
alter table public.my20fit_visbody_scan add column if not exists claimed_via text;
alter table public.my20fit_visbody_scan add column if not exists viewed_at   timestamptz;
alter table public.my20fit_visbody_scan drop constraint if exists my20fit_visbody_scan_claimed_via_chk;
alter table public.my20fit_visbody_scan add constraint my20fit_visbody_scan_claimed_via_chk
  check (claimed_via is null or claimed_via in ('qr','staff','third_uid'));
create index if not exists my20fit_visbody_scan_unclaimed_idx
  on public.my20fit_visbody_scan(scan_time desc) where auth_user_id is null;

-- 2) Token claim (hash saja; token mentah tak pernah disimpan).
create table if not exists public.my20fit_visbody_claim_token (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  scan_id     text not null references public.my20fit_visbody_scan(scan_id) on delete cascade,
  source      text not null,                      -- 'device' (QR timbangan) | 'admin' (link staf)
  created_by  uuid references auth.users(id) on delete set null,   -- admin pembuat (source=admin)
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint my20fit_visbody_claim_token_source_chk check (source in ('device','admin'))
);
create index if not exists my20fit_visbody_claim_token_scan_idx on public.my20fit_visbody_claim_token(scan_id);
alter table public.my20fit_visbody_claim_token enable row level security;

-- 3) Audit claim. SENGAJA tanpa FK ke scan: jejak tetap ada walau scan dihapus (retensi).
create table if not exists public.my20fit_visbody_claim_audit (
  id           uuid primary key default gen_random_uuid(),
  scan_id      text not null,
  action       text not null,        -- claim | claim_rejected | staff_bind | link_created
  actor_user   uuid,                 -- member yang mencoba/berhasil claim
  actor_admin  text,                 -- email admin (atau 'master-key')
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists my20fit_visbody_claim_audit_scan_idx on public.my20fit_visbody_claim_audit(scan_id, created_at desc);
alter table public.my20fit_visbody_claim_audit enable row level security;

-- 4) Persetujuan pemrosesan data (per user, per tujuan, per versi teks).
create table if not exists public.my20fit_data_consent (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  purpose       text not null,
  version       text not null,
  source        text not null default 'self',   -- 'self' (member klik setuju) | 'staff' (disaksikan staf)
  granted_by    text,                           -- email admin kalau source=staff
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz,
  constraint my20fit_data_consent_uniq unique (auth_user_id, purpose, version),
  constraint my20fit_data_consent_source_chk check (source in ('self','staff'))
);
alter table public.my20fit_data_consent enable row level security;
drop policy if exists p_data_consent_select on public.my20fit_data_consent;
create policy p_data_consent_select on public.my20fit_data_consent
  for select using (auth.uid() = auth_user_id);

-- CATATAN: my20fit_data_consent + my20fit_visbody_scan + my20fit_visbody_body masuk
-- USER_DATA_TABLES di server.js (ekspor & hapus data pribadi). Token & audit tidak (bukan
-- data pribadi bermakna / jejak akuntabilitas, pola sama my20fit_admin_audit_log).
