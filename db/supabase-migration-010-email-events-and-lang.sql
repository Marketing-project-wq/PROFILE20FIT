-- ============================================================
--  20fit — Migration 010: email_events (audit per-event) + kolom bahasa
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan.
--
--  Bagian dari FASE 3 (infrastruktur pengiriman & tracking):
--   1) FIX: kolom `lang` di my20fit_user_comm_prefs. Kode bilingual (#273)
--      MENULIS prefs.lang, tapi belum ada kolomnya → update consent gagal.
--   2) Kolom `language` di my20fit_message_log — catat bahasa saat kirim.
--   3) Tabel my20fit_email_events — log APPEND-ONLY tiap event webhook Resend
--      (sent/delivered/opened/clicked/bounced/complained/failed/suppressed/
--      delivery_delayed). message_log tetap "state per-kirim"; tabel ini
--      menyimpan RIWAYAT granular + clicked_url + occurred_at (dari payload)
--      + raw_payload untuk debugging & analitik link-diklik.
--
--  Namespace WAJIB my20fit_. RLS deny-public (hanya service_role/server).
-- ============================================================

-- 1) FIX kolom bahasa email pilihan user (dipakai engine campaign bilingual).
alter table public.my20fit_user_comm_prefs
  add column if not exists lang text not null default 'id';
-- Batasi ke 'id'/'en'. Pakai DO block supaya idempoten (constraint sekali saja).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'my20fit_comm_prefs_lang_chk'
  ) then
    alter table public.my20fit_user_comm_prefs
      add constraint my20fit_comm_prefs_lang_chk check (lang in ('id', 'en'));
  end if;
end $$;

-- 2) Bahasa yang dipakai saat mengirim (untuk enrich email_events & analitik).
alter table public.my20fit_message_log
  add column if not exists language text;

-- 3) Tabel event webhook (append-only). Satu baris per event Resend.
create table if not exists public.my20fit_email_events (
  id                  uuid primary key default gen_random_uuid(),
  -- Dedup webhook retry: svix-id sama saat Resend mengirim ulang event yang sama.
  webhook_id          text,
  resend_email_id     text,                       -- = provider_message_id (penghubung)
  message_log_id      uuid,                       -- link ke my20fit_message_log.id (best-effort)
  user_id             uuid,
  recipient_email     text,
  channel             text,                       -- transactional | marketing | meal_reminder
  campaign_id         text,
  template_id         text,
  meal_window         text,
  subject             text,
  language            text,
  event_type          text not null,              -- sent|delivered|opened|clicked|bounced|complained|failed|suppressed|delivery_delayed
  clicked_url         text,                       -- khusus email.clicked
  occurred_at         timestamptz,                -- created_at DARI PAYLOAD (bukan waktu kita terima)
  raw_payload         jsonb,                      -- payload mentah untuk debugging
  created_at          timestamptz not null default now()  -- waktu kita menyimpan (audit)
);

-- Idempotency webhook: satu svix-id hanya boleh 1 baris (retry tak duplikat).
create unique index if not exists my20fit_email_events_webhook_uidx
  on public.my20fit_email_events (webhook_id)
  where webhook_id is not null;

create index if not exists my20fit_email_events_resend_idx
  on public.my20fit_email_events (resend_email_id)
  where resend_email_id is not null;
create index if not exists my20fit_email_events_user_idx
  on public.my20fit_email_events (user_id, occurred_at desc);
create index if not exists my20fit_email_events_type_idx
  on public.my20fit_email_events (event_type, occurred_at desc);
create index if not exists my20fit_email_events_msg_idx
  on public.my20fit_email_events (message_log_id)
  where message_log_id is not null;

alter table public.my20fit_email_events enable row level security;
-- Deny-public: tak ada policy → hanya service_role (server) yang akses.
