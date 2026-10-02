// ctaResolver — SATU tempat memilih CTA ke produk my.20fit.id (Activity multi-sport, Fase 3).
// Dipakai analisa aktivitas (GET /api/activity/workouts/:id) dan AI Coach (Fase 4). Tujuan HANYA dari
// lib/cta-inventory.js; untuk saran non-keamanan juga harus ada di cta_map paket olahraga user.
// Output: maks 1 CTA utama + maks 1 sekunder, masing-masing {key, route, label, reason}.
//
// Aturan & angka = DEFAULT AGENT, PERLU DIVALIDASI tim 20FIT (lihat juga RULES.md "Tombol aksi").
// Lokasi user (Jakarta / luar) BELUM dipakai: profil belum punya data kota — TANYA PEMILIK kalau mau
// CTA datang-ke-lokasi (in_person di inventaris) diturunkan prioritasnya untuk user luar Jakarta.
const CTA = require("./cta-inventory");
const SP = require("./sport-packs");

const RULES = {
  // CTA yang sudah tampil >= max_shown kali dalam window_days tanpa pernah diklik -> ditahan dulu
  // (kecuali CTA keamanan). PERLU DIVALIDASI.
  repeat: { max_shown: 3, window_days: 14 },
};

// Kandidat berurutan prioritas -> {key, reason, safety?}
function candidates(ctx) {
  const out = [], add = (key, reason, safety) => out.push({ key: key, reason: reason, safety: !!safety });
  const causes = ctx.causes || [], has = (k) => causes.indexOf(k) >= 0;
  if (ctx.risk === "emergency") return out;   // kartu darurat punya tombolnya sendiri
  if (ctx.risk === "doctor" || ctx.injury_area) {
    add("book_doctor", ctx.injury_area
      ? { en: "Pain in an area your sport often strains — let a doctor check it.", id: "Nyeri di area yang sering terbebani olahragamu — biar dokter yang memeriksa." }
      : { en: "A doctor should check this first.", id: "Sebaiknya diperiksa dokter dulu." }, true);
    add("recovery_clinic", { en: "Physio & recovery at 20FIT Sports Clinic.", id: "Fisioterapi & recovery di 20FIT Sports Clinic." });
    return out;
  }
  if (has("unwell")) add("book_doctor", { en: "If you still don't feel well, talk to a doctor.", id: "Kalau badan masih kurang fit, konsultasi ke dokter." });
  if (has("low_fuel") || ctx.low_food) add("calorie_tracker", { en: "See what you eat before sessions.", id: "Lihat asupanmu sebelum sesi." });
  if (ctx.goal_event && !ctx.has_event) add("events", { en: "Pick an event to train towards.", id: "Pilih event sebagai target latihan." });
  if (ctx.no_body_scan) add("visbody_info", { en: "Add body composition so your plan fits better.", id: "Tambah data komposisi tubuh supaya plan lebih tepat." });
  if (ctx.stagnant) {
    add("classes_arena", { en: "Train with a 20FIT coach to level up.", id: "Latihan bareng coach 20FIT untuk naik level." });
    add("classes_gym", { en: "Train with a 20FIT coach to level up.", id: "Latihan bareng coach 20FIT untuk naik level." });
    add("book_coach", { en: "Find a 20FIT coach.", id: "Cari coach 20FIT." });
  }
  return out;
}

// ctx: {sport_key, risk ("emergency"|"doctor"|null), injury_area, causes[], low_food, goal_event, has_event,
//       no_body_scan, stagnant, recent: {key: {shown, clicked}}}
function resolve(ctx) {
  ctx = ctx || {};
  const pack = SP.get(ctx.sport_key || "general") || SP.get("general");
  const allowed = (pack && pack.cta_map) || [];
  const recent = ctx.recent || {};
  const picked = [];
  candidates(ctx).forEach((c) => {
    if (picked.length >= 2 || !CTA[c.key] || picked.some((p) => p.key === c.key)) return;
    if (!c.safety && allowed.indexOf(c.key) < 0) return;
    const r = recent[c.key];
    if (!c.safety && r && !r.clicked && r.shown >= RULES.repeat.max_shown) return;
    picked.push({ key: c.key, route: CTA[c.key].route, label: CTA[c.key].label, reason: c.reason });
  });
  return { primary: picked[0] || null, secondary: picked[1] || null };
}

// Ringkas riwayat event cta_shown / cta_clicked (my20fit_event_log) -> {key: {shown, clicked}}.
function summarizeRecent(rows) {
  const out = {};
  (rows || []).forEach((r) => {
    const k = r.props && r.props.cta; if (!k) return;
    out[k] = out[k] || { shown: 0, clicked: false };
    if (r.event === "cta_shown") out[k].shown++;
    if (r.event === "cta_clicked") out[k].clicked = true;
  });
  return out;
}

module.exports = { resolve, summarizeRecent, RULES };
