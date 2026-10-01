// lib/workout-narrative.js — teks analisa workout dari hasil lib/workout-analysis.js.
//
// 1) templateNarrative(): narasi DETERMINISTIK (tanpa AI) — dipakai sebagai fallback & kalimat
//    penjelasan per faktor. Semua angka langsung dari hasil analisa.
// 2) aiMessages() + checkNarrative(): narasi coach via AI. AI hanya menerima angka yang sudah
//    dihitung + daftar angka yang BOLEH ditulis; server menolak narasi yang memuat angka lain.
// Bahasa sebab-akibat selalu "kemungkinan ikut memengaruhi", tidak pernah "menyebabkan".
"use strict";
const WM = require("../js/workout-metrics.js");

function T(lang, o) { return lang === "en" ? o.en : o.id; }
function d1(n, lang) { return n == null ? null : WM.dec(n, 1, lang); }
function liters(ml, lang) { return ml == null ? null : WM.dec(ml / 1000, 1, lang) + " L"; }
function secTxt(s, lang) { s = Math.abs(Math.round(s)); return s >= 60 ? WM.fmtDuration(s / 60) + (lang === "en" ? " min" : " mnt") : s + (lang === "en" ? " sec" : " dtk"); }
const FNAME = {
  sleep: { en: "sleep", id: "tidur" }, nutrition: { en: "yesterday's nutrition", id: "nutrisi kemarin" },
  pre_meal: { en: "pre-workout meal", id: "makan sebelum latihan" }, hydration: { en: "hydration", id: "hidrasi" },
  load: { en: "training load", id: "beban latihan" }, body: { en: "body composition", id: "kondisi tubuh" },
};

// Satu kalimat penjelasan per faktor (kartu faktor di halaman detail).
function factorSentence(f, lang) {
  const v = f.value || {}, c = f.compare || {};
  if (f.status === "tidak_ada_data") {
    return T(lang, {
      sleep: { en: "No sleep logged for the night before — log it to include sleep in the analysis.", id: "Belum ada catatan tidur malam sebelumnya — catat supaya tidur ikut dianalisa." },
      nutrition: { en: "No meals logged the day before.", id: "Belum ada catatan makan hari sebelumnya." },
      pre_meal: f.reason === "no_start_time" ? { en: "Workout start time unknown — add it to see your pre-workout meal timing.", id: "Jam mulai latihan belum diisi — isi supaya jarak makan sebelum latihan bisa dihitung." }
        : { en: "No meals logged on the workout day.", id: "Belum ada catatan makan di hari latihan." },
      hydration: { en: "No water logged for the day before or before the workout.", id: "Belum ada catatan minum hari sebelumnya atau sebelum latihan." },
      load: { en: "No other workouts logged in the past weeks to compare your load.", id: "Belum ada workout lain tercatat beberapa minggu terakhir untuk menilai beban latihan." },
      body: { en: "No Visbody scan yet.", id: "Belum ada scan Visbody." },
    }[f.key] || { en: "No data.", id: "Belum ada data." });
  }
  if (f.key === "sleep") {
    const s = T(lang, { en: "You slept " + d1(v.hours, lang) + " h", id: "Kamu tidur " + d1(v.hours, lang) + " jam" });
    const cmp = c.avg_hours != null ? T(lang, { en: " (your 7-day average is " + d1(c.avg_hours, lang) + " h).", id: " (rata-rata 7 harimu " + d1(c.avg_hours, lang) + " jam)." })
      : T(lang, { en: " (target " + d1(c.target_hours, lang) + " h).", id: " (target " + d1(c.target_hours, lang) + " jam)." });
    return s + cmp;
  }
  if (f.key === "nutrition") {
    let s = T(lang, { en: "The day before you ate " + v.kcal + " kcal of your " + c.kcal_target + " kcal target", id: "Kemarin asupanmu " + v.kcal + " kkal dari target " + c.kcal_target + " kkal" });
    if ((f.flags || []).indexOf("low_carb") >= 0) s += T(lang, { en: ", with " + v.carbs_g + " g carbs (target " + c.carbs_target_g + " g)", id: ", karbohidrat " + v.carbs_g + " g (target " + c.carbs_target_g + " g)" });
    return s + ".";
  }
  if (f.key === "pre_meal") {
    if (v.gap_min == null) return T(lang, { en: "No meal logged before the " + v.started_at + " start.", id: "Tidak ada makan tercatat sebelum mulai jam " + v.started_at + "." });
    return T(lang, { en: "Last meal at " + v.last_meal_time + ", " + v.gap_min + " min before the workout.", id: "Makan terakhir jam " + v.last_meal_time + ", " + v.gap_min + " menit sebelum latihan." });
  }
  if (f.key === "hydration") {
    const p = [];
    if (v.day_before_ml != null) p.push(T(lang, { en: liters(v.day_before_ml, lang) + " the day before", id: liters(v.day_before_ml, lang) + " sehari sebelumnya" }));
    if (v.before_start_ml != null) p.push(T(lang, { en: liters(v.before_start_ml, lang) + " before the workout", id: liters(v.before_start_ml, lang) + " sebelum latihan" }));
    return T(lang, { en: "Water: ", id: "Minum: " }) + p.join(", ") + T(lang, { en: " (daily target " + liters(c.target_ml, lang) + ").", id: " (target harian " + liters(c.target_ml, lang) + ")." });
  }
  if (f.key === "load") {
    let s = T(lang, { en: v.sessions_7d + " sessions, " + v.minutes_7d + " min in the 7 days before", id: v.sessions_7d + " sesi, " + v.minutes_7d + " menit dalam 7 hari sebelumnya" });
    if (c && c.typical_weekly_minutes != null) s += T(lang, { en: " (usually " + c.typical_weekly_minutes + " min/week)", id: " (biasanya " + c.typical_weekly_minutes + " menit/minggu)" });
    if (v.days_since_hard != null && v.days_since_hard <= 1) s += T(lang, { en: "; a hard session the day before", id: "; ada sesi berat sehari sebelumnya" });
    return s + ".";
  }
  if (f.key === "body") {
    let s = T(lang, { en: "Last Visbody scan " + v.scanned_on, id: "Scan Visbody terakhir " + v.scanned_on });
    if (v.muscle_kg != null) s += T(lang, { en: ": muscle " + d1(v.muscle_kg, lang) + " kg", id: ": massa otot " + d1(v.muscle_kg, lang) + " kg" });
    if (c && c.muscle_kg != null) s += T(lang, { en: " (previous " + d1(c.muscle_kg, lang) + " kg)", id: " (sebelumnya " + d1(c.muscle_kg, lang) + " kg)" });
    return s + ".";
  }
  return "";
}

