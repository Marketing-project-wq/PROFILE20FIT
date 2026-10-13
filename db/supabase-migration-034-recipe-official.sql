-- Migration 034 — Katalog resep OFFICIAL pindah dari file statik js/recipes.js ke DB,
-- supaya admin bisa CRUD (tambah/edit/hapus) + upload foto lewat admin-v2.
--
-- SUMBER KEBENARAN: my.20fit.id. Konsumen (recipe.20fit.id, calorietracker.20fit.id)
-- membaca read-only lewat Content API v1 (/api/content/v1/recipes) — tak ada DB kedua,
-- tak ada konflik sync.
--
-- id = slug lama (mis. "rice-chicken") DIPERTAHANKAN supaya kompatibel dengan
--   - key Content API "official:<id>", dan
--   - my20fit_menu_delivery_links.menu_id (source='official').
--
-- Server membaca DB dulu (getOfficialCatalog), fallback ke js/recipes.js saat tabel
-- kosong / DB tak tersedia. Setelah seed di bawah dijalankan & diverifikasi, DB jadi
-- sumber aktif; file statik tetap sebagai fallback + helper gambar klien (belum dihapus).
--
-- Jalankan MANUAL di Supabase SQL Editor (project cpvzwqptzcxnwzfzgrmt). Hanya tabel
-- berawalan my20fit_* (aman, milik app ini).

create table if not exists public.my20fit_recipe_official (
  id             text primary key,
  name_en        text not null,
  name_id        text not null,
  kcal           integer,
  p              integer,
  c              integer,
  f              integer,
  diet_types     text[]  not null default '{}',
  category       text,
  q              text,              -- query gambar TheMealDB (fallback foto), opsional
  emoji          text,
  tint           text,
  ingredients_en text,
  ingredients_id text,
  steps_en       text,
  steps_id       text,
  servings       integer,
  cook_minutes   integer,
  prep_minutes   integer,
  equipment      text,
  prep_note      text,
  common_mistake text,
  photo_url      text,              -- foto asli (bucket menu-photos). null -> fallback TheMealDB via q/emoji
  is_published   boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     text
);

create index if not exists my20fit_recipe_official_pub_idx
  on public.my20fit_recipe_official (is_published, sort_order);

-- RLS deny-public (konsisten dgn tabel my20fit_* lain): akses hanya lewat server
-- (service key bypass RLS). Tidak ada policy publik yang dibuat.
alter table public.my20fit_recipe_official enable row level security;
