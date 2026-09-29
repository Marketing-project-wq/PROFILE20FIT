-- ============================================================
-- 026 — SSO one-time tokens (relay sesi lintas subdomain 20FIT)  [DOKUMENTASI]
--
-- PENTING: tabel public.sso_tokens SUDAH ADA di project cpvzwqptzcxnwzfzgrmt
-- (dibuat lebih dulu, dipakai edge functions sso-generate/sso-consume). File ini
-- MENDOKUMENTASIKAN skema itu (idempoten, create-if-not-exists) — bukan bikin baru.
-- Namanya sengaja TANPA prefix my20fit_ karena ini tabel INFRA BERSAMA lintas produk
-- (semua subdomain 20FIT meng-consume-nya lewat edge function), bukan data app my.20fit.
-- Hanya edge function (service role) yang menyentuhnya; server Express my.20fit tidak.
--
-- Alur: produk asal → sso-generate (Bearer access_token user + refresh_token di body)
-- → simpan sesi + balikan token → redirect ke produk tujuan ?sso_token=… → sso-consume
-- (tukar token jadi access+refresh) → setSession. Token 60 dtk, SEKALI PAKAI.
-- Talent DIKECUALIKAN di sisi KLIEN (universal-nav noSso / auth-sso NO_SSO): auth-nya
-- bukan Supabase, jadi tak pernah jadi target SSO walau ada di whitelist edge (parity).
-- ============================================================

create extension if not exists pgcrypto;  -- gen_random_uuid()

create table if not exists public.sso_tokens (
  id              uuid        primary key default gen_random_uuid(),
  token           text        not null unique,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  access_token    text        not null,
  refresh_token   text        not null,
  redirect_to     text        not null,
  created_from_ip inet,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '60 seconds'),
  used            boolean     not null default false
);

create index if not exists idx_sso_tokens_token
  on public.sso_tokens (token) where used = false;
create index if not exists idx_sso_tokens_expires
  on public.sso_tokens (expires_at);

-- RLS ON, TANPA policy → hanya service_role (edge functions) yang bisa akses.
alter table public.sso_tokens enable row level security;

-- Housekeeping (manual / edge cleanup / pg_cron):
--   select cron.schedule('cleanup-sso-tokens','*/10 * * * *',
--     $$delete from public.sso_tokens where expires_at < now() or used$$);
