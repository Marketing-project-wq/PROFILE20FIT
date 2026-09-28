-- 024: AI Coach — Fase 4 (Chatbot persona: percakapan + riwayat).
--
-- Melengkapi AI Coach jadi CHATBOT dengan persona (Nando/Calysta/Rheza/Elsen).
-- Chatbot ini REUSE data-layer yang sudah ada (TIDAK bikin tabel dobel):
--   * Plan terstruktur  -> my20fit_workout_plan      (migration 021)
--   * Sesi + log set     -> my20fit_coach_session / my20fit_coach_set_log (022)
--   * Achievement/badge  -> my20fit_coach_achievement (023)
--   * Data konteks user  -> my20fit_workout / my20fit_daily_log / my20fit_visbody_body /
--                           my20fit_mcu_result (sudah ada di DB)
-- Yang BENAR-BENAR baru cuma percakapan: SESSION per (user, coach) + MESSAGE per turn.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4): project cpvzwqptzcxnwzfzgrmt dipakai bersama banyak
-- app. Spesifikasi menyebut chat_sessions / chat_messages -> dipakai prefix wajib, dan
-- selaras penamaan tabel coach lain (my20fit_coach_*). Keyed auth_user_id + RLS
-- auth.uid()=auth_user_id (pola sama my20fit_coach_session). Jalur ini juga bisa dipanggil
-- dari browser dgn JWT user, jadi RLS penjaga sebenarnya (server pakai service_role -> bypass).
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.
--
-- URUTAN: jalankan SETELAH 021-023 (chat me-refer my20fit_workout_plan lewat aplikasi, dan
-- alur chat menulis plan/sesi/achievement ke tabel-tabel itu). Kalau 021-023 belum jalan,
-- server tetap membungkus akses tabel dgn try/catch — chat tetap balas, cuma belum bisa
-- simpan plan/sesi sampai tabelnya ada.

-- ============================================================
-- 1) my20fit_coach_chat_session — satu sesi chat per (user, coach)
-- ============================================================
-- coach_id = slug persona ('nando'|'calysta'|'rheza'|'elsen'|...). SENGAJA text bebas
-- (bukan enum/CHECK) supaya nambah/ganti persona TIDAK perlu migration lagi — daftar &
-- validasi persona ada di server.js (code-side). Dibatasi panjang supaya rapi.
create table if not exists public.my20fit_coach_chat_session (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null references auth.users(id) on delete cascade,
  coach_id         text not null,
  last_message_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  -- Satu sesi per user per coach -> sasaran upsert saat buka chat room.
  constraint my20fit_coach_chat_session_user_coach_uniq unique (auth_user_id, coach_id),
  constraint my20fit_coach_chat_session_coach_len_chk check (char_length(coach_id) between 1 and 40)
);

create index if not exists my20fit_coach_chat_session_user
  on public.my20fit_coach_chat_session (auth_user_id, last_message_at desc);

-- ============================================================
-- 2) my20fit_coach_chat_message — history per sesi (1 baris per turn)
-- ============================================================
-- role = 'user' | 'assistant' (persona coach). model_used = model OpenRouter yang dipakai
-- (mis. 'google/gemini-2.5-flash') utk audit/analitik. content dibatasi supaya tak jadi
-- tempat sampah teks raksasa.
create table if not exists public.my20fit_coach_chat_message (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.my20fit_coach_chat_session(id) on delete cascade,
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  role          text not null,
  content       text not null,
  model_used    text,
  created_at    timestamptz not null default now(),
  constraint my20fit_coach_chat_msg_role_chk check (role in ('user','assistant')),
  constraint my20fit_coach_chat_msg_len_chk check (char_length(content) between 1 and 20000)
);

-- Ambil 20 pesan terakhir per sesi (urut terbaru) dengan cepat.
create index if not exists my20fit_coach_chat_message_session
  on public.my20fit_coach_chat_message (session_id, created_at desc);

-- ============================================================
-- RLS — user HANYA barisnya sendiri (deny-public default; server service_role bypass).
-- ============================================================
alter table public.my20fit_coach_chat_session enable row level security;
drop policy if exists p_coach_chat_session_all on public.my20fit_coach_chat_session;
create policy p_coach_chat_session_all on public.my20fit_coach_chat_session
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

alter table public.my20fit_coach_chat_message enable row level security;
drop policy if exists p_coach_chat_message_all on public.my20fit_coach_chat_message;
create policy p_coach_chat_message_all on public.my20fit_coach_chat_message
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) Kedua tabel akan ditambahkan ke USER_DATA_TABLES di server.js (ekspor & hapus data
--    pribadi /api/account/export & /delete) di commit fitur chat.
-- b) Jalankan migration ini (dan 021-023 kalau belum) SEBELUM deploy kode chat. Kalau belum
--    jalan, server membungkus akses tabel dgn try/catch: chat tetap render & balas, tapi
--    riwayat belum tersimpan sampai tabel ada.
-- c) Persona (nama, gaya bicara, system prompt) & model chat (env MODEL_CHAT, default Gemini)
--    ditsetel di code-side (edge function my20fit-ai action 'chat' + server.js), BUKAN di DB.
