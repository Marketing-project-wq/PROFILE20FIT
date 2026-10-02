// Paket olahraga (Activity multi-sport). Satu file per olahraga di folder ini; file ini memuat,
// memvalidasi, dan menyediakan kamus bersama (level, area tubuh, kategori latihan pendukung).
//
// SEMUA isi paket = DRAFT buatan agent — PERLU DIVALIDASI COACH & FISIOTERAPIS 20FIT.
// Bukan standar ilmiah; jangan ditampilkan ke user sebagai fakta medis.
const CTA = require("../cta-inventory");

// Maksimal olahraga per user (ditegakkan juga di DB: rank 1|2, migration 031).
const MAX_SPORTS = 2;

const LEVELS = {
  beginner: { en: "Beginner", id: "Pemula" },
  regular: { en: "Regular", id: "Rutin" },
  competitive: { en: "Competitive", id: "Kompetitif" },
};

// Area tubuh untuk injury_watch. keywords = kata yang nanti dipakai mendeteksi keluhan nyeri
// di catatan/chat (Fase 3–4) -> ambang rujukan ke Sports Clinic diturunkan. TANPA diagnosis.
const BODY_AREAS = {
  elbow: { en: "Elbow", id: "Siku", keywords: ["siku", "elbow"] },
  shoulder: { en: "Shoulder", id: "Bahu", keywords: ["bahu", "pundak", "shoulder"] },
  wrist: { en: "Wrist", id: "Pergelangan tangan", keywords: ["pergelangan tangan", "wrist"] },
  lower_back: { en: "Lower back", id: "Punggung bawah", keywords: ["punggung bawah", "pinggang", "lower back", "low back"] },
  hip: { en: "Hip", id: "Pinggul", keywords: ["pinggul", "hip"] },
  knee: { en: "Knee", id: "Lutut", keywords: ["lutut", "knee"] },
  shin: { en: "Shin", id: "Tulang kering", keywords: ["tulang kering", "shin"] },
  calf_achilles: { en: "Calf / Achilles", id: "Betis / Achilles", keywords: ["betis", "achilles", "calf"] },
  ankle: { en: "Ankle", id: "Pergelangan kaki", keywords: ["pergelangan kaki", "ankle", "keseleo"] },
  foot: { en: "Foot / heel", id: "Telapak kaki / tumit", keywords: ["telapak kaki", "tumit", "heel", "plantar"] },
};

// Kategori latihan pendukung. Nanti dipetakan ke exercise library (Fase 2).
const TRAINING = {
  agility: { en: "Agility & footwork", id: "Kelincahan & gerak kaki" },
  core_rotation: { en: "Rotational core", id: "Core rotasi" },
  core_stability: { en: "Core stability", id: "Stabilitas core" },
  leg_strength: { en: "Leg strength", id: "Kekuatan kaki" },
  hip_strength: { en: "Hip & glute strength", id: "Kekuatan pinggul & bokong" },
  posterior_chain: { en: "Posterior chain", id: "Otot rantai belakang" },
  upper_push_pull: { en: "Upper-body push & pull", id: "Dorong & tarik tubuh atas" },
  grip_carry: { en: "Grip & carries", id: "Genggaman & angkut beban" },
  aerobic_engine: { en: "Aerobic engine", id: "Daya tahan aerobik" },
  shoulder_mobility: { en: "Shoulder mobility", id: "Mobilitas bahu" },
  hip_mobility: { en: "Hip mobility", id: "Mobilitas pinggul" },
  ankle_mobility: { en: "Ankle mobility", id: "Mobilitas pergelangan kaki" },
  forearm_wrist: { en: "Forearm & wrist conditioning", id: "Kondisi lengan bawah & pergelangan" },
};

// Metrik analisa yang dikenal (Fase 3 memilih metrik sesuai paket).
const METRICS = ["duration", "distance", "pace", "splits", "cardiac_drift", "avg_hr", "max_hr", "hr_zones",
  "rpe", "total_time", "station_times", "run_splits", "volume"];

const ORDER = ["hyrox", "running", "gym", "padel", "general"];
const PACKS = ORDER.map(function (k) { return require("./" + k); });

