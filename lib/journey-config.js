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
  // Informasi publik alat Visbody (halaman /activity/visbody untuk yang belum pernah scan).
  // SEMUA null = belum diberikan pemilik -> bagian itu DISEMBUNYIKAN di UI (tidak dikarang).
  visbody_info: {
    // Unit 20FIT yang punya alat. maps_url = link lokasi dari pemilik (2026-09-30); info_url = halaman
    // 20FIT Arena (arena.20fit.id — alamat yang sudah dipakai menu produk; koreksi kalau keliru).
    // Unit lain: tambahkan objek baru dengan bentuk yang sama.
    locations: [
      { name: "20FIT Arena", address: "Menteng Prada, Jakarta", maps_url: "https://share.google/zLVF85JginwO0RZUc", info_url: "https://arena.20fit.id" },
    ],
    // PERLU DIPUTUSKAN: teks biaya/promo, mis. { id: "Gratis untuk member", en: "Free for members" }
    price_note: null,
    // PERLU DIPUTUSKAN: cara menjadwalkan scan. booking_url (sistem booking) ATAU whatsapp
    // (nomor CS, format 62xxxx). Dua-duanya null -> tombol "Jadwalkan scan" tidak tampil.
    booking_url: null,
    whatsapp: null,
    // PERLU DIVALIDASI tim klinik: daftar persiapan sebelum scan, mis. [{ id: "...", en: "..." }]
    prep: null,
  },
  // Health Journey setelah claim Visbody.
  journey: {
    // Landing setelah login/buka my.20fit.id untuk user yang punya scan ter-claim:
    // "always" = selalu /activity · "new_scan" = hanya kalau ada hasil scan yang belum dilihat · "off"
    landing: "always",
    rescan_interval_days: 30,        // PERLU DIPUTUSKAN — default pengingat rescan
  },
  // Nudge kontekstual (Bagian A3). cap_days = jarak minimal antar tampil per user.
  nudges: {
    visbody_after_workouts: { enabled: true, min_workouts: 3, cap_days: 7 },   // belum pernah scan + >= N workout
    rescan_due: { enabled: true, cap_days: 7 },                                // scan terakhir > rescan_interval_days
    // Ajakan pilih olahraga (Activity multi-sport): "satu kali" — setelah ditutup / diklik tidak muncul
    // lagi (cap ±10 tahun); otomatis hilang begitu user punya profil olahraga.
    sport_pick: { enabled: true, cap_days: 3650 },
  },
  // Target kalori minimum saat user memakai BMR Visbody (sama dengan js/nutrition.js MIN_KCAL).
  calorie_min: 1200,
  // Corporate: agregat Visbody hanya ditampilkan kalau peserta >= angka ini (anonimitas).
  corporate_min_group: 5,
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
