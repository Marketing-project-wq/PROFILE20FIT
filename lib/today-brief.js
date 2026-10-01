// lib/today-brief.js — isi analisa "Plan Hari Ini" di /activity, DETERMINISTIK (tanpa AI):
//   1) status    : kondisi hari ini — tidur semalam, makan & minum kemarin, beban latihan 7 hari, tubuh
//                  (faktor yang sama persis dengan analisa workout: lib/workout-analysis.js readiness()).
//   2) actions   : yang bisa dilakukan HARI INI untuk menaikkan Health Score — dari breakdown hsCompute
//                  (poin = maksimal yang bisa ditambah komponen itu, dihitung dari skor & bobotnya).
//   3) workout   : analisa workout terakhir (≤ cfg.today.last_workout_days hari) — performa vs biasanya
//                  + faktor tidur/makan/minum/beban yang kurang/berlebih, kalimat dari lib/workout-narrative.js.
// Semua angka dari data user. Kategori tanpa data = "belum dicatat", tidak pernah dinilai "kurang".
"use strict";
const WA = require("./workout-analysis");
const WN = require("./workout-narrative");
const WM = require("../js/workout-metrics.js");

function T(lang, o) { return lang === "en" ? o.en : o.id; }
function d1(n, lang) { return WM.dec(n, 1, lang); }
function liters(ml, lang) { return WM.dec(ml / 1000, 1, lang) + " L"; }
function num(v) { const n = Number(v); return (v != null && v !== "" && isFinite(n)) ? n : null; }
function dayLog(ds, date) { return (ds.dailyLogs || []).find((d) => d.log_date === date) || null; }

const TODAY_NAME = {
  sleep: { en: "sleep", id: "tidur" }, nutrition: { en: "food", id: "makan" }, hydration: { en: "water", id: "minum" },
  load: { en: "recovery", id: "pemulihan" }, body: { en: "body composition", id: "komposisi tubuh" },
};
function names(keys, lang) {
  const l = keys.map((k) => T(lang, TODAY_NAME[k])), and = T(lang, { en: " and ", id: " dan " });
  return l.length <= 2 ? l.join(and) : l.slice(0, -1).join(", ") + "," + and + l[l.length - 1];
}

// ---- 1) Kondisi hari ini ----
function statusText(f, lang) {
  const v = f.value || {}, c = f.compare || {}, none = f.status === "tidak_ada_data";
  if (f.key === "sleep") {
    if (none) return T(lang, { en: "Last night's sleep isn't logged yet.", id: "Tidur semalam belum dicatat." });
    return T(lang, { en: "Last night you slept " + d1(v.hours, lang) + " h", id: "Semalam kamu tidur " + d1(v.hours, lang) + " jam" }) +
      (c.avg_hours != null ? T(lang, { en: " — your 7-day average is " + d1(c.avg_hours, lang) + " h", id: " — rata-rata 7 harimu " + d1(c.avg_hours, lang) + " jam" }) : "") +
      T(lang, { en: " (target " + d1(c.target_hours, lang) + " h).", id: " (target " + d1(c.target_hours, lang) + " jam)." });
  }
  if (f.key === "nutrition") {
    if (none) return T(lang, { en: "Yesterday's meals aren't logged in the Calorie Tracker.", id: "Makan kemarin belum dicatat di Calorie Tracker." });
    let s = T(lang, { en: "Yesterday you ate " + v.kcal + " kcal of your " + c.kcal_target + " kcal target (" + v.kcal_pct + "%)", id: "Kemarin kamu makan " + v.kcal + " kkal dari target " + c.kcal_target + " kkal (" + v.kcal_pct + "%)" });
    const fl = f.flags || [];
    if (fl.indexOf("low_protein") >= 0) s += T(lang, { en: "; protein " + v.protein_g + " g of " + c.protein_target_g + " g", id: "; protein " + v.protein_g + " g dari " + c.protein_target_g + " g" });
    if (fl.indexOf("low_carb") >= 0) s += T(lang, { en: "; carbs " + v.carbs_g + " g of " + c.carbs_target_g + " g", id: "; karbohidrat " + v.carbs_g + " g dari " + c.carbs_target_g + " g" });
    return s + ".";
  }
  if (f.key === "hydration") {
    if (none || v.day_before_ml == null) return T(lang, { en: "Yesterday's water isn't logged yet.", id: "Minum kemarin belum dicatat." });
    return T(lang, { en: "Yesterday you drank " + liters(v.day_before_ml, lang) + " of your " + liters(c.target_ml, lang) + " target.", id: "Kemarin kamu minum " + liters(v.day_before_ml, lang) + " dari target " + liters(c.target_ml, lang) + "." });
  }
  if (f.key === "load") {
    if (none) return T(lang, { en: "No workouts logged in the past few weeks.", id: "Belum ada workout tercatat beberapa minggu terakhir." });
    let s = T(lang, { en: "Last 7 days: " + v.sessions_7d + (v.sessions_7d === 1 ? " session, " : " sessions, ") + v.minutes_7d + " min", id: "7 hari terakhir: " + v.sessions_7d + " sesi, " + v.minutes_7d + " menit" });
    if (c && c.typical_weekly_minutes != null) s += T(lang, { en: " (usually " + c.typical_weekly_minutes + " min/week)", id: " (biasanya " + c.typical_weekly_minutes + " menit/minggu)" });
    if ((f.flags || []).indexOf("recent_hard") >= 0) s += T(lang, { en: "; you had a hard session yesterday", id: "; kemarin ada sesi berat" });
    return s + ".";
  }
  if (f.key === "body") {
    let s = T(lang, { en: "Last Visbody scan " + v.scanned_on, id: "Scan Visbody terakhir " + v.scanned_on });
    if (v.muscle_kg != null) s += T(lang, { en: ": muscle " + d1(v.muscle_kg, lang) + " kg", id: ": massa otot " + d1(v.muscle_kg, lang) + " kg" });
    if (c && c.muscle_kg != null) s += T(lang, { en: " (previous " + d1(c.muscle_kg, lang) + " kg)", id: " (sebelumnya " + d1(c.muscle_kg, lang) + " kg)" });
    if (v.stale) s += T(lang, { en: " — over " + v.age_days + " days ago, a new scan gives fresher data", id: " — sudah " + v.age_days + " hari, scan ulang untuk data terbaru" });
    return s + ".";
  }
  return "";
}

