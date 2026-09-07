-- ============================================================
-- 20260907000000_physiotherapists_roster
-- Roster fisioterapis untuk carousel home ("Our physiotherapists"), sejajar dengan
-- my20fit_doctors. Prefiks my20fit_ (namespace shared DB; CLAUDE.md §4).
--
-- KENAPA TABEL SENDIRI, bukan menumpang tabel yang ada:
--  - my20fit_doctors: fisioterapis BUKAN dokter; menumpang di sana akan menampilkan
--    mereka di bawah judul "Our doctors" (salah gelar profesi). Tabel itu juga dijaga
--    view my20fit_doctors_public + cek CI (scripts/check-doctors-view.js) — jangan diusik.
--  - my20fit_coaches: kolom venue dibatasi check (arena|gym|both); fisioterapis bekerja
--    di klinik, tidak ada nilai yang benar untuk mereka, dan mereka akan muncul di
--    bawah "Meet our coaches".
--
-- RLS deny-public (tanpa policy) -> hanya server (service key) yang baca/tulis,
-- konsisten dengan pola my20fit_ lainnya.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_physiotherapists (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  speciality text,
  bio text,
  photo_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table my20fit_physiotherapists enable row level security;