function perfSentence(a, w, lang) {
  const b = a.baseline, typ = WM.typeLabel(w.type, lang).toLowerCase();
  if (b.status === "insufficient") return T(lang, { en: "You have " + b.n + " similar " + typ + " sessions logged — at least " + b.needed + " are needed to compare with your usual performance.", id: "Baru ada " + b.n + " sesi " + typ + " sejenis tercatat — butuh minimal " + b.needed + " untuk dibandingkan dengan performa biasanya." });
  if (b.status !== "ok") return T(lang, { en: "This workout type has no pace or speed to compare yet.", id: "Jenis workout ini belum punya pace/kecepatan untuk dibandingkan." });
  const parts = [];
  if (b.kind === "pace") {
    const cur = WM.fmtPace(b.current), dir = b.delta > 0;
    parts.push(T(lang, { en: "Your pace was " + cur, id: "Pace kamu " + cur }) +
      (b.similar ? T(lang, { en: ", about the same as your last " + b.n + " similar sessions (" + WM.fmtPace(b.base) + ")", id: ", mirip rata-rata " + b.n + " sesi sejenis terakhir (" + WM.fmtPace(b.base) + ")" })
        : T(lang, { en: ", " + secTxt(b.delta, lang) + (dir ? " slower" : " faster") + " than your last " + b.n + " similar sessions (" + WM.fmtPace(b.base) + ")", id: ", " + secTxt(b.delta, lang) + (dir ? " lebih lambat" : " lebih cepat") + " dari rata-rata " + b.n + " sesi sejenis terakhir (" + WM.fmtPace(b.base) + ")" })));
  } else {
    parts.push(T(lang, { en: "Your average speed was " + d1(b.current, lang) + " km/h vs " + d1(b.base, lang) + " km/h usually", id: "Kecepatan rata-ratamu " + d1(b.current, lang) + " km/jam, biasanya " + d1(b.base, lang) + " km/jam" }));
  }
  if (b.hr_delta != null && Math.abs(b.hr_delta) >= 3) parts.push(T(lang, { en: "average heart rate " + b.hr + " bpm (" + (b.hr_delta > 0 ? "+" : "") + b.hr_delta + " vs usual)", id: "detak jantung rata-rata " + b.hr + " bpm (" + (b.hr_delta > 0 ? "+" : "") + b.hr_delta + " dari biasanya)" }));
  return parts.join(T(lang, { en: ", with ", id: ", dengan " })) + ".";
}

