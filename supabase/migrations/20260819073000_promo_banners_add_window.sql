-- ============================================================
-- 20260819073000_promo_banners_add_window
-- Masalah 3: my20fit_promo_banners tak punya tanggal → promo tak bisa berhenti sendiri.
-- Tambah starts_at/ends_at + perketat policy baca publik ke jendela aktif. Set physio-10off
-- berakhir 31 Agustus 2026 (WIB) → banner dashboard & tombol login hilang sendiri setelahnya.
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt (dibuktikan sbg anon: baris terbaca selama dalam jendela).
-- ============================================================

alter table my20fit_promo_banners
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at   timestamptz;

drop policy if exists "promo_banners_public_read_active" on my20fit_promo_banners;
create policy "promo_banners_public_read_active" on my20fit_promo_banners
  for select to anon, authenticated
  using (active = true
         and (starts_at is null or starts_at <= now())
         and (ends_at   is null or ends_at   > now()));

update my20fit_promo_banners set ends_at = '2026-08-31 23:59:59+07', updated_at = now()
where key = 'physio-10off';