// Progres HARI INI (belum dinilai — hari masih berjalan): minum, makan, workout.
function todayProgress(ds, today, kcalTarget, waterTarget) {
  const rows = (ds.hydration || []).filter((h) => h.log_date === today);
  const dl = dayLog(ds, today);
  const water = rows.length ? rows.reduce((s, h) => s + (num(h.amount_ml) || 0), 0) : (dl && num(dl.water_glasses) != null ? num(dl.water_glasses) * 250 : 0);
  const items = (dl && Array.isArray(dl.cal_items)) ? dl.cal_items.filter((x) => x && typeof x === "object") : [];
  const kcal = Math.round(items.reduce((s, x) => s + (num(x.kcal) || 0), 0));
  const wk = (ds.workouts || []).filter((w) => w.workout_date === today);
  return { water_ml: Math.round(water), water_target_ml: waterTarget, kcal: kcal, kcal_target: kcalTarget, meals: items.length,
    workouts: wk.length, workout_min: Math.round(wk.reduce((s, w) => s + (num(w.duration_min) || 0), 0)) };
}

function headline(factors, lang) {
  const bad = factors.filter((f) => f.key !== "body" && (f.status === "kurang" || f.status === "berlebih")).map((f) => f.key);
  if (bad.length) return T(lang, { en: "Focus today: " + names(bad, lang) + ".", id: "Fokus hari ini: " + names(bad, lang) + "." });
  const missing = factors.filter((f) => ["sleep", "nutrition", "hydration"].indexOf(f.key) >= 0 && f.status === "tidak_ada_data").map((f) => f.key);
  if (missing.length === 3) return T(lang, { en: "Not enough data yet — log your sleep, meals and water so today's advice fits you.", id: "Datamu belum cukup — catat tidur, makan, dan minum supaya saran hari ini pas buat kamu." });
  return T(lang, { en: "From the data you've logged, you're in good shape today.", id: "Dari data yang kamu catat, kondisimu hari ini baik." }) +
    (missing.length ? " " + T(lang, { en: "Not logged yet: " + names(missing, lang) + ".", id: "Belum dicatat: " + names(missing, lang) + "." }) : "");
}

