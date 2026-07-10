-- ============================================================
--  20fit — Setup Database (jalankan di Supabase > SQL Editor)
--  Aman dijalankan berkali-kali (idempotent).
--  Sudah otomatis diterapkan juga lewat migration — ini buat
--  jaga-jaga / kalau mau setup ulang di project lain.
-- ============================================================

-- 1) KOLOM BARU di my20fit_profile (register/onboarding)
alter table public.my20fit_profile
  add column if not exists main_goal text,
  add column if not exists health_conditions jsonb not null default '[]'::jsonb;

-- 2) KOLOM BARU di my20fit_daily_log (tidur / air / napas)
alter table public.my20fit_daily_log
  add column if not exists sleep_hours numeric,
  add column if not exists water_glasses integer not null default 0,
  add column if not exists breathing_done boolean not null default false;

-- default supaya upsert harian tidak gagal
alter table public.my20fit_daily_log alter column water_logs set default '[]'::jsonb;
alter table public.my20fit_daily_log alter column checklist  set default '{}'::jsonb;

-- 1 baris per user per tanggal (untuk upsert harian)
create unique index if not exists my20fit_daily_log_user_date
  on public.my20fit_daily_log (auth_user_id, log_date);

-- 3) RLS — tiap user HANYA bisa akses datanya sendiri
-- ---- my20fit_profile ----
alter table public.my20fit_profile enable row level security;
drop policy if exists p_profile_select on public.my20fit_profile;
drop policy if exists p_profile_insert on public.my20fit_profile;
drop policy if exists p_profile_update on public.my20fit_profile;
create policy p_profile_select on public.my20fit_profile
  for select using (auth.uid() = auth_user_id);
create policy p_profile_insert on public.my20fit_profile
  for insert with check (auth.uid() = auth_user_id);
create policy p_profile_update on public.my20fit_profile
  for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---- my20fit_health_entry ----
alter table public.my20fit_health_entry enable row level security;
drop policy if exists p_health_all on public.my20fit_health_entry;
create policy p_health_all on public.my20fit_health_entry
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---- my20fit_daily_log ----
alter table public.my20fit_daily_log enable row level security;
drop policy if exists p_daily_all on public.my20fit_daily_log;
create policy p_daily_all on public.my20fit_daily_log
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---- my20fit_workout ----
alter table public.my20fit_workout enable row level security;
drop policy if exists p_workout_all on public.my20fit_workout;
create policy p_workout_all on public.my20fit_workout
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---- my20fit_mcu_result ----
alter table public.my20fit_mcu_result enable row level security;
drop policy if exists p_mcu_all on public.my20fit_mcu_result;
create policy p_mcu_all on public.my20fit_mcu_result
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---- email_verification_tokens (OTP) — diakses server (service role) ----
alter table public.email_verification_tokens enable row level security;
-- tidak ada policy publik: hanya server (service_role) yang boleh akses.
