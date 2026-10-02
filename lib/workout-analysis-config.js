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
  // Langkah berikutnya yang konkret di setiap analisa (Activity multi-sport Fase 3). PERLU DIVALIDASI COACH/AHLI GIZI.
  next_steps: {
    bedtime: "23:00",            // "malam ini usahakan tidur sebelum jam ..."
    pre_meal_hours: "2–3",       // makan karbohidrat ... jam sebelum sesi berikutnya
    water_before_ml: 500,        // minum ... ml dalam 2 jam sebelum sesi
    max: 3,
  },

  // ---- Sinyal dari heart rate & pace (lib/workout-signals.js) ----
  // SEMUA = DEFAULT AGENT, PERLU DIVALIDASI COACH 20FIT. Bukan hasil studi tertentu; alasan tiap angka di komentar.
  // Sinyal hanya "tanda umum" — penyebabnya bisa kurang tidur, kurang makan/karbo, dehidrasi, panas & lembap,
  // sakit, stres, kafein, rute/tanjakan, atau akumulasi latihan. Dari satu workout TIDAK bisa dipastikan.
  signals: {
    // B1 efisiensi aerobik (Efficiency Factor = kecepatan m/menit ÷ HR rata-rata) vs workout sejenis.
    ef_drop_pct: 5,          // EF turun > 5% = jantung kerja lebih keras untuk kecepatan yang sama (ambang konservatif agent)
    ef_rise_pct: 5,          // EF naik > 5% = lebih efisien dari biasanya
    // B2 cardiac drift / decoupling: EF paruh pertama vs paruh kedua (butuh split ber-HR).
    decoupling_pct: 5,       // > 5% — angka yang setahu agent sering dipakai komunitas coaching (Pa:HR, TrainingPeaks); PERLU DICEK
    decoupling_min_minutes: 30, // sesi pendek/interval tidak dinilai drift-nya
    min_split_hr: 4,         // minimal split ber-HR untuk membandingkan dua paruh
    // B3 pace turun di akhir.
    fade_pct: 8,             // split terakhir > 8% lebih lambat dari median split sebelumnya
    fade_hr_tolerance_bpm: 3, // HR akhir tidak turun (>= HR awal - 3) -> bukan sekadar santai/cooldown
    fade_min_minutes: 45,    // >= 45 menit -> bahan bakar ikut dipertimbangkan; di bawahnya hanya pacing
    min_splits: 4,
    // HR sulit naik: HR maks jauh di bawah biasanya padahal pace tidak lebih santai.
    maxhr_drop_bpm: 8,
    // B4 zona: % waktu di Z4+Z5 vs rata-rata sesi sejenis.
    zone_high_pp: 15,        // > 15 poin persen lebih tinggi
    // B5 kesiapan (dari screenshot): vs riwayat user sendiri.
    rhr_up_bpm: 5, hrv_drop_pct: 10, sleep_score_drop: 10, readiness_min_samples: 3,
    strong_factor: 2,        // magnitudo >= 2x ambang = sinyal kuat
    // Olahraga TANPA pace (padel, tennis, gym, HIIT, dll. — Activity multi-sport Fase 3): dibanding sesi sejenis
    // yang durasinya mirip, memakai HR rata-rata & RPE (rasa berat 1–10 yang diisi user). PERLU DIVALIDASI COACH.
    effort_duration_tolerance: 0.3, // durasi ±30% dianggap sesi serupa
    effort_hr_up_bpm: 8,     // HR rata-rata > 8 bpm di atas biasanya untuk RPE serupa = jantung kerja lebih keras
    effort_hr_down_bpm: 8,   // HR rata-rata > 8 bpm di bawah biasanya padahal RPE lebih tinggi = HR sulit naik
    effort_rpe_same: 1,      // RPE dianggap "serupa" kalau selisih <= 1
    rpe_up: 2,               // RPE >= 2 poin di atas biasanya untuk sesi serupa = terasa jauh lebih berat
    rpe_hard: 7,             // tanpa riwayat RPE: RPE >= 7 dianggap "usaha berat"
  },
  // "Bacaan coach": pola sinyal HR & pace -> kandidat penyebab, TANPA wajib ada log. Skor kandidat = jumlah
  // bobot sinyal yang terdeteksi (+1 kalau ada sinyal kuat, +1 petunjuk lemah seperti jam siang/"capek").
  // Dari performa SAJA keyakinan maksimal "sedang" (skor >= perf_medium_score); log/check-in yang mendukung
  // menaikkan satu tingkat, yang membantah mengeluarkan kandidat. Bobot 2 = sinyal khas penyebab itu
  // (mis. HR lebih tinggi di pace yang sama -> paling sering kurang tidur/belum pulih; pace jatuh di akhir sesi
  // panjang -> bahan bakar/karbohidrat; HR naik terus di pace stabil -> cairan). Penyebab yang tak bisa dinilai
  // (stres, kafein, rute) hanya disebut di narasi. SEMUA bobot = DEFAULT AGENT, PERLU DIVALIDASI COACH 20FIT.
  causes: {
    signature: {
      short_sleep: { efficiency_drop: 2, readiness_low: 2, hr_suppressed: 1, zones_high: 1, hr_high_effort: 2, rpe_high: 1, hr_low_effort: 1 },
      high_load: { hr_suppressed: 2, readiness_low: 1, efficiency_drop: 1, zones_high: 1, hr_low_effort: 2, rpe_high: 1, hr_high_effort: 1 },
      low_fuel: { late_fade: 2, cardiac_drift: 1, hr_low_effort: 2, rpe_high: 1 },
      dehydration: { cardiac_drift: 2, efficiency_drop: 1, zones_high: 1, hr_high_effort: 1 },
      heat: { cardiac_drift: 1, efficiency_drop: 1, zones_high: 1, hr_high_effort: 1 },
      unwell: { efficiency_drop: 1, readiness_low: 1, hr_high_effort: 1 },
      pacing: { late_fade_short: 2, late_fade: 1 },
    },
    perf_medium_score: 2,
    heat_hours: [10, 16],    // jam mulai di luar ruangan yang dianggap rawan panas (Jakarta) — PERLU DIVALIDASI
    max_shown: 3,
  },
  // Bacaan dari SATU sesi (tanpa pembanding): intensitas dari HR rata-rata vs HR maks (yang tertinggi antara
  // perkiraan 220 − umur dan HR maks yang pernah tercatat), dan relevansi bahan bakar dari durasi.
  // PERLU DIVALIDASI COACH 20FIT.
  intensity: { easy_max_pct: 75, hard_min_pct: 85 },
  fuel: { relevant_min: 60 },   // di bawah ini cadangan karbohidrat jarang jadi pembatas (pedoman umum, PERLU DICEK)
  // Quick check-in setelah upload (opsional, maks 4 pertanyaan). Label jeda makan memakai pre_meal di atas.
  checkin: { sleep_max_hours: 16 },

  // Insight lintas workout (D3) — hanya tampil kalau datanya cukup.
  insights: { min_workouts: 8, min_paired: 5, slow_share_min: 0.6 },
};
