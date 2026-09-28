-- =============================================================================
-- 025 — Activity uploads + today plans
-- Alur: user upload screenshot health/olahraga -> AI extract -> AI full plan
-- (workout/food/sleep/hydration + coach says) -> simpan + tampil di /activity.
-- Prefix my20fit_* (project Supabase dipakai bareng app lain). RLS own-row.
-- JALANKAN MANUAL di Supabase SQL Editor (lihat docs/DATABASE.md). Additif & aman
-- (CREATE TABLE IF NOT EXISTS) — tidak menyentuh tabel lain.
-- =============================================================================

-- Setiap upload screenshot + hasil analisanya.
create table if not exists my20fit_activity_uploads (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  upload_type text,                              -- workout|sleep|daily_activity|weight|food_log|other
  upload_date date not null default current_date,
  extracted_data jsonb not null default '{}'::jsonb,   -- hasil scan AI
  yesterday_gaps jsonb,                          -- apa yang kurang kemarin
  today_plan jsonb,                              -- full plan hari ini (snapshot)
  coach_says text,                               -- komentar coach singkat
  coach_id text,
  source text,                                   -- garmin|apple|samsung|strava|manual|other
  model_used text,
  created_at timestamptz not null default now()
);

-- Plan gabungan per hari (workout+food+sleep+hydration). Satu baris per user per tanggal.
create table if not exists my20fit_today_plans (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null default current_date,
  workout_plan jsonb,
  food_plan jsonb,
  sleep_plan jsonb,
  hydration_plan jsonb,
  yesterday_gaps jsonb,
  coach_id text,
  coach_says text,
  source_upload_id uuid references my20fit_activity_uploads(id) on delete set null,
  workout_done boolean default false,
  food_logged boolean default false,
  sleep_logged boolean default false,
  hydration_logged boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id, plan_date)
);

create index if not exists idx_my20fit_activity_uploads_user
  on my20fit_activity_uploads (auth_user_id, upload_date desc);
create index if not exists idx_my20fit_today_plans_user
  on my20fit_today_plans (auth_user_id, plan_date desc);

alter table my20fit_activity_uploads enable row level security;
alter table my20fit_today_plans enable row level security;

-- RLS own-row (server pakai service key => bypass; ini pengaman utk akses langsung).
drop policy if exists "own_activity_uploads" on my20fit_activity_uploads;
create policy "own_activity_uploads" on my20fit_activity_uploads for all
  using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

drop policy if exists "own_today_plans" on my20fit_today_plans;
create policy "own_today_plans" on my20fit_today_plans for all
  using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
