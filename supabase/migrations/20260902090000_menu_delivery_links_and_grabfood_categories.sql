-- TAHAP 1 ("Eat Now" via GrabFood/GoFood tanpa API): tabel pemetaan resep -> kategori
-- pesan-antar. Pola (source, menu_id) SAMA dgn my20fit_menu_reaction/caterer_menus
-- (resep official = js/recipes.js, BUKAN baris DB -- jadi tak bisa literal FK; member =
-- baris nyata di my20fit_menu_contribution). provider dibuat enum sejak awal (grabfood
-- sekarang, gofood nanti -- dua perusahaan beda, GoTo vs Grab, pemetaan tetap terpisah
-- per baris meski struktur tabel sama).
create table if not exists public.my20fit_menu_delivery_links (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('official','member')),
  menu_id text not null,
  provider text not null check (provider in ('grabfood','gofood')),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_menu_delivery_links_lookup
  on public.my20fit_menu_delivery_links (source, menu_id) where is_active = true;
alter table public.my20fit_menu_delivery_links enable row level security;
create policy my20fit_menu_delivery_links_sel_active on public.my20fit_menu_delivery_links
  for select using (is_active = true);
-- Tidak ada policy INSERT/UPDATE/DELETE -- hanya service role (CMS admin) yang bisa ubah,
-- pola sama my20fit_caterers/my20fit_caterer_menus.

-- Klik "Eat Now" -- pola SAMA PERSIS my20fit_caterer_clicks: 0 policy RLS sama sekali
-- (default-deny, hanya INSERT lewat endpoint server dgn service role), identitas via
-- auth_user_id ATAU anon_id (cookie eco_anon, sesi anonim tanpa login).
create table if not exists public.my20fit_menu_delivery_clicks (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('official','member')),
  menu_id text not null,
  provider text not null check (provider in ('grabfood','gofood')),
  auth_user_id uuid references auth.users(id) on delete set null,
  anon_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_menu_delivery_clicks_menu on public.my20fit_menu_delivery_clicks (source, menu_id, provider);
alter table public.my20fit_menu_delivery_clicks enable row level security;
-- SENGAJA 0 policy -- tak ada satu pun role client (anon/authenticated) yang boleh baca/tulis.

-- Kategori GrabFood siap-pakai utk CMS (Tahap 3) -- supaya admin tinggal pilih, bukan
-- salin-tempel URL manual tiap kali. Diseed dari daftar yang SUDAH ditelusuri user sendiri
-- (bukan data yang saya karang) -- lihat prompt. is_active supaya bisa dimatikan/tambah
-- tanpa hapus riwayat kalau Grab ubah struktur URL.
create table if not exists public.my20fit_grabfood_categories (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.my20fit_grabfood_categories enable row level security;
-- Tak perlu dibaca publik (cuma dipakai CMS admin) -- 0 policy, service role saja.

insert into public.my20fit_grabfood_categories (label, url, sort_order) values
('Nasi Goreng', 'https://food.grab.com/id/id/cuisines/nasi-goreng-delivery/71', 10),
('Ayam Goreng', 'https://food.grab.com/id/id/cuisines/ayam-goreng-delivery/69', 20),
('Ayam', 'https://food.grab.com/id/id/cuisines/ayam-delivery/43', 30),
('Sate', 'https://food.grab.com/id/id/cuisines/sate-delivery/150', 40),
('Bakso', 'https://food.grab.com/id/id/cuisines/bakso-delivery/8', 50),
('Mie', 'https://food.grab.com/id/id/cuisines/mie-delivery/126', 60),
('Aneka Nasi', 'https://food.grab.com/id/id/cuisines/aneka-nasi-delivery/144', 70),
('Hidangan Laut', 'https://food.grab.com/id/id/cuisines/hidangan-laut-delivery/151', 80),
('Martabak', 'https://food.grab.com/id/id/cuisines/martabak-delivery/107', 90),
('Camilan', 'https://food.grab.com/id/id/cuisines/camilan-delivery/157', 100),
('Kopi', 'https://food.grab.com/id/id/cuisines/kopi-delivery/47', 110),
('Minuman', 'https://food.grab.com/id/id/cuisines/minuman-delivery/24', 120),
('Roti & Kue', 'https://food.grab.com/id/id/cuisines/roti-kue-delivery/7', 130),
('Masakan Indonesia', 'https://food.grab.com/id/id/restaurants?category=indonesian-87', 140);