// ---- 2) Naikkan Health Score hari ini ----
const ACT = {
  sleep: { title: { en: "Get enough sleep tonight", id: "Tidur cukup malam ini" }, cta: "sleep",
    missing: { en: "Log your sleep — it isn't counted in your Health Score yet.", id: "Catat tidurmu — belum ikut dihitung di Health Score." } },
  hydration: { title: { en: "Drink your daily water target", id: "Minum sesuai target hari ini" }, cta: "water",
    missing: { en: "Log your water — it isn't counted in your Health Score yet.", id: "Catat minummu — belum ikut dihitung di Health Score." } },
  nutrition: { title: { en: "Eat to your calorie target and log it", id: "Makan sesuai target kalori & catat" }, cta: "meals",
    missing: { en: "Log your meals — nutrition isn't counted in your Health Score yet.", id: "Catat makanmu — nutrisi belum ikut dihitung di Health Score." } },
  workout: { title: { en: "Train today", id: "Latihan hari ini" }, cta: "book",
    missing: { en: "Log a workout — it isn't counted in your Health Score yet.", id: "Catat workout — belum ikut dihitung di Health Score." } },
};
const CNAME = { sleep: { en: "Sleep", id: "Tidur" }, hydration: { en: "Hydration", id: "Hidrasi" }, nutrition: { en: "Nutrition", id: "Nutrisi" }, workout: { en: "Workout", id: "Workout" } };
function scoreActions(hs, cfg, lang) {
  if (!hs || !hs.unlocked) return { locked: true, total: null, items: [], note: T(lang, { en: "Your Health Score unlocks after your first workout or Visbody scan.", id: "Health Score terbuka setelah workout pertama atau scan Visbody." }) };
  const br = hs.breakdown || {}, tw = Object.keys(br).reduce((s, k) => s + (br[k].weight || 0), 0);
  const gapOf = (k) => (hs.gaps || []).find((g) => g.category === k);
  const raise = [], missing = [];
  Object.keys(ACT).forEach((k) => {
    const b = br[k], g = gapOf(k), a = ACT[k];
    if (!b) { missing.push({ key: k, kind: "missing", points: null, title: T(lang, a.title), detail: T(lang, a.missing), cta: a.cta }); return; }
    if (!tw || b.score >= cfg.today.ok_score) return;
    const pts = Math.round((100 - b.score) * b.weight / tw);
    if (pts < 1) return;
    raise.push({ key: k, kind: "raise", points: pts, score: Math.round(b.score),
      title: g ? T(lang, g.action) : T(lang, a.title),
      detail: (g ? T(lang, g.detail) + " " : "") + T(lang, { en: CNAME[k].en + " score " + Math.round(b.score) + "/100 (7-day average).", id: "Skor " + CNAME[k].id.toLowerCase() + " " + Math.round(b.score) + "/100 (rata-rata 7 hari)." }),
      target: g && g.target ? T(lang, g.target) : null, cta: g && g.icon === "rest" ? "rest" : a.cta });
  });
  raise.sort((x, y) => y.points - x.points);
  return { locked: false, total: hs.total, items: raise.concat(missing),
    note: T(lang, { en: "Your Health Score uses 7-day averages, so it rises gradually — the points are the most each part can add.", id: "Health Score memakai rata-rata 7 hari, jadi naiknya bertahap — poin = maksimal yang bisa ditambah tiap bagian." }) };
}

// ---- 3) Workout terakhir ----
function lastWorkout(ds, today, cfg, lang, narrativeFor) {
  const from = WA.addDays(today, -cfg.today.last_workout_days);
  const w = (ds.workouts || []).filter((x) => x.workout_date <= today && x.workout_date >= from)
    .sort((a, b) => (a.workout_date < b.workout_date ? 1 : a.workout_date > b.workout_date ? -1 : (String(a.created_at || "") < String(b.created_at || "") ? 1 : -1)))[0];
  if (!w) return null;
  const a = WA.analyze(w, ds, cfg);
  const n = (narrativeFor && narrativeFor(w, a)) || WN.templateNarrative(a, w, lang);
  const tpl = WN.templateNarrative(a, w, lang);
  return { id: w.id, date: w.workout_date, days_ago: WM.daysBetween(w.workout_date, today), title: WM.title(w, lang),
    verdict: a.verdict, safety: a.safety ? a.safety.level : null, headline: n.headline, perf: tpl.what_we_saw[0] || null,
    factors: a.factors.filter((f) => f.status !== "tidak_ada_data" || ["sleep", "nutrition", "hydration"].indexOf(f.key) >= 0)
      .map((f) => ({ key: f.key, status: f.status, role: f.role, influence: f.influence, name: T(lang, WN.FNAME[f.key]), text: WN.factorSentence(f, lang) })),
    tips: tpl.next_session_tips || [] };
}

// opts = { hs, ds, today, cfg, lang, narrativeFor(w, a) -> narasi tersimpan | null }
function build(opts) {
  const lang = opts.lang === "en" ? "en" : "id", cfg = opts.cfg, ds = opts.ds, today = opts.today;
  const factors = WA.readiness(today, ds, cfg);
  const kcalTarget = ((factors.find((f) => f.key === "nutrition") || {}).compare || {}).kcal_target || null;   // rumus Calorie Tracker
  return {
    date: today,
    headline: headline(factors, lang),
    status: factors.filter((f) => f.key !== "body" || f.status !== "tidak_ada_data")
      .map((f) => ({ key: f.key, status: f.status, flags: f.flags || [], text: statusText(f, lang) })),
    today: todayProgress(ds, today, kcalTarget, cfg.hydration.target_ml),
    score: scoreActions(opts.hs, cfg, lang),
    workout: lastWorkout(ds, today, cfg, lang, opts.narrativeFor),
    // Ringkas utk konteks AI plan (angka pasti, bukan teks).
    facts: factors.map((f) => ({ key: f.key, status: f.status, flags: f.flags || [], value: f.value, compare: f.compare })),
  };
}

module.exports = { build };
