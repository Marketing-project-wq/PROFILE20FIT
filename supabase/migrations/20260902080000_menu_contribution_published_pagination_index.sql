-- Tahap 6 (Load more server-side): index utk kolom yg dipakai sort/filter pagination
-- halaman Jelajah (published+approved, urut reviewed_at desc).
create index if not exists idx_menu_contribution_published_reviewed
  on public.my20fit_menu_contribution (reviewed_at desc)
  where status = 'approved' and published = true;
