-- ============================================================
--  20fit — Migration 002: Fitco email verification status
--  Jalankan di Supabase > SQL Editor. Aman dijalankan berkali-kali (idempotent).
--
--  Latar belakang: registrasi lewat /api/v1/auth/register di 20FIT membuat akun
--  berstatus UNVERIFIED — 20FIT mengirim OTP verifikasi sendiri (terpisah dari
--  OTP Supabase kita) dan akun itu TIDAK BISA dipakai login ke app 20FIT sampai
--  di-verify. Kolom ini dipakai routeAfterAuth() (auth.js) untuk tahu kapan
--  harus mengarahkan user ke verify.html sebelum lanjut ke onboarding/dashboard.
--
--  Nullable, TANPA default value:
--    null  = tidak diketahui / tidak berlaku (akun lama sebelum fix ini ada,
--            atau akun yang tidak pernah lewat jalur 20FIT sama sekali)
--    false = baru saja register lewat 20FIT, wajib verifikasi OTP dulu
--    true  = sudah terverifikasi (login/token-login ke 20FIT berhasil, atau
--            verifikasi OTP eksplisit berhasil)
-- ============================================================

alter table public.my20fit_profile
  add column if not exists fitco_email_verified boolean;
