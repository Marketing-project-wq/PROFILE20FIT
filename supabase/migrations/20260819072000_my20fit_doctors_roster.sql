-- ============================================================
-- 20260819072000_my20fit_doctors_roster
-- Roster dokter/terapis untuk TAMPILAN publik (Book Doctor). KOSONG saat dibuat — diisi
-- via CMS dengan nama & foto yang sengaja disiapkan untuk publik (izin dokter). JANGAN tarik
-- nama/foto dari admin_users (akun staf internal). admin_user_id = tautan internal opsional,
-- dipakai menampilkan siapa yang menangani SETELAH admin menugaskan, bukan untuk user memilih.
-- RLS: publik hanya boleh baca baris is_active=true.
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

create table if not exists my20fit_doctors (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references admin_users(id),
  display_name text not null,
  speciality text,
  bio text,
  photo_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table my20fit_doctors enable row level security;
grant select on my20fit_doctors to anon, authenticated;
create policy "doctors_public_read_active" on my20fit_doctors
  for select to anon, authenticated using (is_active = true);
