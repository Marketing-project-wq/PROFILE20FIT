-- 016: Fondasi ekosistem sub-domain publik (FASE 1B) — sesi & scan anonim.
-- my20fit_anonymous_sessions : identitas anonim (cookie) + counter scan (5 TOTAL, bukan harian).
-- my20fit_anonymous_scans    : hasil scan anonim (sementara; dihapus cron setelah 7 hari).
-- deny-public RLS: HANYA server (service_role) yang akses. IP disimpan sebagai HASH, bukan mentah.

create table if not exists public.my20fit_anonymous_sessions (
  anon_id           uuid primary key,
  ip_hash           text,
  ua_hash           text,
  scan_count        int not null default 0,
  converted_user_id uuid,                 -- diisi saat anon mendaftar (ukur konversi)
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

create table if not exists public.my20fit_anonymous_scans (
  id          bigint generated always as identity primary key,
  anon_id     uuid not null references public.my20fit_anonymous_sessions(anon_id) on delete cascade,
  result      jsonb not null,             -- hasil PENUH server-side; nilai gizi DIKUNCI saat render riwayat
  created_at  timestamptz not null default now()
);
create index if not exists my20fit_anonymous_scans_anon_idx    on public.my20fit_anonymous_scans (anon_id, created_at desc);
create index if not exists my20fit_anonymous_scans_created_idx on public.my20fit_anonymous_scans (created_at);

alter table public.my20fit_anonymous_sessions enable row level security;
alter table public.my20fit_anonymous_scans    enable row level security;
-- Tanpa policy => deny-public. Server pakai service_role (bypass RLS).

-- Retensi: hapus scan anonim > N hari, + sesi anonim mati (belum konversi, lama tak aktif,
-- tak punya scan tersisa). Dipanggil harian via pg_cron ATAU endpoint /api/cron/purge-anon (CRON_SECRET).
create or replace function public.my20fit_purge_anon(p_days int default 7)
returns void language sql security definer set search_path = public as $$
  delete from public.my20fit_anonymous_scans where created_at < now() - (p_days || ' days')::interval;
  delete from public.my20fit_anonymous_sessions s
   where s.converted_user_id is null
     and s.last_seen_at < now() - (p_days || ' days')::interval
     and not exists (select 1 from public.my20fit_anonymous_scans x where x.anon_id = s.anon_id);
$$;

-- ROLLBACK (kalau perlu):
--   drop function if exists public.my20fit_purge_anon(int);
--   drop table if exists public.my20fit_anonymous_scans;
--   drop table if exists public.my20fit_anonymous_sessions;
