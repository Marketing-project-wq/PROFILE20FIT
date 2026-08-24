-- ============================================================
-- 20260820060200_doctors_public_view (TAHAP 1, tabel 3/3)
-- my20fit_doctors memuat admin_user_id (penghubung akun internal) yang TIDAK boleh terlihat
-- client. Maka base table TETAP tertutup untuk anon (tanpa policy anon), dan identitas publik
-- diekspos HANYA lewat view kolom-aman + is_active. View owner-privileged (bukan
-- security_invoker) sehingga anon bisa membacanya tanpa akses ke base table.
-- ============================================================
create or replace view my20fit_doctors_public as
  select id, display_name, speciality, bio, photo_url, sort_order
  from my20fit_doctors
  where is_active = true;

grant select on my20fit_doctors_public to anon, authenticated;
