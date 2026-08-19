-- ============================================================
-- 20260819080000_gym_coaches_fields_and_home_tiles
-- Tahap 1 & 2:
--   gym_coaches: tambah speciality + bio (additif) supaya seragam dgn arena_coaches.
--   my20fit_home_tiles: kontrol visibilitas & urutan tile grid home dari CMS ("jangan hardcode").
--     Dashboard punya definisi tile (ikon/label/href); tabel ini hanya tampil/urut per key.
--     RLS: baca publik (config non-sensitif). Seed 8 tile.
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

alter table gym_coaches
  add column if not exists speciality text,
  add column if not exists bio text;

create table if not exists my20fit_home_tiles (
  key text primary key,
  hidden boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table my20fit_home_tiles enable row level security;
grant select on my20fit_home_tiles to anon, authenticated;
create policy "home_tiles_public_read" on my20fit_home_tiles
  for select to anon, authenticated using (true);

insert into my20fit_home_tiles (key, hidden, sort_order) values
  ('medical', false, 0), ('membership', false, 1), ('diet', false, 2),
  ('book-class', false, 3), ('book-doctor', false, 4), ('book-coach', false, 5),
  ('book-recovery', false, 6), ('news', false, 7)
on conflict (key) do nothing;
