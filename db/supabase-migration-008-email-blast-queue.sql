-- ============================================================
--  20fit — Migration 008: Send queue blast email (admin)
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan.
--
--  Blast bertahap & bisa dihentikan. Snapshot penerima DIBEKUKAN saat antrian
--  dibuat (jangan hitung ulang segmen saat pengiriman berjalan).
--  Namespace my20fit_. RLS deny-public (hanya server/service key).
-- ============================================================

-- Satu baris per operasi blast.
create table if not exists public.my20fit_email_sends (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,                 -- nama campaign (dipakai konfirmasi ketik-ulang)
  segment_id          text not null,                 -- preset id
  template_id         text not null,
  subject             text not null,
  status              text not null default 'draft',
                        -- draft|preview|queued|sending|paused|completed|cancelled|failed
  total_matched       integer not null default 0,
  total_eligible      integer not null default 0,
  total_sent          integer not null default 0,
  total_failed        integer not null default 0,
  daily_cap           integer,                       -- warm-up: maks kirim / hari (null = tak dibatasi)
  batch_size          integer not null default 50,
  batch_gap_seconds   integer not null default 60,
  test_sent_at        timestamptz,                   -- gate: tes wajib sebelum confirm
  created_by          text,
  approved_by         text,
  started_at          timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  exclusion_breakdown jsonb,
  abort_reason        text,
  created_at          timestamptz not null default now()
);
create index if not exists my20fit_email_sends_status_idx on public.my20fit_email_sends (status, created_at desc);
alter table public.my20fit_email_sends enable row level security;

-- Antrian per penerima (snapshot beku).
create table if not exists public.my20fit_email_send_recipients (
  id             uuid primary key default gen_random_uuid(),
  send_id        uuid not null references public.my20fit_email_sends(id) on delete cascade,
  user_id        uuid not null,
  email          text not null,
  status         text not null default 'pending',    -- pending|sent|failed|skipped|cancelled
  batch_number   integer,
  sent_at        timestamptz,
  error_message  text,
  message_log_id uuid,
  created_at     timestamptz not null default now()
);
-- Satu user hanya sekali per send (idempotensi snapshot).
create unique index if not exists my20fit_send_recipient_uidx
  on public.my20fit_email_send_recipients (send_id, user_id);
-- Ambil batch berikutnya: pending per send.
create index if not exists my20fit_send_recipient_pending_idx
  on public.my20fit_email_send_recipients (send_id, status);
alter table public.my20fit_email_send_recipients enable row level security;
