-- ============================================================
-- 20260819071500_promo_banners_rls_policies
-- Banner promo (Masalah 1): RLS aktif tapi 0 policy → banner tak terbaca oleh anon
-- (mis. halaman login) & pencatatan klik gagal diam-diam.
--   my20fit_promo_banners      → publik (anon+authenticated) boleh SELECT HANYA baris active=true.
--   my20fit_promo_banner_clicks → client hanya boleh INSERT (tak boleh SELECT). Server tetap service key.
-- Dibuktikan sebagai role anon: baca banner aktif = 1 (physio-10off), baca clicks = 0 (ditolak).
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

grant select on my20fit_promo_banners to anon, authenticated;
create policy "promo_banners_public_read_active" on my20fit_promo_banners
  for select to anon, authenticated using (active = true);

grant insert on my20fit_promo_banner_clicks to anon, authenticated;
create policy "promo_banner_clicks_insert_only" on my20fit_promo_banner_clicks
  for insert to anon, authenticated with check (true);
