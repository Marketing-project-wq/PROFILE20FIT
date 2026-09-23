-- 017: Halaman Activity — workout detail + rencana harian AI.
--
-- PRINSIP: SATU SUMBER KEBENARAN (CLAUDE.md §2). Spesifikasi awal meminta tiga tabel baru
-- (`workouts`, `daily_metrics`, `daily_plans`). Dua di antaranya SUDAH ADA di sini, jadi
-- yang dibuat baru hanya satu. Diverifikasi ke DB live 2026-09-21:
--
--   * `my20fit_workout`   SUDAH ADA, 0 baris, nol penulis di kode (tabel dorman).
--                         -> DIPERLUAS, bukan diganti. Aman: tak ada data & tak ada
--                            pemanggil yang rusak.
--   * `my20fit_daily_log` SUDAH ADA dan HIDUP: 679 baris, 282 user, terakhir 2026-09-20.
--                         Sudah punya sleep_hours, water_glasses, checklist, weight_kg,
--                         cal_items. -> HANYA `steps` yang benar-benar hilang.
--   * rencana harian AI   belum ada di mana pun -> tabel baru `my20fit_daily_plan`.
--
-- YANG SENGAJA TIDAK DIBUAT, supaya tidak ada angka kembar:
--   - `duration_seconds` : `my20fit_workout.duration_min` sudah numeric (boleh pecahan).
--                          Detik per-zona HR hidup di `hr_zone_data`.
--   - `water_intake_ml`  : `my20fit_daily_log.water_glasses` sudah jadi satuan yang dipakai
--                          halaman lain. Konversi ke ml di UI, jangan simpan dua-duanya.
--   - `calories_consumed`, `protein_g`, `carbs_g`, `fat_g` :
--                          `cal_items` jsonb sudah menyimpan {name,kcal,p,c,f,t} PER ITEM.
--                          Total dijumlahkan saat baca. Menyimpan totalnya lagi = dua angka
--                          yang bisa berbeda dan tak ada yang tahu mana yang benar.
--   - `habits` jsonb     : `my20fit_daily_log.checklist` jsonb sudah mengisi peran itu.
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.

-- ============================================================
-- 1) my20fit_workout — diperluas untuk data tracker
-- ============================================================
-- Kolom lama yang DIPERTAHANKAN apa adanya: id, auth_user_id, workout_date,
-- type (not null), duration_min (not null), note, created_at, updated_at.

alter table public.my20fit_workout
  add column if not exists source            text,        -- strava | garmin | apple_health | google_fit | manual | upload
  add column if not exists title             text,
  add column if not exists distance_km       numeric,
  add column if not exists calories_burned   int,
  add column if not exists avg_heart_rate    int,
  add column if not exists max_heart_rate    int,
  add column if not exists hr_zone_data      jsonb,       -- {"z1":600,"z2":1500,...} DETIK per zona
  add column if not exists pace_data         jsonb,       -- {"avg_sec_per_km":330,"splits":[...]}
  add column if not exists elevation_gain_m  numeric,
  add column if not exists raw_data          jsonb,       -- payload mentah dari tracker (audit)
  add column if not exists uploaded_file_url text,        -- objek di bucket workout-uploads
  add column if not exists external_id       text;        -- id aktivitas di tracker asal

-- `source` dibatasi supaya tidak jadi tempat sampah string bebas.
alter table public.my20fit_workout drop constraint if exists my20fit_workout_source_chk;
alter table public.my20fit_workout add constraint my20fit_workout_source_chk
  check (source is null or source in
    ('strava','garmin','apple_health','google_fit','manual','upload'));

-- Anti-dobel saat sync ulang tracker: satu aktivitas eksternal = satu baris.
-- Partial unique -> baris manual (external_id null) tidak terpengaruh.
create unique index if not exists my20fit_workout_ext_uniq
  on public.my20fit_workout (auth_user_id, source, external_id)
  where external_id is not null;

-- CATATAN: index (auth_user_id, workout_date) SUDAH ADA sebagai
-- `my20fit_workout_user_date_idx` (diverifikasi 2026-09-21). SENGAJA tidak dibuat ulang:
-- btree bisa dipindai mundur, jadi index ASC itu sudah melayani `order by workout_date desc`.
-- Menulis `create index if not exists` dengan nama yang sama hanya akan diam-diam no-op
-- dan bikin kita mengira ada index DESC baru; menulis nama lain = index kembar yang
-- memperlambat tulis tanpa manfaat baca.

-- ============================================================
-- 2) my20fit_daily_log — hanya SATU kolom yang benar-benar kurang
-- ============================================================
alter table public.my20fit_daily_log
  add column if not exists steps int;

-- ============================================================
-- 3) my20fit_daily_plan — BARU (rencana coaching harian dari AI)
-- ============================================================
create table if not exists public.my20fit_daily_plan (
  id                uuid primary key default gen_random_uuid(),
  auth_user_id      uuid not null,
  plan_date         date not null,
  overall_score     int,                  -- 0..100
  analysis_text     text,                 -- 2-3 kalimat, bahasa Indonesia
  gaps              jsonb,                -- [{"area":"tidur","status":"critical","value":"5.5 / 7.5h"}]
  goals             jsonb,                -- [{"id":"g1","title":"...","category":"exercise","done":false}]
  nutrition_targets jsonb,                -- {"kcal":2200,"p":140,"c":240,"f":70,"water_glasses":8}
  generated_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint my20fit_daily_plan_user_date_uniq unique (auth_user_id, plan_date),
  constraint my20fit_daily_plan_score_chk check (overall_score is null or overall_score between 0 and 100)
);

create index if not exists my20fit_daily_plan_user_date_idx
  on public.my20fit_daily_plan (auth_user_id, plan_date desc);

-- ============================================================
-- 4) RLS — user hanya lihat datanya sendiri
-- ============================================================
-- Pola SAMA dengan my20fit_workout / my20fit_daily_log yang sudah ada
-- (lihat db/supabase-policies.sql). Server pakai service_role -> bypass RLS.
alter table public.my20fit_daily_plan enable row level security;
drop policy if exists p_daily_plan_all on public.my20fit_daily_plan;
create policy p_daily_plan_all on public.my20fit_daily_plan
  for all
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- ============================================================
-- 5) CATATAN UNTUK PEMILIK — yang TIDAK dilakukan file ini
-- ============================================================
-- a) Bucket Storage `workout-uploads` TIDAK dibuat di sini (bukan DDL Postgres).
--    Buat manual: Supabase Dashboard -> Storage -> New bucket -> nama `workout-uploads`,
--    set PRIVATE. Upload/baca lewat server (service key), jangan dari browser langsung.
-- b) `my20fit_daily_plan` perlu ditambahkan ke USER_DATA_TABLES di server.js (~baris 4409)
--    supaya ikut terekspor saat user minta unduh data pribadinya. Dikerjakan di step
--    berikutnya bersama endpoint-nya, bukan di migration ini.
