// Paket olahraga Padel. DRAFT — PERLU DIVALIDASI COACH & FISIOTERAPIS 20FIT.
// Belum ada data member padel & belum ada layanan/coach padel 20FIT yang terverifikasi.
module.exports = {
  key: "padel",
  content_status: "DRAFT — perlu validasi coach & fisioterapis 20FIT",
  label: { en: "Padel", id: "Padel" },
  icon: "racket",
  workout_types: ["padel"],
  pace_relevant: false,
  metrics: ["duration", "avg_hr", "max_hr", "hr_zones", "rpe"],
  goals: [
    { key: "play_longer", en: "Play longer without getting tired", id: "Main lebih lama tanpa capek" },
    { key: "faster_footwork", en: "Faster footwork", id: "Gerak kaki lebih cepat" },
    { key: "injury_free", en: "Fewer injuries", id: "Jarang cedera" },
    { key: "tournament_prep", en: "Prepare for a tournament", id: "Persiapan turnamen" },
  ],
  supporting_training: ["agility", "core_rotation", "leg_strength", "shoulder_mobility", "hip_mobility", "forearm_wrist"],
  injury_watch: ["elbow", "shoulder", "knee", "ankle", "calf_achilles", "lower_back"],
  technical_topics: [
    { key: "stroke_technique", en: "Stroke technique", id: "Teknik pukulan",
      keywords: ["bandeja", "vibora", "víbora", "smash", "volley", "voli", "lob", "chiquita", "servis", "serve", "teknik pukulan"], cta: null },
    { key: "tactics", en: "Tactics & positioning", id: "Taktik & posisi", keywords: ["taktik", "posisi di lapangan", "strategi main", "tactic"], cta: null },
    { key: "equipment", en: "Racket & gear choice", id: "Pilih raket & perlengkapan", keywords: ["raket", "racket", "sepatu padel", "bola padel"], cta: null },
  ],
  events: { kinds: ["tournament"], keywords: ["padel"] },
  cta_map: ["book_doctor", "recovery_clinic", "calorie_tracker", "visbody_info"],
  // TANYA PEMILIK: URL & hubungan Padel Rebel dengan 20FIT. url null = belum boleh ditampilkan.
  community: [{ key: "padel_rebel", label: { en: "Padel Rebel", id: "Padel Rebel" }, url: null },
    { key: "directory_20fit", label: { en: "20FIT sports directory", id: "Direktori olahraga 20FIT" }, url: "https://20fit.id" }],
};
