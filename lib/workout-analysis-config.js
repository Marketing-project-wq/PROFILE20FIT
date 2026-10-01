// lib/workout-analysis-config.js — SEMUA ambang analisa performa workout di satu tempat.
//
// Server-only (lib/ diblokir dari static-serve). SEMUA angka di bawah = DEFAULT AGENT,
// **PERLU DIVALIDASI COACH / AHLI GIZI** sebelum dianggap pedoman. Kode membaca dari objek ini,
// tidak ada angka kembar di tempat lain. Ubah di sini saja.

module.exports = {
  // Zona waktu tanggal/jam workout, log makan (cal_items.t "HH:MM") & hidrasi (logged_at).
  timezone: "Asia/Jakarta",

  // Tanggal hasil baca screenshot lebih tua dari N hari dari hari upload -> minta konfirmasi user.
  date_confirm_after_days: 3,

  // Baseline pribadi = workout sejenis milik user sendiri sebelum tanggal workout ini.
  baseline: {
    min_samples: 3,            // < 3 -> "baseline belum cukup", TIDAK ada klaim lebih lambat/cepat
    max_samples: 5,            // dirata-rata dari N workout sejenis terakhir
    lookback_days: 120,
    distance_tolerance: 0.30,  // jarak sejenis = ±30% (PERLU DIVALIDASI)
    pace_change_pct: 3,        // beda pace > 3% = lebih lambat/cepat (PERLU DIVALIDASI)
    hr_change_bpm: 5,          // HR rata-rata naik > 5 bpm di pace serupa = usaha lebih berat (PERLU DIVALIDASI)
    chart_points: 10,
  },

  sleep: {
    target_hours: 7.5,         // sama dengan Health Score (server.js HS_TARGET) — PERLU DIVALIDASI
    short_hours: 6,            // < 6 jam = kurang
    short_vs_avg_hours: 1,     // > 1 jam di bawah rata-rata 7 hari user = kurang
    long_hours: 10,            // > 10 jam = berlebih
    avg_days: 7,
  },

  // Nutrisi HARI SEBELUMNYA vs target dari js/nutrition.js (rumus yang sama dgn Calorie Tracker).
  nutrition: {
    kcal_low_pct: 75,          // < 75% target kalori = kurang
    kcal_high_pct: 130,        // > 130% target = berlebih
    carb_low_pct: 60,          // < 60% target karbo = kurang
    protein_low_pct: 60,
  },

  // Jarak makan terakhir (log Calorie Tracker hari H) ke jam mulai workout.
  pre_meal: {
    too_close_min: 45,         // < 45 menit = terlalu dekat (status "berlebih")
    ideal_max_min: 240,        // 45–240 menit = baik
    long_gap_min: 360,         // > 6 jam tanpa makan = kurang
  },

  hydration: {
    target_ml: 2000,           // sama dengan target 8 gelas di /activity — PERLU DIVALIDASI
    low_pct: 60,               // hari sebelumnya < 60% target = kurang
    pre_low_pct: 20,           // hari H sampai jam mulai < 20% target (kalau ada log hari H) = kurang
  },

  // Beban latihan 7 hari sebelum workout vs pola 4 minggu sebelumnya.
  load: {
    window_days: 7,
    typical_weeks: 4,
    high_vs_typical: 1.5,      // menit 7 hari > 1.5× rata-rata mingguan biasa = berlebih
    high_minutes_abs: 480,     // atau > 8 jam / 7 hari
    hard_hr_pct_of_max: 0.85,  // sesi "berat": HR rata-rata >= 85% HR maks perkiraan (220 - umur)
    hard_duration_min: 90,     // atau durasi >= 90 menit
    recent_hard_days: 1,       // sesi berat <= 1 hari sebelumnya = berlebih
  },

  body: {
    fresh_days: 60,            // scan Visbody lebih tua dari ini -> hanya informasi
    muscle_drop_kg: 1,         // massa otot turun >= 1 kg antar scan = perlu diperhatikan
    weight_change_pct: 3,
  },

  // Kemungkinan pengaruh = seberapa jauh faktor menyimpang dari normal user (0..1).
  influence: { high_dev: 0.30, mid_dev: 0.15 },

  // Keamanan: tidak ada analisa performa biasa kalau salah satu terpenuhi.
  safety: {
    max_hr_abs: 220,                 // HR maks terbaca > 220 bpm = tidak wajar (PERLU DIVALIDASI dokter)
    max_hr_over_predicted: 15,       // atau > (220 - umur) + 15
    emergency_words: ["nyeri dada", "sakit dada", "dada sakit", "dada nyeri", "chest pain", "pingsan", "hampir pingsan",
      "faint", "fainted", "passed out", "sesak napas berat", "sesak nafas berat", "can't breathe", "cannot breathe"],
    doctor_words: ["nyeri", "sakit", "pusing", "sesak", "cedera", "kram", "mual", "berdebar", "keseleo",
      "pain", "hurt", "dizzy", "injury", "injured", "cramp", "nausea", "palpitation", "short of breath"],
    // Nomor/teks darurat — TANYA PEMILIK. null = tidak ditampilkan (tidak dikarang).
    emergency_number: null,
  },

  // "Plan Hari Ini" (lib/today-brief.js): workout terakhir yang dianalisa maks N hari lalu;
  // komponen Health Score dengan skor >= ok_score tidak dimasukkan ke saran "naikkan skor"; durasi saran
  // workout plan TEMPLATE (dipakai hanya kalau AI gagal). PERLU DIPUTUSKAN / DIVALIDASI COACH.
  today: { last_workout_days: 14, ok_score: 90, template_minutes: { recovery: 30, moderate: 45 } },

  // Rekomendasi sesi berikutnya per workout (lib/workout-narrative.js nextSession): performa lebih baik
  // dari biasanya + tak ada faktor bermasalah -> durasi dinaikkan progress_pct %. PERLU DIVALIDASI COACH.
  next: { progress_pct: 10 },

  // Insight lintas workout (D3) — hanya tampil kalau datanya cukup.
  insights: { min_workouts: 8, min_paired: 5, slow_share_min: 0.6 },
};
