-- ============================================================
--  20fit — Migration 009: Email automations (trigger otomatis + dry-run)
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan.
--
--  Automation = segmen yang dikirim OTOMATIS saat member memenuhi kondisi
--  (cron harian). WAJIB mulai mode dry-run (hitung & catat, JANGAN kirim).
--  Namespace my20fit_. RLS deny-public.
-- ============================================================

create table if not exists public.my20fit_email_automations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  segment_id   text not null,
  template_id  text not null,
  subject      text not null,
  enabled      boolean not null default false,
  dry_run      boolean not null default true,   -- WAJIB mulai dry-run
  daily_cap    integer not null default 100,    -- batas harian per automation (anti lonjakan)
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.my20fit_email_automations enable row level security;

-- Dedup "satu member sekali per automation" + catatan dry-run untuk review.
create table if not exists public.my20fit_email_automation_log (
  id            uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.my20fit_email_automations(id) on delete cascade,
  user_id       uuid not null,
  action        text not null,                  -- 'dry_run' | 'queued'
  send_id       uuid,                            -- kalau 'queued' → link ke my20fit_email_sends
  created_at    timestamptz not null default now()
);
create unique index if not exists my20fit_automation_log_uidx
  on public.my20fit_email_automation_log (automation_id, user_id, action);
create index if not exists my20fit_automation_log_idx
  on public.my20fit_email_automation_log (automation_id, action, created_at desc);
alter table public.my20fit_email_automation_log enable row level security;
