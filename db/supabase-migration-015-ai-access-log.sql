-- 015: Jejak akses AI (MCU + translate) — audit ringan.
-- Mencatat SIAPA (auth_user_id) + KAPAN + berhasil/gagal untuk /api/mcu & /api/translate.
-- TIDAK menyimpan isi file atau hasil analisis — HANYA jejak akses (audit trail).
-- Alasan: kalau di masa depan ada pertanyaan "pernah dipakai siapa/kapan", ada jawabannya.
-- deny-public RLS: hanya service_role (server) yang menulis/membaca (service key bypass RLS).

create table if not exists public.my20fit_ai_access_log (
  id           bigint generated always as identity primary key,
  auth_user_id uuid,
  route        text not null,          -- 'mcu' | 'translate'
  ok           boolean not null default false,
  err_code     text,                   -- mis. 'AbortError' saat timeout; null kalau ok
  created_at   timestamptz not null default now()
);

create index if not exists my20fit_ai_access_log_user_idx
  on public.my20fit_ai_access_log (auth_user_id, created_at desc);
create index if not exists my20fit_ai_access_log_created_idx
  on public.my20fit_ai_access_log (created_at desc);

-- Tanpa policy apa pun => deny-public. Server memakai service_role (bypass RLS).
alter table public.my20fit_ai_access_log enable row level security;
