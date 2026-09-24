-- 022: AI Coach — Fase 2 (sesi latihan harian: sleep-check + check-in per set + progress).
--
-- Melanjutkan Fase 1 (migration 021). Fase 2 menambah:
--   * my20fit_coach_session — SATU sesi latihan (per tanggal): hari plan yang dipilih,
--     snapshot jam tidur + penyesuaian (sleep-check), status, dan snapshot target.
--   * my20fit_coach_set_log — log PER SET: target vs reps aktual, beban (opsional), selesai.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4): project Supabase cpvzwqptzcxnwzfzgrmt dipakai bersama
-- banyak app. Keyed auth_user_id + RLS auth.uid()=auth_user_id (pola sama my20fit_workout_plan
-- / my20fit_daily_log). Jalur ini juga bisa dipanggil dari browser dgn JWT user.
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.
--
-- Catatan Fase: chart per gerakan + achievement = migration 023 (Fase 3).

-- ============================================================
-- 1) my20fit_coach_session — satu sesi latihan per tanggal
-- ============================================================
-- planned = jsonb snapshot: {day_key, day_label, focus, adjust, sleep_hours,
--           exercises:[{key,name,unit,reps,target_sets,orig_sets,progression}]}.
-- sleep_adjust = hasil sleep-check: 'none' (cukup) | 'lighter' (kurang) | 'rest'
--                (sangat kurang) | 'unknown' (jam tidur belum diisi). AMBANGNYA di server.js
--                dan PERLU DIVALIDASI COACH — bukan standar medis.
create table if not exists public.my20fit_coach_session (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  plan_id       uuid references public.my20fit_workout_plan(id) on delete set null,
  session_date  date not null,
  day_key       text,
  day_label     text,
  focus         text,
  sleep_hours   numeric(4,1),
  sleep_adjust  text not null default 'unknown',
  status        text not null default 'active',
  planned       jsonb not null default '{}'::jsonb,
  note          text,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- satu sesi per user per tanggal -> sasaran idempoten saat mulai sesi.
  constraint my20fit_coach_session_user_date_uniq unique (auth_user_id, session_date)
);

alter table public.my20fit_coach_session drop constraint if exists my20fit_coach_session_adjust_chk;
alter table public.my20fit_coach_session add constraint my20fit_coach_session_adjust_chk
  check (sleep_adjust in ('none','lighter','rest','unknown'));

alter table public.my20fit_coach_session drop constraint if exists my20fit_coach_session_status_chk;
alter table public.my20fit_coach_session add constraint my20fit_coach_session_status_chk
  check (status in ('active','done','skipped'));

create index if not exists my20fit_coach_session_user_date
  on public.my20fit_coach_session (auth_user_id, session_date desc);

-- ============================================================
-- 2) my20fit_coach_set_log — log per set dalam satu sesi
-- ============================================================
create table if not exists public.my20fit_coach_set_log (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  session_id    uuid not null references public.my20fit_coach_session(id) on delete cascade,
  ex_key        text not null,
  ex_name       text,
  set_index     int  not null,
  target_reps   text,
  unit          text default 'reps',
  done_reps     int,
  weight_kg     numeric(6,1),
  done          boolean not null default false,
  logged_at     timestamptz not null default now(),
  -- satu baris per (sesi, gerakan, urutan set) -> aman untuk update idempoten.
  constraint my20fit_coach_set_uniq unique (session_id, ex_key, set_index)
);

alter table public.my20fit_coach_set_log drop constraint if exists my20fit_coach_set_bounds_chk;
alter table public.my20fit_coach_set_log add constraint my20fit_coach_set_bounds_chk
  check (
    (set_index >= 1 and set_index <= 50) and
    (done_reps is null or (done_reps >= 0 and done_reps <= 9999)) and
    (weight_kg is null or (weight_kg >= 0 and weight_kg <= 2000))
  );

create index if not exists my20fit_coach_set_session
  on public.my20fit_coach_set_log (session_id, ex_key, set_index);

-- ============================================================
-- RLS — user HANYA barisnya sendiri (server pakai service_role -> bypass; jalur browser
-- dgn JWT user dijaga kebijakan ini). Deny-public default.
-- ============================================================
alter table public.my20fit_coach_session enable row level security;
drop policy if exists p_coach_session_all on public.my20fit_coach_session;
create policy p_coach_session_all on public.my20fit_coach_session
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

alter table public.my20fit_coach_set_log enable row level security;
drop policy if exists p_coach_set_all on public.my20fit_coach_set_log;
create policy p_coach_set_all on public.my20fit_coach_set_log
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) Kedua tabel ditambahkan ke USER_DATA_TABLES di server.js (ekspor/hapus data akun) —
--    sudah dikerjakan di commit fitur.
-- b) Jalankan migration ini SEBELUM deploy kode yang menyentuhnya. Kalau belum jalan,
--    server membungkus akses tabel dgn try/catch: halaman Coach tetap render, alur "Latihan
--    hari ini" balas setup_required sampai tabel ada.
-- c) Ambang sleep-check ('none'/'lighter'/'rest') ada di server.js (coachSleepAdjust) dan
--    DITANDAI PERLU DIVALIDASI COACH — sesuaikan setelah tim medis/coach menetapkan standar.
