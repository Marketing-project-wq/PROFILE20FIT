-- Artikel in-house (my20fit_recipe_article, ditambahkan Tahap 6 oleh sesi lain hari ini)
-- baru dibuat, 0 baris, dan satu-bahasa (title/excerpt/body_md/category tunggal). Situs ini
-- bilingual PENUH (toggle ID/EN di semua halaman lain -- resep, Eat Now, dst, lihat
-- OfficialRecipe.nm/ing/steps yg selalu {id,en}), jadi artikel harus ikut pola yang sama
-- SEBELUM ada konten nyata ditulis. Tabel masih kosong -> aman cutover langsung, tanpa
-- migrasi data (tapi tetap disalin dulu utk jaga-jaga kalau ternyata sudah ada baris).

alter table public.my20fit_recipe_article
  add column if not exists title_id text,
  add column if not exists title_en text,
  add column if not exists excerpt_id text,
  add column if not exists excerpt_en text,
  add column if not exists body_md_id text,
  add column if not exists body_md_en text,
  add column if not exists category_id text,
  add column if not exists category_en text;

update public.my20fit_recipe_article set
  title_id = coalesce(title_id, title),
  title_en = coalesce(title_en, title),
  excerpt_id = coalesce(excerpt_id, excerpt),
  excerpt_en = coalesce(excerpt_en, excerpt),
  body_md_id = coalesce(body_md_id, body_md),
  body_md_en = coalesce(body_md_en, body_md),
  category_id = coalesce(category_id, category),
  category_en = coalesce(category_en, category)
where title_id is null;

alter table public.my20fit_recipe_article
  alter column title_id set not null,
  alter column title_en set not null;

alter table public.my20fit_recipe_article
  drop column title,
  drop column excerpt,
  drop column body_md,
  drop column category;
