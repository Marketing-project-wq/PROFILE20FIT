-- ============================================================
-- 20260824050000_coach_photos_bucket_limits
-- Samakan bucket 'coach-photos' dengan 'event-covers': batas 5 MB + mime dibatasi
-- ke tiga tipe gambar. Batas di level bucket berlaku untuk SEMUA jalur unggah
-- (endpoint baru, skrip, alat bantu), tak bergantung validasi lapis aplikasi.
-- ============================================================
update storage.buckets
set file_size_limit = 5242880,  -- 5 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'coach-photos';
