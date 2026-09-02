-- Kolom nama tampilan publik untuk kontributor resep komunitas -- diisi kontributor sendiri
-- saat submit (RecipeForm), TIDAK ditarik dari auth.users/my20fit_profile (privasi: keduanya
-- punya email/nama asli). Nullable -- fallback generik dipakai di server/frontend kalau kosong.
alter table public.my20fit_menu_contribution
  add column display_name text;

alter table public.my20fit_menu_contribution
  add constraint my20fit_menu_contribution_display_name_len
  check (display_name is null or char_length(display_name) <= 60);
