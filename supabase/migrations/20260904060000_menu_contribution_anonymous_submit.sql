-- Tahap 8 ("Kirim menu TANPA login"): kontributor anonim boleh submit resep — tetap MASUK
-- ANTREAN MODERASI admin (status default 'pending', tidak langsung tayang). Anti-spam tanpa
-- captcha diatur di server.js (honeypot + batas harian per sesi-cookie & per IP + dedup
-- content_hash). Migrasi ini hanya menyiapkan skema; GERBANG TAYANG tetap approve/reject admin.
--
-- Aman & backward-compatible: hanya melonggarkan NOT NULL + menambah kolom nullable. Baris lama
-- (semuanya punya auth_user_id) tetap valid. Tidak mengubah perilaku submission user login.

-- 1) auth_user_id boleh NULL untuk kiriman anonim (FK ke auth.users tetap; null diizinkan FK).
alter table public.my20fit_menu_contribution
  alter column auth_user_id drop not null;

-- 2) Jejak kontributor anonim (dipakai server utk batas harian & konteks moderasi).
--    anon_id      -> id sesi anonim (cookie httpOnly eco_anon, tabel my20fit_anonymous_sessions).
--    submit_ip_hash -> HASH IP saat submit (bukan IP mentah) utk batas per-IP (cegah hapus-cookie).
alter table public.my20fit_menu_contribution
  add column if not exists anon_id text,
  add column if not exists submit_ip_hash text;

comment on column public.my20fit_menu_contribution.anon_id is
  'Kiriman anonim (tanpa login): id sesi anonim (cookie eco_anon). NULL utk kontributor login.';
comment on column public.my20fit_menu_contribution.submit_ip_hash is
  'Kiriman anonim: hash IP saat submit (bukan IP mentah) utk rate-limit per-IP. NULL utk kontributor login.';

-- 3) Setiap baris WAJIB punya salah satu penanggung jawab: user login ATAU sesi anonim.
--    (Baris lama semuanya punya auth_user_id -> lolos.)
alter table public.my20fit_menu_contribution
  drop constraint if exists my20fit_menu_contribution_author_present;
alter table public.my20fit_menu_contribution
  add constraint my20fit_menu_contribution_author_present
  check (auth_user_id is not null or anon_id is not null);

-- 4) Index utk hitung batas harian anonim (per sesi & per IP) — hanya baris anonim.
create index if not exists my20fit_menu_contribution_anon_idx
  on public.my20fit_menu_contribution (anon_id, created_at)
  where anon_id is not null;
create index if not exists my20fit_menu_contribution_anon_ip_idx
  on public.my20fit_menu_contribution (submit_ip_hash, created_at)
  where submit_ip_hash is not null;

-- 5) Keamanan: anon_id/submit_ip_hash TIDAK di-grant ke role `authenticated` (tak masuk daftar
--    GRANT INSERT/UPDATE di migrasi sebelumnya) -> hanya service role (server.js) yang boleh
--    mengisinya. Kiriman anonim TIDAK punya row-policy RLS -> TIDAK bisa lewat REST langsung,
--    WAJIB lewat endpoint server (yang menerapkan honeypot + rate-limit). Tak ada perubahan
--    GRANT/RLS yang diperlukan di sini.
