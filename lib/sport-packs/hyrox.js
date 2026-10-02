// Paket olahraga HYROX / hybrid race. DRAFT — PERLU DIVALIDASI COACH & FISIOTERAPIS 20FIT.
module.exports = {
  key: "hyrox",
  content_status: "DRAFT — perlu validasi coach & fisioterapis 20FIT",
  label: { en: "HYROX / Hybrid", id: "HYROX / Hybrid" },
  icon: "fire",
  // Tipe my20fit_workout yang dihitung sebagai sesi olahraga ini (baseline per olahraga, Fase 3).
  workout_types: ["hyrox"],
  pace_relevant: true,   // hanya untuk segmen lari
  metrics: ["duration", "total_time", "run_splits", "station_times", "pace", "avg_hr", "max_hr", "hr_zones", "rpe"],
  goals: [
    { key: "first_finish", en: "Finish my first race", id: "Finish race pertama" },
    { key: "target_time", en: "Hit a target time", id: "Tembus target waktu" },
    { key: "stronger_stations", en: "Stronger at the stations", id: "Lebih kuat di station" },
    { key: "race_prep", en: "Prepare for a race", id: "Persiapan race" },
  ],
  supporting_training: ["aerobic_engine", "leg_strength", "posterior_chain", "grip_carry", "core_stability", "hip_mobility"],
  injury_watch: ["lower_back", "knee", "shoulder", "wrist", "calf_achilles"],
  technical_topics: [
    { key: "station_technique", en: "Station technique", id: "Teknik station",
      keywords: ["wall ball", "sled push", "sled pull", "burpee broad jump", "sandbag lunge", "farmers carry", "ski erg", "skierg", "rowing", "teknik station"], cta: "classes_arena" },
    { key: "race_rules", en: "Race rules & divisions", id: "Aturan race & divisi", keywords: ["aturan hyrox", "divisi", "penalti", "penalty", "division"], cta: null },
    { key: "race_pacing", en: "Race pacing strategy", id: "Strategi pacing race", keywords: ["strategi race", "pacing race", "roxzone"], cta: "classes_arena" },
  ],
  // Event terkait (mode hitung mundur, Fase 2). keywords dicocokkan ke nama event di my20fit_ticket_events.
  events: { kinds: ["hyrox", "hybrid_race"], keywords: ["hyrox", "hybrid race"] },
  cta_map: ["classes_arena", "events", "book_doctor", "recovery_clinic", "calorie_tracker", "visbody_info"],
  community: [{ key: "directory_20fit", label: { en: "20FIT sports directory", id: "Direktori olahraga 20FIT" }, url: "https://20fit.id" }],
};
