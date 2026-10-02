-- 032: Struktur data challenge komunitas per olahraga / lintas olahraga (Activity multi-sport, Fase 4 — Bagian G).
--
-- HANYA STRUKTUR. Belum ada kode yang membaca/menulis tabel ini: pembangunan penuh menunggu challenge
-- percontohan (keputusan pemilik). PREFIX my20fit_ WAJIB (CLAUDE.md §4). Aditif & idempoten. Jalankan MANUAL.
--
-- Poin berbasis KONSISTENSI (hari aktif / sesi yang tercatat), bukan jarak/pace, supaya adil untuk semua
-- olahraga (padel, lari, HYROX, gym, …). Aturan poin disimpan per challenge di `rules` (jsonb), mis.
--   {"points_per_session": 10, "max_sessions_per_day": 1, "target_sessions_per_week": 3}
-- — angka contoh, PERLU DIPUTUSKAN pemilik saat challenge percontohan dibuat.
-- Penulisan lewat server (service_role). RLS: member login boleh membaca challenge yang aktif/selesai,
-- dan hanya baris keikutsertaannya sendiri.

create table if not exists public.my20fit_challenge (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        jsonb not null,                        -- {"en": "...", "id": "..."}
  description  jsonb,
  sport_key    text,                                  -- lib/sport-packs; NULL = lintas olahraga
  scoring      text not null default 'consistency',
  rules        jsonb not null default '{}',
  starts_on    date not null,
  ends_on      date not null,
  status       text not null default 'draft',
  community_url text,                                 -- komunitas/partner terkait (mis. direktori 20fit.id)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint my20fit_challenge_scoring_chk check (scoring in ('consistency')),
  constraint my20fit_challenge_status_chk check (status in ('draft','active','ended')),
  constraint my20fit_challenge_dates_chk check (ends_on >= starts_on),
  constraint my20fit_challenge_sport_chk check (sport_key is null or sport_key ~ '^[a-z_]{2,30}$')
);

create table if not exists public.my20fit_challenge_member (
  challenge_id       uuid not null references public.my20fit_challenge(id) on delete cascade,
  auth_user_id       uuid not null references auth.users(id) on delete cascade,
  joined_at          timestamptz not null default now(),
  points             integer not null default 0,
  sessions           integer not null default 0,
  last_activity_date date,
  constraint my20fit_challenge_member_pk primary key (challenge_id, auth_user_id),
  constraint my20fit_challenge_member_points_chk check (points >= 0 and sessions >= 0)
);
create index if not exists my20fit_challenge_member_user_idx on public.my20fit_challenge_member (auth_user_id);

alter table public.my20fit_challenge enable row level security;
alter table public.my20fit_challenge_member enable row level security;
drop policy if exists p_challenge_sel on public.my20fit_challenge;
create policy p_challenge_sel on public.my20fit_challenge
  for select to authenticated using (status in ('active','ended'));
drop policy if exists p_challenge_member_sel on public.my20fit_challenge_member;
create policy p_challenge_member_sel on public.my20fit_challenge_member
  for select using (auth.uid() = auth_user_id);