const TIPS = {
  sleep: (f, lang) => T(lang, { en: "Aim for about " + d1(f.compare.target_hours, lang) + " h of sleep the night before your next session.", id: "Usahakan tidur sekitar " + d1(f.compare.target_hours, lang) + " jam malam sebelum sesi berikutnya." }),
  nutrition: (f, lang) => T(lang, { en: "Eat enough the day before a hard session — your target is around " + f.compare.kcal_target + " kcal, with enough carbs.", id: "Makan cukup sehari sebelum sesi berat — targetmu sekitar " + f.compare.kcal_target + " kkal, dengan karbohidrat yang cukup." }),
  pre_meal: (f, lang) => f.status === "berlebih"
    ? T(lang, { en: "Leave at least " + f.compare.too_close_min + " min between a meal and your workout.", id: "Beri jeda minimal " + f.compare.too_close_min + " menit antara makan dan mulai latihan." })
    : T(lang, { en: "Have a light carb-based meal a few hours before training.", id: "Makan ringan berkarbohidrat beberapa jam sebelum latihan." }),
  hydration: (f, lang) => T(lang, { en: "Drink steadily the day before — your target is " + liters(f.compare.target_ml, lang) + " a day.", id: "Minum cukup sehari sebelumnya — targetmu " + liters(f.compare.target_ml, lang) + " per hari." }),
  load: (f, lang) => T(lang, { en: "Put an easy or rest day between hard sessions.", id: "Selingi sesi berat dengan hari ringan atau istirahat." }),
  body: (f, lang) => T(lang, { en: "Keep strength training and enough protein to protect your muscle mass.", id: "Tetap latihan kekuatan dan cukupi protein untuk menjaga massa otot." }),
};

function templateNarrative(a, w, lang) {
  if (a.safety) return safetyNarrative(a, lang);
  const bad = a.factors.filter((f) => f.role), missing = a.factors.filter((f) => f.status === "tidak_ada_data" && ["sleep", "nutrition", "hydration"].indexOf(f.key) >= 0);
  const names = (arr) => {
    const l = arr.map((f) => T(lang, FNAME[f.key])), and = T(lang, { en: " and ", id: " dan " });
    return l.length <= 2 ? l.join(and) : l.slice(0, -1).join(", ") + "," + and + l[l.length - 1];
  };
  const paras = [perfSentence(a, w, lang)];
  let headline;
  const title = WM.title(w, lang);
  if (a.verdict === "factors") {
    const causes = bad.filter((f) => f.role === "possible_cause").sort((x, y) => y.deviation - x.deviation);
    paras.push(causes.map((f) => factorSentence(f, lang)).join(" ") + " " + T(lang, { en: "These may have played a part in today's performance.", id: "Hal ini kemungkinan ikut memengaruhi performamu hari ini." }));
    headline = T(lang, { en: "Below your usual — " + names(causes.slice(0, 2)) + " may have played a part.", id: "Di bawah biasanya — " + names(causes.slice(0, 2)) + " kemungkinan ikut berpengaruh." });
  } else if (a.verdict === "no_clear_factor") {
    paras.push(T(lang, { en: "From the data available there is no clear factor. Things outside the data — weather, route, stress — can also play a part.", id: "Dari data yang tersedia tidak ada faktor yang jelas. Hal di luar data seperti cuaca, rute, atau stres juga bisa berpengaruh." }));
    headline = T(lang, { en: "Below your usual, with no clear factor in your data.", id: "Di bawah biasanya, tanpa faktor yang jelas dari datamu." });
  } else {
    if (bad.length) paras.push(bad.map((f) => factorSentence(f, lang)).join(" ") + " " + T(lang, { en: "Worth keeping an eye on.", id: "Ini perlu diperhatikan." }));
    headline = a.verdict === "better" ? T(lang, { en: "Better than your usual — " + title + ".", id: "Lebih baik dari biasanya — " + title + "." })
      : a.verdict === "normal" ? T(lang, { en: "On par with your usual" + (bad.length ? "; watch your " + names(bad.slice(0, 2)) + "." : "."), id: "Sesuai performa biasanya" + (bad.length ? "; perhatikan " + names(bad.slice(0, 2)) + "." : ".") })
      : T(lang, { en: title + " logged — more similar sessions are needed to compare.", id: title + " tercatat — butuh lebih banyak sesi sejenis untuk dibandingkan." });
  }
  if (missing.length) paras.push(T(lang, { en: "Not logged yet: " + names(missing) + " — add them so the analysis is more complete.", id: "Belum dicatat: " + names(missing) + " — isi supaya analisanya lebih lengkap." }));
  const tips = bad.sort((x, y) => y.deviation - x.deviation).map((f) => TIPS[f.key](f, lang)).slice(0, 3);
  if (missing.length && tips.length < 3) tips.push(T(lang, { en: "Log your sleep, meals and water so the next analysis is more precise.", id: "Catat tidur, makan, dan minummu supaya analisa berikutnya lebih tepat." }));
  if (!tips.length) tips.push(T(lang, { en: "Keep your current sleep and eating routine.", id: "Pertahankan pola tidur dan makanmu." }));
  return { headline: headline, analysis: paras, next_session_tips: tips, cta: "BOOK_CLASS", source: "template" };
}

