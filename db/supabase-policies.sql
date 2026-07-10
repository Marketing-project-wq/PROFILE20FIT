-- =============================================================
--  RLS POLICIES — biar data dari web bisa MASUK ke tabel my20fit_*
--  dan tiap user HANYA bisa akses datanya sendiri (aman).
--  Jalankan sekali di Supabase > SQL Editor.
-- =============================================================

-- Helper: pola standar "user hanya boleh akses baris miliknya"
-- (auth_user_id = id user yang sedang login)

-- ---------- my20fit_profile ----------
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

-- ---------- my20fit_health_entry ----------
alter table public.my20fit_health_entry enable row level security;
drop policy if exists p_health_all on public.my20fit_health_entry;
create policy p_health_all on public.my20fit_health_entry
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---------- my20fit_daily_log ----------
alter table public.my20fit_daily_log enable row level security;
drop policy if exists p_daily_all on public.my20fit_daily_log;
create policy p_daily_all on public.my20fit_daily_log
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---------- my20fit_workout ----------
alter table public.my20fit_workout enable row level security;
drop policy if exists p_workout_all on public.my20fit_workout;
create policy p_workout_all on public.my20fit_workout
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ---------- my20fit_mcu_result ----------
alter table public.my20fit_mcu_result enable row level security;
drop policy if exists p_mcu_all on public.my20fit_mcu_result;
create policy p_mcu_all on public.my20fit_mcu_result
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
