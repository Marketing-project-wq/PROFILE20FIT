-- ============================================================
-- 20260819110500_doctors_drop_stray_public_read
-- Korektif. Setelah membuat my20fit_doctors (deny-public, tanpa policy), muncul policy
-- `doctors_public_read_active` (SELECT utk anon+authenticated where is_active) yang BUKAN
-- dibuat migration ini — kemungkinan dari aktor lain di DB shared. my20fit_doctors harus
-- deny-public: data dokter (nama/foto) tidak boleh terbaca anon, dibaca hanya lewat server
-- (service key). Tabel masih kosong; drop ini mencegah kebocoran saat nanti diisi lewat CMS.
-- ============================================================
drop policy if exists doctors_public_read_active on my20fit_doctors;
