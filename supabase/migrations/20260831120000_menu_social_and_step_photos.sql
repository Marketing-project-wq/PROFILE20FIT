-- ============================================================
-- 20260831120000_menu_social_and_step_photos
-- recepie.20fit.id (app menu) — fitur sosial resep + foto per-langkah.
--
--   my20fit_menu_reaction : "heart"/suka, 1 user 1 reaction per resep (toggle on/off).
--   my20fit_menu_save     : simpan resep ke koleksi user.
--   Keduanya key ke (source, menu_id): source 'official' (id slug dari js/recipes.js)
--   atau 'member' (uuid my20fit_menu_contribution). RLS AKTIF tanpa policy = deny-public
--   (persis pola my20fit_menu_contribution): SEMUA akses lewat server pakai service key,
--   jadi jumlah reaction dihitung server-side & tak bisa dicurangi dari client. Unique
--   (auth_user_id, source, menu_id) = pengaman anti-spam di level DB (1 baris per user/resep).
--
--   my20fit_menu_contribution: kolom BARU (semua nullable, kompatibel mundur — kolom
--   `steps` text lama tetap dipakai untuk moderasi & fallback):
--     steps_json   jsonb  — langkah terstruktur: [{ "t": "teks langkah", "photo": "<url>|null" }]
--     servings     int    — perkiraan porsi (opsional)
--     cook_minutes int    — perkiraan waktu masak menit (opsional)
--
--   Bucket 'menu-photos' (publik, 5 MB, gambar saja) — di-upload SERVER (service role),
--   nama file acak/tak tertebak; URL publik dipakai di foto utama & foto tiap langkah.
--   Pola sama 'coach-photos'/'event-covers'. Bucket publik → objek terbaca via URL publik
--   tanpa policy tambahan (baca-anon lintas-bucket sudah dibatasi ke public=true di
--   20260824053000_storage_blanket_policy_harden).
--
-- Namespace my20fit_* + RLS sesuai docs/DATABASE.md.
-- CATATAN: BELUM diterapkan ke cpvzwqptzcxnwzfzgrmt — menunggu review.
-- ============================================================

-- 1) REACTION (heart) ----------------------------------------------------------
create table if not exists my20fit_menu_reaction (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  source       text not null check (source in ('official','member')),
  menu_id      text not null,
  kind         text not null default 'heart',
  created_at   timestamptz not null default now(),
  unique (auth_user_id, source, menu_id)
);
create index if not exists my20fit_menu_reaction_lookup
  on my20fit_menu_reaction (source, menu_id);
alter table my20fit_menu_reaction enable row level security;
-- Tanpa policy → deny-public. Akses hanya via server (service key).

-- View agregat jumlah heart (hitung di DB, skalabel utk grid). Dibaca server via service
-- key; TIDAK di-grant ke anon/authenticated → tetap deny-public seperti tabel dasarnya.
create or replace view my20fit_menu_reaction_count as
  select source, menu_id, count(*)::int as cnt
  from my20fit_menu_reaction
  group by source, menu_id;

-- 2) SAVE (koleksi) ------------------------------------------------------------
create table if not exists my20fit_menu_save (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  source       text not null check (source in ('official','member')),
  menu_id      text not null,
  created_at   timestamptz not null default now(),
  unique (auth_user_id, source, menu_id)
);
create index if not exists my20fit_menu_save_owner
  on my20fit_menu_save (auth_user_id, created_at desc);
alter table my20fit_menu_save enable row level security;
-- Tanpa policy → deny-public. Akses hanya via server (service key).

-- 3) STEP BERFOTO + porsi/waktu (kontribusi member) ----------------------------
alter table my20fit_menu_contribution add column if not exists steps_json   jsonb;
alter table my20fit_menu_contribution add column if not exists servings     int;
alter table my20fit_menu_contribution add column if not exists cook_minutes int;

-- 4) BUCKET foto (utama + tiap langkah) ----------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos','menu-photos', true, 5242880,  -- 5 MB
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
