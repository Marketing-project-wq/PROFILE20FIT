-- ============================================================
--  20fit — Migration 006: Consent, suppression & campaign enrollment
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan.
--
--  Prasyarat sistem email marketing/reminder (Fase 2). Tanpa ini, campaign
--  apa pun DILARANG jalan (kepatuhan UU PDP + syarat bulk Gmail/Yahoo).
--
--  Namespace: WAJIB prefix my20fit_. RLS: deny-public (akses lewat server/service key).
--  Timezone pengiriman di app SELALU WIB — kolom timezone disimpan untuk masa depan
--  tapi scheduler saat ini memakai WIB tetap.
-- ============================================================

-- ---------- 1) Preferensi komunikasi + setelan meal reminder (1 baris / user) ----------
create table if not exists public.my20fit_user_comm_prefs (
  user_id                       uuid primary key,               -- = auth_user_id
  -- Consent TERPISAH per bucket (jangan digabung — orang bisa mau satu, tak mau lainnya).
  consent_marketing             boolean not null default false,
  consent_meal_reminder         boolean not null default false,
  consent_updated_at            timestamptz,
  consent_source                text,                            -- signup | settings | import | unsubscribe_page
  timezone                      text not null default 'Asia/Jakarta',
  -- Setelan meal reminder per user.
  reminder_breakfast_enabled    boolean not null default true,
  reminder_lunch_enabled        boolean not null default true,
  reminder_dinner_enabled       boolean not null default true,
  reminder_breakfast_time       time not null default '06:00',
  reminder_lunch_time           time not null default '12:00',
  reminder_dinner_time          time not null default '18:00',
  -- Penurunan otomatis kalau diabaikan (dipakai engine Fase 4).
  reminder_consecutive_ignored  integer not null default 0,
  reminder_paused_at            timestamptz,
  -- Token unsubscribe: OPAQUE & unguessable, TIDAK membocorkan user_id di URL.
  unsub_token                   uuid not null default gen_random_uuid(),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);
create unique index if not exists my20fit_comm_prefs_unsub_token_uidx
  on public.my20fit_user_comm_prefs (unsub_token);

alter table public.my20fit_user_comm_prefs enable row level security;
-- User boleh baca & ubah preferensi miliknya sendiri (halaman Settings in-app).
drop policy if exists p_comm_prefs_select_own on public.my20fit_user_comm_prefs;
create policy p_comm_prefs_select_own on public.my20fit_user_comm_prefs
  for select using (auth.uid() = user_id);
drop policy if exists p_comm_prefs_upsert_own on public.my20fit_user_comm_prefs;
create policy p_comm_prefs_upsert_own on public.my20fit_user_comm_prefs
  for insert with check (auth.uid() = user_id);
drop policy if exists p_comm_prefs_update_own on public.my20fit_user_comm_prefs;
create policy p_comm_prefs_update_own on public.my20fit_user_comm_prefs
  for update using (auth.uid() = user_id);
-- Halaman unsubscribe TANPA login memakai unsub_token → jalur server (service key).

-- ---------- 2) Suppression list (jangan pernah kirim ke sini) ----------
create table if not exists public.my20fit_suppression_list (
  email        text primary key,                                -- unique by email
  user_id      uuid,
  reason       text not null,                                   -- unsubscribe|hard_bounce|spam_complaint|dormant|manual
  is_permanent boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists my20fit_suppression_user_idx
  on public.my20fit_suppression_list (user_id);
alter table public.my20fit_suppression_list enable row level security;
-- Deny-public total: hanya server (service key). Tak ada policy.

-- ---------- 3) Enrollment campaign (drip onboarding, dst.) ----------
create table if not exists public.my20fit_campaign_enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  campaign_id  text not null,                                   -- mis. 'onboarding_no_scan'
  current_step integer not null default 0,
  enrolled_at  timestamptz not null default now(),
  next_send_at timestamptz,
  status       text not null default 'active',                  -- active|completed|exited|paused
  exit_reason  text,                                            -- converted|unsubscribed|no_engagement|churned
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
-- Satu enrollment AKTIF per (user, campaign): cegah dobel-daftar.
create unique index if not exists my20fit_enroll_active_uidx
  on public.my20fit_campaign_enrollments (user_id, campaign_id)
  where status = 'active';
create index if not exists my20fit_enroll_due_idx
  on public.my20fit_campaign_enrollments (status, next_send_at);
create index if not exists my20fit_enroll_user_idx
  on public.my20fit_campaign_enrollments (user_id, campaign_id, created_at desc);
alter table public.my20fit_campaign_enrollments enable row level security;
-- Deny-public: hanya server (service key).
