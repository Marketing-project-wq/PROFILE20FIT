-- ============================================================
--  20fit — Migration 001: Fitco account binding
--  Jalankan di Supabase > SQL Editor. Aman dijalankan berkali-kali (idempotent).
--
--  Latar belakang: fitco_user_id (ID akun 20FIT/FITCO) sejauh ini hanya
--  disimpan di localStorage browser (auth.js: fitco_uid), jadi hilang kalau
--  user ganti device/browser atau clear storage. Migration ini menambahkan
--  kolom pengikat akun 20FIT <-> my20fit_profile di database supaya ikatan
--  ini permanen dan bisa dibaca ulang dari server kapan saja.
--
--  Tipe data fitco_user_id: TEXT (bukan bigint) — cek server.js/auth.js,
--  nilai ini selalu diperlakukan sebagai string opaque (auth.js selalu
--  membungkusnya dengan String(...) sebelum dipakai), bukan angka yang
--  dioperasikan aritmatika. TEXT juga lebih aman kalau format ID dari API
--  20FIT berubah/bukan murni numerik.
-- ============================================================

alter table public.my20fit_profile
  add column if not exists fitco_user_id text,
  add column if not exists fitco_linked_at timestamptz;
