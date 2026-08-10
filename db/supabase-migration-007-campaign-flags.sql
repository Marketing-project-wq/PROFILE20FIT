-- ============================================================
--  20fit — Migration 007: Kill switch campaign (per-campaign on/off)
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan.
--
--  Kill switch tanpa deploy: admin bisa MEMATIKAN campaign seketika. Monitoring
--  otomatis juga menulis ke sini (auto-stop kalau complaint/bounce/unsub tinggi).
--  Runner (meal reminder & onboarding) cek flag ini sebelum kirim.
--  Namespace my20fit_. RLS deny-public (hanya server/service key).
-- ============================================================

create table if not exists public.my20fit_campaign_flags (
  campaign_id text primary key,          -- 'meal_reminder' | 'onboarding_no_scan'
  enabled     boolean not null default true,
  note        text,                       -- alasan (mis. 'auto-stop: complaint 0.3%')
  updated_by  text,
  updated_at  timestamptz not null default now()
);

alter table public.my20fit_campaign_flags enable row level security;
-- Deny-public: tak ada policy → hanya service_role.

-- Seed default (enabled) untuk dua campaign. Idempoten.
insert into public.my20fit_campaign_flags (campaign_id, enabled, note)
values ('meal_reminder', true, 'default'), ('onboarding_no_scan', true, 'default')
on conflict (campaign_id) do nothing;