// Validasi isi paket saat dimuat. Kesalahan konfigurasi TIDAK menjatuhkan server: entri yang
// salah dibuang + dicatat ke log supaya ketahuan saat review.
function checkPack(p) {
  const bad = function (msg) { console.error("[sport-packs] " + p.key + ": " + msg); };
  if (!/^[a-z_]{2,30}$/.test(p.key)) bad("key tidak valid");
  p.metrics = (p.metrics || []).filter(function (m) { return METRICS.indexOf(m) >= 0 || (bad("metrik tak dikenal " + m), false); });
  p.injury_watch = (p.injury_watch || []).filter(function (a) { return BODY_AREAS[a] || (bad("area tak dikenal " + a), false); });
  p.supporting_training = (p.supporting_training || []).filter(function (t) { return TRAINING[t] || (bad("latihan tak dikenal " + t), false); });
  p.cta_map = (p.cta_map || []).filter(function (c) { return CTA[c] || (bad("CTA bukan dari inventaris: " + c), false); });
  if (p.metrics.indexOf("pace") >= 0 && !p.pace_relevant) bad("pace dipakai tapi pace_relevant=false");
}
PACKS.forEach(checkPack);
const BY_KEY = {};
PACKS.forEach(function (p) { BY_KEY[p.key] = p; });

function get(key) { return Object.prototype.hasOwnProperty.call(BY_KEY, key) ? BY_KEY[key] : null; }

// Bagian yang aman dikirim ke browser untuk pemilih olahraga (onboarding / profil).
function publicList() {
  return {
    max: MAX_SPORTS,
    levels: Object.keys(LEVELS).map(function (k) { return { key: k, en: LEVELS[k].en, id: LEVELS[k].id }; }),
    sports: PACKS.map(function (p) {
      return { key: p.key, label: p.label, icon: p.icon, other: !!p.other, goals: p.goals, content_status: p.content_status };
    }),
  };
}

// Validasi pilihan user (dipakai PUT /api/me/sports). Input: [{sport_key, other_label, play_days,
// level, goal}] urut prioritas. Output: { rows } siap simpan, atau { error }.
function validateSelection(list) {
  if (!Array.isArray(list) || !list.length) return { error: { en: "Choose your main sport.", id: "Pilih olahraga utamamu." } };
  if (list.length > MAX_SPORTS) return { error: { en: "Pick at most " + MAX_SPORTS + " sports.", id: "Maksimal " + MAX_SPORTS + " olahraga." } };
  const rows = [], seen = {};
  for (let i = 0; i < list.length; i++) {
    const s = list[i] || {}, p = get(String(s.sport_key || ""));
    if (!p) return { error: { en: "Unknown sport.", id: "Olahraga tidak dikenal." } };
    const other = p.other ? String(s.other_label || "").trim().replace(/\s+/g, " ").slice(0, 40) : "";
    if (p.other && other.length < 2) return { error: { en: "Type the name of your sport.", id: "Tulis nama olahragamu." } };
    const dupKey = p.key + "|" + other.toLowerCase();
    if (seen[dupKey]) return { error: { en: "Both sports are the same.", id: "Dua olahraga yang dipilih sama." } };
    seen[dupKey] = 1;
    const days = Array.isArray(s.play_days) ? s.play_days.map(Number) : [];
    if (days.some(function (d) { return !(d >= 1 && d <= 7 && Math.floor(d) === d); })) return { error: { en: "Invalid day.", id: "Hari tidak valid." } };
    const level = s.level == null || s.level === "" ? null : String(s.level);
    if (level && !LEVELS[level]) return { error: { en: "Invalid level.", id: "Level tidak valid." } };
    const goal = s.goal == null || s.goal === "" ? null : String(s.goal);
    if (goal && !p.goals.some(function (g) { return g.key === goal; })) return { error: { en: "Invalid goal.", id: "Tujuan tidak valid." } };
    rows.push({ rank: i + 1, sport_key: p.key, other_label: other || null,
      play_days: Array.from(new Set(days)).sort(), level: level, goal: goal });
  }
  return { rows: rows };
}

module.exports = { publicList, validateSelection };
