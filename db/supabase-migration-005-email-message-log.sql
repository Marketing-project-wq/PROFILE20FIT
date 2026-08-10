-- ============================================================
--  20fit — Migration 005: message_log (audit + idempotency email)
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan.
--
--  Bagian dari migrasi email ke Resend (Fase 1). Tabel ini adalah SUMBER
--  KEBENARAN untuk: audit tiap pengiriman, idempotency (cegah kirim ganda),
--  dan nanti (Fase 3) pengecekan frekuensi anti-spam.
--
--  Namespace: WAJIB prefix my20fit_ (Supabase dipakai bareng banyak app).
--  RLS: deny-public. Hanya service_role (server) yang menulis/membaca.
--  Kolom channel sengaja generik supaya bisa menampung channel non-email
--  (mis. push) di masa depan tanpa migrasi ulang.
-- ============================================================

create table if not exists public.my20fit_message_log (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid,                       -- auth_user_id penerima (bisa null utk broadcast/manual)
  channel             text not null default 'transactional',
                        -- transactional | marketing | meal_reminder | (push, dst. nanti)
  campaign_id         text,
  template_id         text,
  meal_window         text,                       -- breakfast | lunch | dinner (khusus meal reminder)
  subject             text,
  idempotency_key     text,                       -- kunci anti kirim-ganda
  provider_message_id text,                       -- id dari Resend
  status              text not null default 'queued',
                        -- queued|sent|delivered|opened|clicked|bounced|complained
                        -- |failed|skipped_env|unsubscribed
  error_message       text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  opened_at           timestamptz,
  clicked_at          timestamptz,
  bounced_at          timestamptz,
  complained_at       timestamptz,
  unsubscribed_at     timestamptz,
  created_at          timestamptz not null default now()
);

-- Idempotency: satu idempotency_key hanya boleh sukses sekali.
-- (Partial unique — baris tanpa key / yang gagal tak mengunci apa pun.)
create unique index if not exists my20fit_message_log_idem_uidx
  on public.my20fit_message_log (idempotency_key)
  where idempotency_key is not null;

-- Query frekuensi (Fase 3): "berapa email ke user X dalam N jam terakhir".
create index if not exists my20fit_message_log_user_time_idx
  on public.my20fit_message_log (user_id, created_at desc);

-- Lookup cepat saat webhook Resend datang (Fase 2).
create index if not exists my20fit_message_log_provider_idx
  on public.my20fit_message_log (provider_message_id)
  where provider_message_id is not null;

alter table public.my20fit_message_log enable row level security;
-- Deny-public: TIDAK ada policy → hanya service_role (bypass RLS) yang akses.
-- Sengaja tak ada policy select untuk user: isi log bisa memuat metadata kirim
-- yang tak perlu diekspos ke client. Admin baca lewat server (service key).
