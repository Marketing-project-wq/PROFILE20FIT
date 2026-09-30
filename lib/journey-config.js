// lib/journey-config.js — angka & kebijakan alur Visbody + Health Score (satu tempat).
//
// Server-only (lib/ diblokir dari static-serve). Nilai bertanda PERLU DIPUTUSKAN / PERLU
// DIVALIDASI adalah DEFAULT sementara dari agent — belum keputusan pemilik / tim klinik.
// Ganti di sini saja; kode membaca dari objek ini, tidak ada angka kembar di tempat lain.

module.exports = {
  visbody: {
    // Masa berlaku link claim (QR timbangan / link dari staf). PERLU DIPUTUSKAN — usul 7 hari
    // supaya member yang belum punya akun sempat daftar dulu.
    claim_token_ttl_hours: 168,
    // Retensi scan yang tak pernah di-claim. PERLU DIPUTUSKAN. null = tidak dihapus otomatis
    // (admin tetap melihat umur scan di daftar unclaimed).
    unclaimed_retention_days: null,
    // Versi teks persetujuan pemrosesan data komposisi tubuh (UU PDP 27/2022). Naikkan versi
    // kalau teksnya diubah -> member diminta setuju lagi saat claim berikutnya.
    // Teks v1 = draf agent, PERLU DITINJAU tim legal.
    consent_purpose: "visbody_body_composition",
    consent_version: "v1",
  },
  health_score: {
    // Workout dihitung dari N hari terakhir (bergulir), target hari latihan dalam jendela itu.
    // PERLU DIVALIDASI.
    workout_window_days: 7,
    workout_target_days: 4,
    // Scan Visbody lebih tua dari ini -> komponen Body ditandai "perlu diperbarui" dan bobotnya
    // dikali faktor di bawah. PERLU DIVALIDASI.
    body_fresh_days: 60,
    body_stale_weight_factor: 0.5,
  },
};
