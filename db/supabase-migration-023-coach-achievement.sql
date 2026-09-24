-- 023: AI Coach — Fase 3 (achievement / badge).
--
-- Melanjutkan Fase 1 (021) & Fase 2 (022). Fase 3 menambah:
--   * my20fit_coach_achievement — badge yang SUDAH diraih user (1 baris per badge).
--
-- Chart progress per gerakan TIDAK butuh tabel baru: dihitung dari my20fit_coach_set_log
-- (Fase 2). Definisi badge ada di server.js (code-side); tabel ini cuma menyimpan yang
-- sudah diraih + kapan, supaya "baru diraih" bisa dideteksi & tak dobel.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4). Keyed auth_user_id + RLS auth.uid()=auth_user_id.
-- JALANKAN MANUAL di Supabase SQL Editor. Idempoten — aman dijalankan ulang.

create table if not exists public.my20fit_coach_achievement (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  key           text not null,           -- id badge (mis. 'first_session','streak_3')
  earned_at     timestamptz not null default now(),
  meta          jsonb not null default '{}'::jsonb,
  constraint my20fit_coach_ach_uniq unique (auth_user_id, key)
);

create index if not exists my20fit_coach_ach_user
  on public.my20fit_coach_achievement (auth_user_id, earned_at desc);

alter table public.my20fit_coach_achievement enable row level security;
drop policy if exists p_coach_ach_all on public.my20fit_coach_achievement;
create policy p_coach_ach_all on public.my20fit_coach_achievement
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) Ditambahkan ke USER_DATA_TABLES di server.js (ekspor/hapus data akun) — di commit fitur.
-- b) Jalankan SEBELUM deploy kode yang menyentuhnya. Kalau belum: server membungkus akses
--    dgn try/catch -> section Progress tetap render (badge dihitung dari data sesi), cuma
--    status "sudah diraih" tak tersimpan sampai tabel ada.
