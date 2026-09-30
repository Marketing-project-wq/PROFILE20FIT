-- 027: AI Coach — meal plan dari chat yang "diterapkan" user.
--
-- Chatbot coach bisa memberi rekomendasi meal plan (blok ```json {"type":"meal_plan"}``` di
-- balasan). Kartu meal plan di chat punya tombol "Terapkan meal plan": plan itu disimpan di
-- sini dan tampil di bagian Meal Plan halaman /calories (Calorie Tracker) menggantikan
-- rekomendasi katalog, sampai user kembali ke rekomendasi otomatis (baris dihapus).
--
-- SATU baris per user (plan terakhir yang diterapkan) — tak perlu riwayat; riwayat rekomendasi
-- sudah ada di my20fit_coach_chat_message. plan = JSON ternormalisasi server
-- ({title, calorie_target, meals:[{slot,menu,kcal,protein_g}], notes}); validasi di server.js.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4). Keyed auth_user_id + RLS auth.uid()=auth_user_id
-- (pola sama migration 024); server pakai service_role -> bypass.
--
-- Idempoten — aman dijalankan ulang. Disetujui pemilik (2026-09-30).

create table if not exists public.my20fit_coach_meal_plan (
  auth_user_id  uuid primary key references auth.users(id) on delete cascade,
  coach_id      text not null,
  plan          jsonb not null,
  applied_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint my20fit_coach_meal_plan_coach_len_chk check (char_length(coach_id) between 1 and 40)
);

-- RLS — user HANYA barisnya sendiri (deny-public default; server service_role bypass).
alter table public.my20fit_coach_meal_plan enable row level security;
drop policy if exists p_coach_meal_plan_all on public.my20fit_coach_meal_plan;
create policy p_coach_meal_plan_all on public.my20fit_coach_meal_plan
  for all using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

-- CATATAN: tabel ini masuk USER_DATA_TABLES di server.js (ekspor & hapus data pribadi).
-- Kalau migration belum jalan, endpoint /api/coach/meal-plan* balas setup_required dan
-- /calories tetap menampilkan rekomendasi katalog.
