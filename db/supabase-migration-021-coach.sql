-- 021: AI Coach — Fase 1 (quiz, workout plan, CTA event).
--
-- Tabel untuk alur AI Coach baru: quiz analisa -> workout plan terstruktur
-- (bisa di-adjust) -> CTA (konsultasi specialist / membership / mulai sendiri).
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4): project Supabase cpvzwqptzcxnwzfzgrmt dipakai
-- bersama banyak app. Spesifikasi menyebut coach_quiz_responses / workout_plans /
-- coach_cta_events; dipakai prefix wajib. Keyed auth_user_id + RLS auth.uid()=auth_user_id
-- (pola sama my20fit_daily_log / my20fit_sleep).
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.
--
-- Catatan Fase: tabel SESSION + LOG (workout_session, exercise_log) ada di migration
-- 022 (Fase 2); achievement (achievement_def, user_achievement) di migration 023 (Fase 3).

-- ============================================================
-- 1) my20fit_coach_quiz — hasil quiz analisa AI Coach (1 baris per user, upsert)
-- ============================================================
-- answers  = jsonb bebas: goal, improve, difficulty, level, self_test, availability, location.
-- safety   = jsonb skrining keamanan: {injury:bool, pain_now:bool, medical:bool, note:text}.
-- consent  = persetujuan pemrosesan DATA KESEHATAN (skrining cedera/medis) — UU PDP 27/2022.
--            Wajib true sebelum quiz disimpan; consent_at = kapan disetujui.
create table if not exists public.my20fit_coach_quiz (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   uuid not null references auth.users(id) on delete cascade,
  answers        jsonb not null default '{}'::jsonb,
  safety_flags   jsonb not null default '{}'::jsonb,
  consent_health boolean not null default false,
  consent_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint my20fit_coach_quiz_user_uniq unique (auth_user_id)
);

-- ============================================================
-- 2) my20fit_workout_plan — plan latihan terstruktur (boleh banyak versi, 1 aktif)
-- ============================================================
-- plan   = jsonb: {plan_name, level, goal, location, days_per_week, minutes_per_session,
--                  needs_specialist, weekly_note, days:[{key,label,focus,exercises:[
--                  {key,name,sets,reps,unit,rest_sec,note,progression}]}], disclaimer}.
-- source = 'ai' (dari edge my20fit-ai action=program) | 'rule' (generator aturan) | 'adjusted'.
create table if not exists public.my20fit_workout_plan (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  goal         text,
  level        text,
  plan         jsonb not null,
  version      int  not null default 1,
  is_active    boolean not null default true,
  source       text not null default 'rule',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.my20fit_workout_plan drop constraint if exists my20fit_workout_plan_src_chk;
alter table public.my20fit_workout_plan add constraint my20fit_workout_plan_src_chk
  check (source in ('ai','rule','adjusted'));

-- Cari plan aktif user dengan cepat. Tak dipaksa unik di DB (transisi ganti-aktif lebih
-- aman di aplikasi: set semua is_active=false lalu insert baru true).
create index if not exists my20fit_workout_plan_user_active
  on public.my20fit_workout_plan (auth_user_id, is_active, created_at desc);

-- ============================================================
-- 3) my20fit_coach_cta_event — jejak klik CTA (analitik konversi), append-only
-- ============================================================
create table if not exists public.my20fit_coach_cta_event (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  cta_type     text not null,
  plan_id      uuid,
  created_at   timestamptz not null default now()
);

alter table public.my20fit_coach_cta_event drop constraint if exists my20fit_coach_cta_type_chk;
alter table public.my20fit_coach_cta_event add constraint my20fit_coach_cta_type_chk
  check (cta_type in ('consult_specialist','membership','start_solo'));

create index if not exists my20fit_coach_cta_user_date
  on public.my20fit_coach_cta_event (auth_user_id, created_at desc);

-- ============================================================
-- RLS — user HANYA barisnya sendiri (server pakai service_role -> bypass; jalur ini
-- juga bisa dipanggil dari browser dgn JWT user, jadi RLS penjaga sebenarnya).
-- ============================================================
alter table public.my20fit_coach_quiz enable row level security;
drop policy if exists p_coach_quiz_all on public.my20fit_coach_quiz;
create policy p_coach_quiz_all on public.my20fit_coach_quiz
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

alter table public.my20fit_workout_plan enable row level security;
drop policy if exists p_workout_plan_all on public.my20fit_workout_plan;
create policy p_workout_plan_all on public.my20fit_workout_plan
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

alter table public.my20fit_coach_cta_event enable row level security;
drop policy if exists p_coach_cta_all on public.my20fit_coach_cta_event;
create policy p_coach_cta_all on public.my20fit_coach_cta_event
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) Ketiga tabel ini ditambahkan ke USER_DATA_TABLES di server.js (ekspor & hapus data
--    pribadi /api/account/export & /delete) — sudah dikerjakan di commit fitur.
-- b) Jalankan migration ini SEBELUM deploy kode yang menyentuhnya. Kalau belum dijalankan,
--    server membungkus akses tabel dgn try/catch: alur Coach tetap render tapi belum bisa
--    menyimpan plan sampai tabel ada.
-- c) my20fit_coach_quiz.consent_health WAJIB true sebelum quiz disimpan (ditegakkan server).
