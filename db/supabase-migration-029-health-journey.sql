-- 029: Health Journey (checklist setelah Visbody), status tur fitur, log event funnel,
--      target kalori pilihan user.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4). Semua aditif & idempoten.
-- Penulisan SELURUHNYA lewat server (service_role). RLS: user hanya boleh MEMBACA baris
-- miliknya di journey & tour; event log tanpa policy (server saja).

-- 1) Checklist Health Journey — 1 baris per user. Langkah yang bisa dibaca dari data lain
--    (lihat hasil = my20fit_visbody_scan.viewed_at, chat coach, plan dibuat) TIDAK disimpan
--    di sini; yang disimpan hanya yang memang tak punya sumber lain.
--    steps  : {"class_booked":"<iso>", "bmr_target":"<iso>", ...}  (waktu langkah ditandai)
--    nudges : {"<kunci nudge>": {"shown_at":"<iso>","clicked_at":"<iso>","dismissed_at":"<iso>"}}
create table if not exists public.my20fit_health_journey (
  auth_user_id    uuid primary key references auth.users(id) on delete cascade,
  steps           jsonb not null default '{}'::jsonb,
  rescan_due      date,
  hs_unlocked_at  timestamptz,
  hs_unlock_source text,
  nudges          jsonb not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);
alter table public.my20fit_health_journey enable row level security;
drop policy if exists p_health_journey_sel on public.my20fit_health_journey;
create policy p_health_journey_sel on public.my20fit_health_journey
  for select using (auth.uid() = auth_user_id);

-- 2) Status tur fitur per user per jenis tur (tampil sekali, lintas device).
create table if not exists public.my20fit_tour_state (
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  tour_key      text not null,
  version       int  not null default 1,
  status        text not null default 'not_started',
  last_step     int  not null default 0,
  seen_steps    text[] not null default '{}',
  updated_at    timestamptz not null default now(),
  primary key (auth_user_id, tour_key),
  constraint my20fit_tour_state_status_chk check (status in ('not_started','in_progress','completed','skipped')),
  constraint my20fit_tour_state_key_len_chk check (char_length(tour_key) between 1 and 60)
);
alter table public.my20fit_tour_state enable row level security;
drop policy if exists p_tour_state_sel on public.my20fit_tour_state;
create policy p_tour_state_sel on public.my20fit_tour_state
  for select using (auth.uid() = auth_user_id);

-- 3) Log event funnel & tur (nama event di-whitelist di server.js).
create table if not exists public.my20fit_event_log (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid references auth.users(id) on delete cascade,   -- null utk event tanpa user (scan masuk)
  event         text not null,
  props         jsonb,
  created_at    timestamptz not null default now(),
  constraint my20fit_event_log_event_len_chk check (char_length(event) between 1 and 60)
);
create index if not exists my20fit_event_log_event_idx on public.my20fit_event_log(event, created_at desc);
create index if not exists my20fit_event_log_user_idx on public.my20fit_event_log(auth_user_id, created_at desc);
alter table public.my20fit_event_log enable row level security;

-- 4) Target kalori pilihan user (mis. dari BMR Visbody, SETELAH user konfirmasi).
--    null = pakai perhitungan otomatis js/nutrition.js seperti sebelumnya.
alter table public.my20fit_profile add column if not exists calorie_target_kcal   int;
alter table public.my20fit_profile add column if not exists calorie_target_source text;
alter table public.my20fit_profile add column if not exists calorie_target_set_at timestamptz;

-- CATATAN: my20fit_health_journey, my20fit_tour_state, my20fit_event_log masuk
-- USER_DATA_TABLES di server.js (ekspor & hapus data pribadi).
