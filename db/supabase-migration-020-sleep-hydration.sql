-- 020: Activity — Sleep detail + Hydration detail.
--
-- Menambah dua tabel untuk fitur Activity yang lebih kaya:
--   * my20fit_sleep     — satu baris per malam: jam tidur/bangun, durasi, kualitas,
--                         jumlah terbangun, (opsional) tahap deep/light/rem.
--   * my20fit_hydration — satu baris per tegukan: waktu, jumlah (ml), jenis minuman.
--
-- KENAPA PREFIX my20fit_ (WAJIB, CLAUDE.md §4):
-- Project Supabase cpvzwqptzcxnwzfzgrmt dipakai BERSAMA banyak app dan berisi ratusan
-- tabel tanpa prefix. Spesifikasi menyebut `activity_sleep` / `activity_hydration` —
-- nama sepolos itu berisiko bertabrakan dengan tabel app lain. Jadi dipakai prefix
-- wajib. Isi kolom & aturan RLS-nya mengikuti maksud spesifikasi.
--
-- KENAPA auth_user_id (bukan user_id):
-- Subsistem Activity yang sudah ada (my20fit_workout, my20fit_daily_log, my20fit_daily_plan)
-- semuanya keyed `auth_user_id` dengan RLS `auth.uid() = auth_user_id`. Dua tabel ini
-- diakses dari BROWSER dengan JWT user (pola sama dgn my20fit_daily_log), jadi RLS inilah
-- penjaga sebenarnya. Dibuat konsisten: auth_user_id.
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.

-- ============================================================
-- 1) my20fit_sleep — tidur harian (satu baris per tanggal bangun)
-- ============================================================
create table if not exists public.my20fit_sleep (
  id                 uuid primary key default gen_random_uuid(),
  auth_user_id       uuid not null references auth.users(id) on delete cascade,
  -- Tanggal "milik" sesi tidur = tanggal BANGUN (tidur malam sebelumnya masuk ke hari ini).
  sleep_date         date not null,
  bedtime            timestamptz,
  wake_time          timestamptz,
  duration_hours     numeric(4,1),
  quality            text,
  awake_times        int,
  -- Tahap tidur — opsional, hanya terisi kalau sumbernya (Garmin/Apple/scan) memberi.
  deep_sleep_hours   numeric(3,1),
  light_sleep_hours  numeric(3,1),
  rem_sleep_hours    numeric(3,1),
  source             text default 'manual',
  note               text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Satu baris per user per malam -> sasaran ON CONFLICT saat upsert.
  constraint my20fit_sleep_user_date_uniq unique (auth_user_id, sleep_date)
);

-- Enum sebagai CHECK (bukan tipe enum PG): menambah pilihan cukup ganti constraint,
-- tak perlu ALTER TYPE yang mengunci tabel. NULL diizinkan supaya baris bisa disimpan
-- separuh jalan (mis. cuma durasi tanpa kualitas).
alter table public.my20fit_sleep drop constraint if exists my20fit_sleep_quality_chk;
alter table public.my20fit_sleep add constraint my20fit_sleep_quality_chk
  check (quality is null or quality in ('poor','fair','good','excellent'));

alter table public.my20fit_sleep drop constraint if exists my20fit_sleep_source_chk;
alter table public.my20fit_sleep add constraint my20fit_sleep_source_chk
  check (source is null or source in ('manual','scan','garmin','apple_watch','samsung','other'));

-- Batas wajar supaya angka ngawur tidak lolos ke DB (validasi utama tetap di UI/JS).
alter table public.my20fit_sleep drop constraint if exists my20fit_sleep_bounds_chk;
alter table public.my20fit_sleep add constraint my20fit_sleep_bounds_chk
  check (
    (duration_hours   is null or (duration_hours   >= 0 and duration_hours   <= 24)) and
    (awake_times      is null or (awake_times       >= 0 and awake_times      <= 50)) and
    (deep_sleep_hours is null or (deep_sleep_hours  >= 0 and deep_sleep_hours <= 24)) and
    (light_sleep_hours is null or (light_sleep_hours >= 0 and light_sleep_hours <= 24)) and
    (rem_sleep_hours  is null or (rem_sleep_hours   >= 0 and rem_sleep_hours  <= 24)) and
    (note is null or char_length(note) <= 500)
  );

create index if not exists my20fit_sleep_user_date
  on public.my20fit_sleep (auth_user_id, sleep_date desc);

-- ============================================================
-- 2) my20fit_hydration — log minum (satu baris per tegukan)
-- ============================================================
create table if not exists public.my20fit_hydration (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  log_date      date not null default current_date,
  logged_at     timestamptz not null default now(),
  amount_ml     int not null,
  drink_type    text not null default 'water',
  note          text,
  created_at    timestamptz not null default now()
);

alter table public.my20fit_hydration drop constraint if exists my20fit_hydration_type_chk;
alter table public.my20fit_hydration add constraint my20fit_hydration_type_chk
  check (drink_type in ('water','coffee','tea','juice','sports_drink','other'));

-- amount_ml > 0 dan tidak absurd (>5 L sekali minum ditolak). note dibatasi panjang.
alter table public.my20fit_hydration drop constraint if exists my20fit_hydration_bounds_chk;
alter table public.my20fit_hydration add constraint my20fit_hydration_bounds_chk
  check (amount_ml > 0 and amount_ml <= 5000 and (note is null or char_length(note) <= 300));

create index if not exists my20fit_hydration_user_date
  on public.my20fit_hydration (auth_user_id, log_date desc);

-- ============================================================
-- RLS — user HANYA bisa menyentuh barisnya sendiri
-- ============================================================
-- Pola sama dengan my20fit_daily_log (db/supabase-policies.sql): server pakai service_role
-- (bypass RLS), tapi dua tabel ini dipanggil dari browser dgn JWT user -> kebijakan inilah
-- yang benar-benar menjaga datanya. Deny-public default; hanya pemilik baris yang lolos.
alter table public.my20fit_sleep enable row level security;
drop policy if exists p_sleep_all on public.my20fit_sleep;
create policy p_sleep_all on public.my20fit_sleep
  for all
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

alter table public.my20fit_hydration enable row level security;
drop policy if exists p_hydration_all on public.my20fit_hydration;
create policy p_hydration_all on public.my20fit_hydration
  for all
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) `updated_at` di my20fit_sleep TIDAK dipasangi trigger — nilainya dikirim saat upsert
--    (pola sama my20fit_workout / my20fit_member_goals). my20fit_hydration append-only,
--    jadi tak perlu updated_at.
-- b) Kedua tabel ini akan ditambahkan ke USER_DATA_TABLES di server.js (ekspor data
--    pribadi /api/account/export) saat UI disambungkan — dikerjakan di commit fitur,
--    bukan di migration ini. Pastikan migration ini SUDAH dijalankan sebelum deploy
--    kode yang menyentuhnya, supaya ekspor tidak error mengakses tabel yang belum ada.
-- c) Agregat harian tetap ikut ditulis ke my20fit_daily_log (sleep_hours, water_glasses)
--    dari sisi klien supaya skor & rencana AI harian yang sudah ada terus jalan tanpa
--    perubahan logika. Sumber detail = tabel ini; my20fit_daily_log = ringkasan untuk skor.
