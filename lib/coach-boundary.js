// Batas keahlian AI Coach (Activity multi-sport, Fase 4). Mendeteksi pertanyaan yang TERLALU TEKNIS untuk AI
// (topik teknis per olahraga di lib/sport-packs technical_topics) atau MEDIS/CEDERA, lalu memberi instruksi
// tambahan ke model (jawab singkat & umum, jujur butuh ahli yang melihat langsung) + CTA dari ctaResolver.
// Deteksi berbasis kata kunci (deterministik) — bisa meleset untuk kalimat yang tak lazim; daftar katanya
// DRAFT dan PERLU DIVALIDASI tim 20FIT.
const SP = require("./sport-packs");
const CTA = require("./cta-inventory");
const resolver = require("./cta-resolver");

// Keluhan fisik / cedera / medis (negasi "tidak sakit" dibuang dulu).
const MED_RE = /(nyeri|sakit|cedera|cidera|keseleo|terkilir|bengkak|memar|kram|patah|robek|ngilu|injur|pain|hurt|sprain|swollen|cramp|torn|tendinitis|obat|dosis|diagnos|medication)/i;
const NEG_RE = /\b(tidak|tak|gak|nggak|ngga|ga|enggak|tanpa|no|not|without)\s+(ada\s+|rasa\s+)?(nyeri|sakit|cedera|pain|hurt)/gi;

function has(text, kw) {
  const k = String(kw).toLowerCase();
  return new RegExp("(^|[^a-z0-9])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)", "i").test(text);
}

// -> null | {kind:"medical", injury_area, sport_key} | {kind:"technical", sport_key, topic, cta}
function classify(message, userSports) {
  const text = String(message || "").toLowerCase();
  const order = (userSports || []).map((s) => s.sport_key);
  const packs = SP.PACKS.slice().sort((a, b) => (order.indexOf(a.key) < 0 ? 9 : order.indexOf(a.key)) - (order.indexOf(b.key) < 0 ? 9 : order.indexOf(b.key)));
  const clean = text.replace(NEG_RE, " ");
  if (MED_RE.test(clean)) {
    const area = Object.keys(SP.BODY_AREAS).find((k) => SP.BODY_AREAS[k].keywords.some((kw) => has(clean, kw))) || null;
    // Area yang rawan di olahraga user (injury_watch) -> ditandai, ambang rujukan lebih rendah.
    const sp = packs.find((p) => area && order.indexOf(p.key) >= 0 && p.injury_watch.indexOf(area) >= 0);
    return { kind: "medical", injury_area: area, watched: !!sp, sport_key: sp ? sp.key : (order[0] || "general") };
  }
  for (const p of packs) {
    for (const t of p.technical_topics || []) {
      if (t.keywords.some((kw) => has(text, kw))) return { kind: "technical", sport_key: p.key, topic: t, cta: t.cta || null };
    }
  }
  return null;
}

// Instruksi sistem tambahan untuk SATU pesan. speciality = isian admin untuk coach persona (boleh kosong);
// shown = CTA utama yang BENAR-BENAR tampil (hasil cta()) supaya kalimat AI cocok dengan tombolnya.
function hint(c, lang, speciality, shown) {
  if (!c) return null;
  const en = lang === "en";
  const spec = speciality
    ? (en ? "Your coach's recorded specialty: " + speciality + ". " : "Spesialisasi coach-mu yang tercatat: " + speciality + ". ")
    : (en ? "Your coach's specialty is not recorded yet. " : "Spesialisasi coach-mu belum tercatat. ");
  if (c.kind === "medical") {
    const area = c.injury_area ? (en ? SP.BODY_AREAS[c.injury_area].en : SP.BODY_AREAS[c.injury_area].id) : null;
    return (en ? "INJURY/MEDICAL TOPIC" + (area ? " (" + area + ")" : "") + ": do not diagnose, do not give a training program for the painful area, no medication or doses. " +
      "Answer in at most 2 short, general and safe sentences, then honestly say this needs a doctor or physiotherapist to examine it in person. " +
      "The app shows a 20FIT Sports Clinic button under your reply — invite the user to it, do NOT write links or URLs."
      : "TOPIK CEDERA/MEDIS" + (area ? " (" + area + ")" : "") + ": jangan diagnosis, jangan beri program latihan untuk area yang nyeri, jangan sebut obat/dosis. " +
      "Jawab MAKS 2 kalimat singkat yang umum & aman, lalu katakan jujur bahwa ini perlu diperiksa langsung dokter atau fisioterapis. " +
      "Aplikasi menampilkan tombol 20FIT Sports Clinic di bawah jawabanmu — ajak user ke sana, JANGAN tulis link/URL.");
  }
  const sport = SP.get(c.sport_key), sportName = sport ? (en ? sport.label.en : sport.label.id) : c.sport_key;
  const topic = en ? c.topic.en : c.topic.id;
  const svc = shown && CTA[shown.key]
    ? (en ? "The app shows a button \"" + CTA[shown.key].label.en + "\" under your reply — invite the user to it, do NOT write links or URLs. "
      : "Aplikasi menampilkan tombol \"" + CTA[shown.key].label.id + "\" di bawah jawabanmu — ajak user ke sana, JANGAN tulis link/URL. ")
    : (en ? "20FIT does not have a coaching service for this topic yet — say so honestly; do NOT invent services, classes, coaches or schedules. "
      : "20FIT belum punya layanan pelatih untuk topik ini — katakan itu dengan jujur; JANGAN mengarang layanan, kelas, nama coach, atau jadwal. ");
  return (en ? "TECHNICAL QUESTION (" + sportName + " — " + topic + "): this is outside what Coach Intelligence can teach. " +
    "Answer in at most 2 general, safe sentences (no step-by-step tutorial), then honestly say this technique is best checked in person by a coach. " + svc +
    "Do not claim to be a " + sportName + " expert. " + spec
    : "PERTANYAAN TEKNIS (" + sportName + " — " + topic + "): ini di luar yang bisa diajarkan Coach Intelligence. " +
    "Jawab MAKS 2 kalimat umum & aman (tanpa tutorial langkah demi langkah), lalu katakan jujur bahwa teknik ini paling tepat dilihat langsung oleh pelatih. " + svc +
    "Jangan mengaku ahli " + sportName + ". " + spec);
}

// CTA untuk balasan chat (lewat ctaResolver -> hanya dari inventaris).
function cta(c, recent) {
  if (!c) return { primary: null, secondary: null };
  if (c.kind === "medical") return resolver.resolve({ sport_key: c.sport_key, risk: "doctor", injury_area: c.watched ? c.injury_area : null, recent: recent });
  return resolver.resolve({ sport_key: c.sport_key, technical_cta: c.cta, recent: recent });
}

module.exports = { classify, hint, cta };
