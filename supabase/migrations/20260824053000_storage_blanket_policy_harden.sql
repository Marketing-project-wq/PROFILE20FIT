-- ============================================================
-- 20260824053000_storage_blanket_policy_harden
-- Perbaikan keamanan reversible. Sebelumnya ada policy blanket 'Allow All w1pnpy_0..3'
-- di storage.objects untuk anon+authenticated (qual=true, TANPA batas bucket) -> anon bisa
-- SELECT/INSERT/UPDATE/DELETE objek di SEMUA bucket, termasuk bucket privat (mcu-documents
-- medis, transfer-photos, dll).
--
-- Yang dilakukan (aman, tidak memutus alur sah, mudah di-rollback):
--  - Cabut UPDATE & DELETE blanket: tak ada alur sah yang butuh anon menimpa/menghapus objek
--    sembarang lintas-bucket. Menutup vektor perusakan (hapus dokumen medis / bukti bayar).
--  - Ganti SELECT blanket (true) -> hanya bucket public=true. Menutup baca-anon objek bucket
--    PRIVAT (mcu-documents, transfer-photos, item-photos, rb-*). Bucket publik tetap terbaca
--    (unduhan publik pakai URL publik, tak lewat RLS). Authenticated tetap baca objek sendiri
--    lewat policy per-bucket masing-masing (mcu_docs_select_own, dll). clinic-posture (privat,
--    butuh anon) tetap jalan lewat policy khususnya (clinic_posture_read).
--
-- TIDAK diubah di sini (butuh koordinasi dgn booking.20fit.id / persetujuan):
--  - INSERT blanket (w1pnpy_1) — bisa dipakai alur unggah anon app lain.
--  - payment-proofs jadi privat & policy publik arena_bookings/arena_class_bookings.
-- ============================================================
drop policy if exists "Allow All w1pnpy_2" on storage.objects;  -- UPDATE
drop policy if exists "Allow All w1pnpy_3" on storage.objects;  -- DELETE
drop policy if exists "Allow All w1pnpy_0" on storage.objects;  -- SELECT (blanket true)

create policy "anon_read_public_buckets_only" on storage.objects
  for select to anon, authenticated
  using (exists (select 1 from storage.buckets b where b.id = storage.objects.bucket_id and b.public = true));
