-- ============================================================
-- 20260820060000_coaches_read_policy (TAHAP 1, tabel 1/3)
-- my20fit_coaches: SELECT untuk anon + authenticated, HANYA baris is_active = true.
-- Penulisan tetap lewat service role (service role tidak tunduk RLS -> tak perlu policy tulis).
-- ============================================================
create policy coaches_public_read_active on my20fit_coaches
  for select to anon, authenticated using (is_active = true);
