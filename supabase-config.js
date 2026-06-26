// =============================================================
//  KONFIGURASI SUPABASE — 20fit Health Profile
// =============================================================
//  Cara isi ANON KEY:
//  1. Buka Supabase  ->  Project "20FIT ALL DATA"
//  2. Settings  ->  API
//  3. Copy "anon / public" key (yang panjang, diawali "eyJ...")
//  4. Tempel di SUPABASE_ANON_KEY di bawah ini.
//  (Anon key AMAN ditaruh di frontend — memang dirancang publik.)
// =============================================================

window.SUPABASE_CONFIG = {
  // URL project kamu (sudah benar, jangan diubah)
  SUPABASE_URL: "https://cpvzwqptzcxnwzfzgrmt.supabase.co",

  // >>> TEMPEL ANON KEY DI SINI <<<
  SUPABASE_ANON_KEY: "PASTE_ANON_KEY_DISINI",

  // -----------------------------------------------------------
  //  VERIFIKASI EMAIL — OTP "hardcode" (TANPA Supabase Auth email)
  // -----------------------------------------------------------
  //  - Tiap user dapat OTP acak 6 digit (di-generate sendiri).
  //  - Karena layanan email belum disambung, OTP-nya untuk
  //    SEMENTARA ditampilkan di layar (lihat halaman verifikasi).
  //  - MASTER_OTP di bawah = kode "sakti" yang SELALU diterima
  //    (berguna buat testing / admin). Ganti sesuai selera,
  //    atau set null kalau mau dimatikan.
  MASTER_OTP: "112233",

  // Berapa menit OTP berlaku
  OTP_TTL_MINUTES: 10,
};
