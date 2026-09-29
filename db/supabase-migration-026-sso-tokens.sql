-- ============================================================
-- 026 — SSO one-time tokens (relay sesi lintas subdomain 20FIT)
--
-- my.20fit.id = auth hub. Sekali login → produk 20FIT lain yang pakai Supabase Auth
-- (project cpvzwqptzcxnwzfzgrmt) ikut login tanpa form lagi, lewat token SEKALI PAKAI
-- berumur 60 detik. Alur: produk asal panggil edge fn `sso-generate` (simpan sesi di sini),
-- redirect ke produk tujuan dengan ?sso_token=…, produk tujuan panggil `sso-consume`
-- (tukar token → access_token+refresh_token → setSession lokal).
--
-- Prefix my20fit_ sesuai CLAUDE.md §4 (my.20fit hanya menyentuh tabel my20fit_*).
-- KEAMANAN: RLS ON tanpa policy apa pun → HANYA service_role (edge functions) yang
-- boleh baca/tulis. Isinya = access_token + refresh_token, jadi tidak boleh kena anon.
-- CATATAN: Talent (talent.20fit.id) TIDAK ikut SSO ini — auth-nya cookie sendiri,
-- bukan Supabase, jadi tak bisa meng-consume token (lihat whitelist di edge functions).
-- ============================================================

create extension if not exists pgcrypto;  -- untuk gen_random_uuid()

create table if not exists public.my20fit_sso_tokens (
  id              uuid primary key default gen_random_uuid(),
  token           text        not null unique,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  access_token    text        not null,
  refresh_token   text        not null,
  redirect_to     text        not null,          -- host tujuan (divalidasi whitelist di edge fn)
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '60 seconds'),
  used            boolean     not null default false,  -- one-time use
  created_from_ip inet
);

-- Lookup cepat token yang masih valid (dipakai sso-consume).
create index if not exists idx_my20fit_sso_tokens_token
  on public.my20fit_sso_tokens (token) where used = false;
-- Bantu housekeeping berbasis expiry.
create index if not exists idx_my20fit_sso_tokens_expires
  on public.my20fit_sso_tokens (expires_at);

-- RLS ON, TANPA policy → hanya service_role (bypass RLS) yang bisa akses.
alter table public.my20fit_sso_tokens enable row level security;

-- Housekeeping: buang token kadaluarsa / terpakai. Jalankan manual, dari edge fn cleanup,
-- atau pg_cron (aktifkan extension pg_cron dulu di dashboard):
--   select cron.schedule(
--     'cleanup-my20fit-sso-tokens', '*/10 * * * *',
--     $$delete from public.my20fit_sso_tokens where expires_at < now() or used$$
--   );