function safetyNarrative(a, lang) {
  const em = a.safety.level === "emergency", hr = a.safety.reasons.indexOf("hr_abnormal") >= 0;
  const paras = [];
  if (em) paras.push(T(lang, { en: "Your note mentions a symptom that needs urgent attention. Stop training and seek medical help right away.", id: "Catatanmu menyebut gejala yang perlu ditangani segera. Hentikan latihan dan segera cari pertolongan medis." }));
  else if (a.safety.reasons.indexOf("note_symptom") >= 0) paras.push(T(lang, { en: "Your note mentions pain or discomfort. Stop training until it has been checked by a doctor.", id: "Catatanmu menyebut nyeri atau keluhan. Hentikan latihan dulu sampai diperiksa dokter." }));
  if (hr) paras.push(T(lang, { en: "Your max heart rate reading (" + a.safety.max_hr + " bpm) is unusually high. It may be a sensor error, but if you felt chest pain, dizziness or shortness of breath, consult a doctor before training again.", id: "Detak jantung maksimal yang terbaca (" + a.safety.max_hr + " bpm) tidak wajar. Bisa karena sensor, tapi kalau kamu merasa nyeri dada, pusing, atau sesak, konsultasikan ke dokter sebelum latihan lagi." }));
  paras.push(T(lang, { en: "Performance analysis is paused for this workout. This is not a medical assessment.", id: "Analisa performa untuk workout ini dihentikan dulu. Ini bukan penilaian medis." }));
  return { headline: em ? T(lang, { en: "Stop training and seek medical help.", id: "Hentikan latihan dan cari pertolongan medis." }) : T(lang, { en: "Get this checked by a doctor before your next session.", id: "Periksakan ke dokter sebelum sesi berikutnya." }),
    analysis: paras, next_session_tips: [], cta: em ? "EMERGENCY" : "BOOK_DOCTOR", source: "template" };
}

