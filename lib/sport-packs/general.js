// Paket "Lainnya" — olahraga yang belum punya paket sendiri (mis. tennis, badminton, sepeda).
// Nama olahraganya disimpan apa adanya (other_label) supaya kelihatan olahraga apa yang perlu
// dibuatkan paket berikutnya. DRAFT — PERLU DIVALIDASI COACH 20FIT.
module.exports = {
  key: "general",
  other: true,
  content_status: "DRAFT — perlu validasi coach 20FIT",
  label: { en: "Other", id: "Lainnya" },
  icon: "spark",
  workout_types: [],
  pace_relevant: false,
  metrics: ["duration", "avg_hr", "max_hr", "hr_zones", "rpe"],
  goals: [
    { key: "fitter", en: "Get fitter for my sport", id: "Lebih fit untuk olahragaku" },
    { key: "consistency", en: "Stay consistent", id: "Tetap rutin" },
    { key: "injury_free", en: "Fewer injuries", id: "Jarang cedera" },
    { key: "event_prep", en: "Prepare for an event", id: "Persiapan event" },
  ],
  supporting_training: ["core_stability", "leg_strength", "hip_mobility", "shoulder_mobility", "aerobic_engine"],
  injury_watch: [],
  // Tanpa daftar topik: semua pertanyaan teknik olahraga spesifik dianggap di luar keahlian coach AI.
  technical_topics: [],
  events: { kinds: [], keywords: [] },
  cta_map: ["book_doctor", "calorie_tracker", "visbody_info", "classes_arena"],
  community: [{ key: "directory_20fit", label: { en: "20FIT sports directory", id: "Direktori olahraga 20FIT" }, url: "https://20fit.id" }],
};
