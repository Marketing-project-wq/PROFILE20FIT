-- ============================================================
-- 20260819100000_reward_tables_rls_policies
-- TAHAP 1 (wajib sebelum deploy): my20fit_reward_offers & my20fit_reward_claims RLS aktif
-- tapi 0 policy → halaman Reward kosong tanpa pesan error (RLS memblok diam-diam).
--   reward_offers : publik (anon+authenticated) baca HANYA baris active=true.
--   reward_claims : user hanya baris miliknya (baca + tulis), auth.uid()=auth_user_id.
-- Dibuktikan sbg role anon: query offers sukses (0 = belum ada offer aktif, bukan blok RLS).
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

grant select on my20fit_reward_offers to anon, authenticated;
create policy "reward_offers_public_read_active" on my20fit_reward_offers
  for select to anon, authenticated using (active = true);

grant select, insert on my20fit_reward_claims to authenticated;
create policy "reward_claims_owner_select" on my20fit_reward_claims
  for select to authenticated using (auth_user_id = auth.uid());
create policy "reward_claims_owner_insert" on my20fit_reward_claims
  for insert to authenticated with check (auth_user_id = auth.uid());
