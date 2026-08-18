-- ============================================================
-- 20260818095735_my20fit_catalog_items_lockdown
-- Keamanan view katalog (temuan 1.3): sebelumnya anon/authenticated punya
-- DELETE/INSERT/UPDATE/TRUNCATE di my20fit_catalog_items — terlalu longgar untuk
-- katalog harga. Cabut jadi SELECT saja. Set security_invoker=true supaya view
-- berjalan dengan hak pemanggil (hormati RLS tabel sumber), bukan hak pemilik.
--
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt (version 20260818095735).
-- ============================================================

revoke all on public.my20fit_catalog_items from anon, authenticated;
grant select on public.my20fit_catalog_items to anon, authenticated;
alter view public.my20fit_catalog_items set (security_invoker = true);
