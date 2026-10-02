// Paket olahraga Lari. DRAFT — PERLU DIVALIDASI COACH & FISIOTERAPIS 20FIT.
module.exports = {
  key: "running",
  content_status: "DRAFT — perlu validasi coach & fisioterapis 20FIT",
  label: { en: "Running", id: "Lari" },
  icon: "run",
  workout_types: ["run"],
  pace_relevant: true,
  metrics: ["duration", "distance", "pace", "splits", "cardiac_drift", "avg_hr", "max_hr", "hr_zones", "rpe"],
  goals: [
    { key: "first_5k", en: "Run my first 5K", id: "Lari 5K pertama" },
    { key: "distance_up", en: "Go longer (10K / half marathon)", id: "Naik jarak (10K / half marathon)" },
    { key: "faster", en: "Run faster", id: "Pace lebih cepat" },
    { key: "injury_free", en: "Fewer injuries", id: "Jarang cedera" },
    { key: "race_prep", en: "Prepare for a race", id: "Persiapan race" },
  ],
  supporting_training: ["leg_strength", "hip_strength", "core_stability", "ankle_mobility", "hip_mobility"],
  injury_watch: ["knee", "shin", "calf_achilles", "foot", "hip"],
  technical_topics: [
    { key: "running_form", en: "Advanced running form", id: "Form lari lanjutan", keywords: ["form lari", "running form", "cadence", "kadens", "foot strike", "pendaratan kaki"] },
    { key: "shoe_choice", en: "Choosing specific running shoes", id: "Memilih sepatu lari spesifik", keywords: ["sepatu lari", "running shoe", "carbon plate"] },
  ],
  events: { kinds: ["fun_run", "5k", "10k", "half_marathon", "marathon"], keywords: ["run", "lari", "pelari", "5k", "10k", "marathon"] },
  cta_map: ["events", "book_doctor", "recovery_clinic", "calorie_tracker", "visbody_info"],
  community: [],
};