// ---------- AI ----------
// Semua angka yang boleh muncul di narasi = semua angka di hasil analisa + versi terformatnya.
function allowedNumbers(a, w, lang) {
  const nums = new Set(), strs = new Set();
  // Varian penulisan yang wajar SAJA: 2 & 1 desimal, dan bulat hanya kalau nilainya memang ~bulat
  // (mis. 7,1 jam TIDAK membuka angka "7").
  const addN = (n) => {
    if (n == null || !isFinite(n)) return;
    nums.add(Math.round(n * 100) / 100); nums.add(Math.round(n * 10) / 10);
    if (Math.abs(n - Math.round(n)) <= 0.05) nums.add(Math.round(n));
  };
  const walk = (o, key) => {
    if (o == null) return;
    if (typeof o === "number") { addN(o); addN(Math.abs(o)); if (/_ml$/.test(key || "")) addN(o / 1000); return; }
    if (typeof o === "string") { (o.match(NUM_RE) || []).forEach((t) => { strs.add(t); addN(+t.replace(",", ".")); }); return; }
    if (Array.isArray(o)) { o.forEach((x) => walk(x, key)); return; }
    if (typeof o === "object") Object.keys(o).forEach((k) => walk(o[k], k));
  };
  walk({ b: a.baseline, f: a.factors, s: a.safety, w: [w.workout_date, w.distance_km, w.avg_heart_rate, w.max_heart_rate, w.calories_burned] });
  const b = a.baseline;
  [WM.fmtPace(b.current), WM.fmtPace(b.base), WM.fmtPace(WM.paceSec(w)), WM.fmtDuration(w.duration_min), b.delta != null ? WM.fmtDuration(Math.abs(b.delta) / 60) : null]
    .forEach((s) => { if (s) strs.add(String(s).replace("/km", "")); });
  return { nums: nums, strs: strs };
}
// Angka yang berdiri sendiri (angka yang menempel huruf seperti "20FIT" atau "Z2" bukan data).
const NUM_RE = /(?<![A-Za-z\d])\d+(?:[.,:]\d+)*(?![A-Za-z\d])/g;
function checkNarrative(n, allowed) {
  const txt = [n.headline].concat(n.analysis || [], n.next_session_tips || []).join(" ");
  const bad = [];
  (txt.match(NUM_RE) || []).forEach((t) => {
    if (allowed.strs.has(t)) return;
    if (t.indexOf(":") >= 0) { bad.push(t); return; }
    const v = +t.replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
    const ok = [...allowed.nums].some((x) => Math.abs(x - v) <= 0.051);
    if (!ok) bad.push(t);
  });
  return bad;
}
function validShape(n) {
  return n && typeof n.headline === "string" && n.headline.trim() && Array.isArray(n.analysis) && n.analysis.length >= 1 && n.analysis.length <= 4 &&
    n.analysis.every((p) => typeof p === "string" && p.trim()) && Array.isArray(n.next_session_tips) && n.next_session_tips.length <= 3 &&
    n.next_session_tips.every((p) => typeof p === "string") && ["BOOK_CLASS", "BOOK_DOCTOR", "NONE"].indexOf(n.cta) >= 0;
}
function aiMessages(a, w, lang, persona, template) {
  const allowed = allowedNumbers(a, w, lang);
  const data = { workout: { type: w.type, date: w.workout_date, title: WM.title(w, lang), started_at: a.started_at },
    verdict: a.verdict, baseline: a.baseline, factors: a.factors.map((f) => ({ key: f.key, status: f.status, role: f.role, influence: f.influence, value: f.value, compare: f.compare, flags: f.flags || [], sentence: factorSentence(f, lang) })),
    reference_text: template };
  const sys = persona + "\n\n" +
    "TUGAS: tulis analisa performa SATU workout untuk member, dari DATA (sudah dihitung server). " +
    "ATURAN KERAS: (1) Pakai HANYA angka yang ada di DATA / ALLOWED_NUMBERS. Jangan menghitung angka baru, jangan menulis rentang umum, studi, atau angka lain. " +
    "(2) Hubungan faktor ke performa = keterkaitan, BUKAN sebab: pakai 'kemungkinan ikut memengaruhi' / 'may have played a part', jangan 'menyebabkan'. " +
    "(3) verdict normal/better -> faktor role 'watch' disebut 'perlu diperhatikan', bukan penyebab. verdict no_clear_factor -> katakan jujur tidak ada faktor jelas dari data; boleh sebut cuaca/rute/stres sebagai hal di luar data. verdict no_baseline -> JANGAN klaim lebih lambat/cepat dari biasanya. " +
    "(4) Faktor status tidak_ada_data = BELUM DICATAT, bukan kurang. (5) Tanpa diagnosis medis, tanpa body shaming, tanpa diet ekstrem. Gaya persona boleh, tanpa sapaan pembuka. " +
    "Balas HANYA JSON (tanpa code fence): {\"headline\":\"1 kalimat ringkas\",\"analysis\":[\"2-4 paragraf pendek\"],\"next_session_tips\":[\"2-3 saran konkret\"],\"cta\":\"BOOK_CLASS|BOOK_DOCTOR|NONE\"}. " +
    (lang === "en" ? "LANGUAGE: write everything in natural English." : "BAHASA: tulis semuanya dalam Bahasa Indonesia.");
  const user = "DATA:\n" + JSON.stringify(data).slice(0, 7000) + "\n\nALLOWED_NUMBERS: " + JSON.stringify([...allowed.strs].concat([...allowed.nums].map(String))).slice(0, 2500);
  return { messages: [{ role: "system", content: sys }, { role: "user", content: user }], allowed: allowed };
}
function parseAi(text) {
  const t = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
}

module.exports = { factorSentence, templateNarrative, aiMessages, checkNarrative, validShape, parseAi, FNAME };
