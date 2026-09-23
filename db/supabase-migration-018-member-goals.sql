-- 018: Quiz onboarding "Set Your Goal" di halaman Activity.
--
-- NAMA TABEL BEDA DARI SPESIFIKASI, DAN ITU DISENGAJA.
-- Spesifikasi meminta `member_goals`. Project Supabase cpvzwqptzcxnwzfzgrmt dipakai
-- BERSAMA banyak app lain dan berisi ratusan tabel tanpa prefix (CLAUDE.md §4). Nama
-- sepolos `member_goals` berisiko bertabrakan dengan tabel app lain — dan kalau sampai
-- menimpa, yang rusak bukan cuma app ini. Jadi dipakai prefix wajib: `my20fit_member_goals`.
-- Seluruh kolom, enum, unique, dan aturan RLS-nya PERSIS seperti yang diminta.
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.

create table if not exists public.my20fit_member_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  fitness_goal  text,
  activity_level text,
  diet_pref     text,
  wake_time     time,
  sleep_time    time,
  water_target  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Satu baris per user; jadi sasaran ON CONFLICT saat upsert.
  constraint my20fit_member_goals_user_uniq unique (user_id)
);

-- Enum ditegakkan sebagai CHECK, bukan tipe enum Postgres: menambah pilihan baru nanti
-- cukup mengganti constraint, tak perlu ALTER TYPE yang mengunci tabel.
-- NULL diizinkan supaya baris bisa disimpan separuh jalan; kelengkapan dijaga UI.
alter table public.my20fit_member_goals drop constraint if exists my20fit_member_goals_goal_chk;
alter table public.my20fit_member_goals add constraint my20fit_member_goals_goal_chk
  check (fitness_goal is null or fitness_goal in ('lose_weight','build_muscle','stamina','race_prep'));

alter table public.my20fit_member_goals drop constraint if exists my20fit_member_goals_level_chk;
alter table public.my20fit_member_goals add constraint my20fit_member_goals_level_chk
  check (activity_level is null or activity_level in ('rare','light','moderate','daily'));

alter table public.my20fit_member_goals drop constraint if exists my20fit_member_goals_diet_chk;
alter table public.my20fit_member_goals add constraint my20fit_member_goals_diet_chk
  check (diet_pref is null or diet_pref in ('any','halal','vegetarian','no_pork'));

-- water_target bebas teks (mis. "4-6 gelas"), tapi dibatasi panjangnya supaya tidak jadi
-- tempat menumpuk teks panjang.
alter table public.my20fit_member_goals drop constraint if exists my20fit_member_goals_water_chk;
alter table public.my20fit_member_goals add constraint my20fit_member_goals_water_chk
  check (water_target is null or char_length(water_target) <= 40);

-- ============================================================
-- RLS — user HANYA bisa menyentuh barisnya sendiri
-- ============================================================
-- Pola sama dengan my20fit_daily_plan (migration 017) dan db/supabase-policies.sql.
-- Server memakai service_role -> bypass RLS; quiz ini memanggil Supabase dari browser
-- dengan JWT user, jadi kebijakan inilah yang benar-benar menjaga datanya.
alter table public.my20fit_member_goals enable row level security;
drop policy if exists p_member_goals_all on public.my20fit_member_goals;
create policy p_member_goals_all on public.my20fit_member_goals
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) `updated_at` TIDAK dipasangi trigger. Nilainya dikirim saat upsert, mengikuti pola
--    yang sudah dipakai my20fit_workout di server.js. Kalau nanti ada penulis lain yang
--    tidak mengirimnya, barulah trigger sepadan dibuat.
-- b) Tabel ini belum ditambahkan ke USER_DATA_TABLES di server.js (ekspor data pribadi
--    user). Perlu dikerjakan saat quiz disambungkan ke halaman — bukan di migration ini.
