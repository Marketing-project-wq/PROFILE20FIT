// Paket olahraga Gym / latihan beban. DRAFT — PERLU DIVALIDASI COACH & FISIOTERAPIS 20FIT.
module.exports = {
  key: "gym",
  content_status: "DRAFT — perlu validasi coach & fisioterapis 20FIT",
  label: { en: "Gym", id: "Gym" },
  icon: "dumbbell",
  workout_types: ["gym", "hiit"],
  pace_relevant: false,
  metrics: ["duration", "volume", "rpe", "avg_hr", "max_hr"],
  goals: [
    { key: "build_muscle", en: "Build muscle", id: "Bentuk otot" },
    { key: "stronger", en: "Get stronger", id: "Lebih kuat" },
    { key: "fat_loss", en: "Lose fat", id: "Turunkan lemak" },
    { key: "consistency", en: "Train consistently", id: "Latihan rutin" },
  ],
  supporting_training: ["shoulder_mobility", "hip_mobility", "core_stability", "aerobic_engine"],
  injury_watch: ["shoulder", "lower_back", "knee", "elbow", "wrist"],
  technical_topics: [
    { key: "heavy_lift_technique", en: "Heavy lift technique", id: "Teknik angkatan berat",
      keywords: ["squat", "deadlift", "bench press", "clean and jerk", "snatch", "teknik angkat", "form angkat"] },
    { key: "strength_programming", en: "Powerlifting / weightlifting programming", id: "Program powerlifting / angkat besi",
      keywords: ["powerlifting", "angkat besi", "weightlifting", "1rm", "periodisasi"] },
  ],
  events: { kinds: [], keywords: [] },
  cta_map: ["classes_gym", "book_coach", "visbody_info", "calorie_tracker", "book_doctor"],
  community: [],
};
