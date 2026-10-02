// Aturan plan mingguan di sekitar jadwal olahraga (Activity multi-sport, Fase 2). Mesinnya
// lib/sport-week.js (deterministik, tanpa AI).
//
// SEMUA ANGKA DI SINI = DEFAULT AGENT, PERLU DIVALIDASI COACH 20FIT. Bukan standar ilmiah.
module.exports = {
  // Seberapa berat SATU sesi main/latihan olahraga itu (dipakai aturan "jangan dua sesi berat berturut-turut").
  // hard = berat, moderate = sedang. PERLU DIVALIDASI.
  sport_intensity: { hyrox: "hard", running: "moderate", gym: "hard", padel: "hard", general: "moderate" },

  // Batas per level (level dari profil olahraga utama). PERLU DIVALIDASI.
  //   max_hard      : sesi berat per minggu (main olahraga berat + latihan berat). Lewat batas -> latihan
  //                   pendukung diturunkan jadi ringan & user diberi catatan.
  //   max_sessions  : total hari aktif (main + latihan pendukung + olahraga kedua santai), pemulihan tidak dihitung.
  //   max_support   : latihan pendukung per minggu.
  levels: {
    beginner: { max_hard: 2, max_sessions: 4, max_support: 2, vol: "beginner" },
    regular: { max_hard: 3, max_sessions: 5, max_support: 3, vol: "intermediate" },
    competitive: { max_hard: 4, max_sessions: 6, max_support: 3, vol: "advanced" },
  },
  min_rest_days: 1,              // minimal hari istirahat penuh per minggu
  recovery_minutes: 15,          // sesi pemulihan (mobilitas) sehari setelah sesi berat
  easy_before_hard: true,        // latihan pendukung sehari SEBELUM sesi berat dibuat ringan

  // Olahraga kedua TANPA hari tetap -> boleh diberi 1 sesi santai di hari kosong (kalau masuk akal).
  // null = tidak (mis. padel butuh lapangan & partner). PERLU DIVALIDASI.
  second_easy_session: {
    running: { minutes: 25, title: { en: "Easy run", id: "Lari santai" } },
    hyrox: { minutes: 30, title: { en: "Easy engine (run + row)", id: "Engine santai (lari + row)" } },
    gym: { minutes: 30, title: { en: "Light strength", id: "Latihan beban ringan" } },
    padel: null,
    general: null,
  },

  // Kategori latihan pendukung -> kategori di exercise library coach (COACH_EXLIB di server.js:
  // push|pull|legs|core|cardio|mobility). Library masih 16 latihan umum — drill spesifik (tangga
  // kelincahan, med-ball rotasi, dll.) BELUM ADA; perlu ditambah & divalidasi coach.
  training_to_exlib: {
    agility: ["cardio", "legs"], core_rotation: ["core"], core_stability: ["core"], leg_strength: ["legs"],
    hip_strength: ["legs", "mobility"], posterior_chain: ["legs", "mobility"], upper_push_pull: ["push", "pull"],
    grip_carry: ["pull"], aerobic_engine: ["cardio"], shoulder_mobility: ["mobility"], hip_mobility: ["mobility"],
    ankle_mobility: ["mobility"], forearm_wrist: ["pull"],
  },

  // Mode hitung mundur ke event. Fase: dasar -> meningkat -> menjelang event (tapering). PERLU DIVALIDASI.
  event: {
    build_weeks: 6,                                                       // fase "meningkat" = N minggu sebelum taper
    taper_days: { hyrox: 7, running: 10, gym: 3, padel: 3, general: 5 },  // fase "menjelang event"
    build_minutes_factor: 1.15,                                           // latihan pendukung sedikit lebih panjang
    taper_minutes_factor: 0.6,                                            // menjelang event: lebih pendek & ringan
    max_days_ahead: 365,                                                  // event lebih jauh dari ini ditolak
  },
};
