// lib/workout-analysis.js — mesin analisa performa workout yang DETERMINISTIK (tanpa AI).
//
// Semua angka dihitung dari data user sendiri (my20fit_workout, my20fit_sleep, my20fit_hydration,
// my20fit_daily_log.cal_items, my20fit_visbody_body, profil). AI (narasi coach) hanya MENERIMA
// hasil di sini dan tidak boleh menghitung/mengarang angka. Ambang di lib/workout-analysis-config.js.
//
// Fungsi murni: analyze(workout, dataset, cfg) -> {baseline, factors, verdict, safety, inputs}.
// dataset = { workouts, sleep, hydration, dailyLogs, visbody, profile, hydrationLocal(row)->{date,time} }.
"use strict";
const WM = require("../js/workout-metrics.js");
const Nutrition = require("../js/nutrition.js");

const PACE_TYPES = { run: 1, walk: 1, hyrox: 1 };
const SPEED_TYPES = { cycling: 1 };
const DIST_TYPES = { run: 1, walk: 1, hyrox: 1, cycling: 1, swimming: 1 };

function num(v) { const n = Number(v); return (v != null && v !== "" && isFinite(n)) ? n : null; }
function r1(n) { return n == null ? null : Math.round(n * 10) / 10; }
function addDays(ymd, n) { const d = new Date(ymd + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function avg(a) { const v = a.filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; }
function hhmmToMin(t) { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); return m ? (+m[1]) * 60 + (+m[2]) : null; }
function startedAt(w) { const s = w && w.raw_data && w.raw_data.started_at; return hhmmToMin(s) != null ? String(s).slice(0, 5) : null; }
function ageOf(p) {
  const a = num(p && p.age); if (a && a > 5 && a < 110) return a;
  const b = p && (p.birth_date || p.birthdate || p.dob); if (!b) return null;
  const y = new Date(b); return isNaN(y) ? null : Math.floor((Date.now() - y) / (365.25 * 864e5));
}
function dayLog(ds, date) { return (ds.dailyLogs || []).find((d) => d.log_date === date) || null; }
function mealItems(ds, date) { const d = dayLog(ds, date); return (d && Array.isArray(d.cal_items)) ? d.cal_items.filter((x) => x && typeof x === "object") : []; }

// ---------- Keamanan ----------
function safetyCheck(w, profile, cfg) {
  const S = cfg.safety, reasons = [];
  let level = null;
  // Kalimat negatif ("tidak sakit", "no pain") dibuang dulu supaya tidak memicu peringatan.
  const note = String((w && w.note) || "").toLowerCase()
    .replace(/\b(tidak|tak|gak|nggak|ngga|ga|enggak|tanpa|no|not|without|zero)\s+(ada\s+|any\s+|rasa\s+)?[a-z]+(\s+(dada|napas|nafas|kepala))?/g, " ");
  if (note) {
    if (S.emergency_words.some((k) => note.indexOf(k) >= 0)) { level = "emergency"; reasons.push("note_emergency"); }
    else if (S.doctor_words.some((k) => new RegExp("(^|[^a-z])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z]|$)").test(note))) { level = "doctor"; reasons.push("note_symptom"); }
  }
  const mx = num(w && w.max_heart_rate), age = ageOf(profile);
  const limit = Math.min(S.max_hr_abs, age ? (220 - age) + S.max_hr_over_predicted : S.max_hr_abs);
  if (mx && mx > limit) { level = level || "doctor"; reasons.push("hr_abnormal"); }
  return level ? { level: level, reasons: reasons, hr_limit: limit, max_hr: mx } : null;
}

// ---------- B1. Baseline pribadi ----------
function metricOf(w) {
  if (PACE_TYPES[w.type]) return { kind: "pace", v: WM.paceSec(w) };
  if (SPEED_TYPES[w.type]) return { kind: "speed", v: WM.speedKmh(w) };
  return { kind: null, v: null };
}
function computeBaseline(w, ds, cfg) {
  const B = cfg.baseline, D = w.workout_date, from = addDays(D, -B.lookback_days);
  const before = (x) => x.workout_date < D || (x.workout_date === D && String(x.created_at || "") < String(w.created_at || ""));
  const sameType = (ds.workouts || []).filter((x) => x.id !== w.id && x.type === w.type && x.workout_date >= from && before(x))
    .sort((a, b) => (a.workout_date < b.workout_date ? 1 : -1));
  const series = sameType.slice(0, B.chart_points - 1).reverse().concat([w]).map((x) => {
    const m = metricOf(x); return { id: x.id, date: x.workout_date, metric: m.v, hr: num(x.avg_heart_rate), current: x.id === w.id };
  });
  const cur = metricOf(w), dist = num(w.distance_km);
  if (!cur.kind) return { status: "not_comparable", perf: "unknown", kind: null, n: sameType.length, series: series };
  let pool = sameType;
  if (DIST_TYPES[w.type] && dist) pool = pool.filter((x) => { const d = num(x.distance_km); return d && Math.abs(d - dist) / dist <= B.distance_tolerance; });
  pool = pool.filter((x) => metricOf(x).v != null).slice(0, B.max_samples);
  if (pool.length < B.min_samples || cur.v == null) {
    return { status: "insufficient", perf: "unknown", kind: cur.kind, n: pool.length, needed: B.min_samples, series: series };
  }
  const base = avg(pool.map((x) => metricOf(x).v)), baseHr = avg(pool.map((x) => num(x.avg_heart_rate)));
  const hr = num(w.avg_heart_rate);
  // pace: angka lebih BESAR = lebih lambat. speed: lebih besar = lebih cepat. delta_pct positif = performa turun.
  const deltaPct = cur.kind === "pace" ? (cur.v - base) / base * 100 : (base - cur.v) / base * 100;
  const hrDelta = (hr != null && baseHr != null) ? hr - baseHr : null;
  let perf = "normal";
  if (deltaPct > B.pace_change_pct) perf = "down";
  else if (deltaPct < -B.pace_change_pct) perf = "up";
  else if (hrDelta != null && hrDelta > B.hr_change_bpm) perf = "down";   // pace serupa tapi jantung kerja lebih keras
  // efisiensi lari: detak per km (HR x menit/km) — makin kecil makin efisien.
  let eff = null;
  if (cur.kind === "pace" && hr != null && baseHr != null) {
    const bpk = Math.round(hr * cur.v / 60), baseBpk = Math.round(avg(pool.map((x) => (num(x.avg_heart_rate) && metricOf(x).v) ? num(x.avg_heart_rate) * metricOf(x).v / 60 : null)));
    if (baseBpk) eff = { beats_per_km: bpk, base_beats_per_km: baseBpk };
  }
  return {
    status: "ok", perf: perf, kind: cur.kind, n: pool.length, sample_ids: pool.map((x) => x.id),
    similar: Math.abs(deltaPct) <= B.pace_change_pct,
    current: cur.kind === "pace" ? Math.round(cur.v) : r1(cur.v), base: cur.kind === "pace" ? Math.round(base) : r1(base),
    delta: cur.kind === "pace" ? Math.round(cur.v - base) : r1(cur.v - base), delta_pct: r1(deltaPct),
    hr: hr, base_hr: baseHr != null ? Math.round(baseHr) : null, hr_delta: hrDelta != null ? Math.round(hrDelta) : null,
    efficiency: eff, series: series,
  };
}

// ---------- B2. Faktor ----------
function fSleep(w, ds, cfg) {
  const C = cfg.sleep, D = w.workout_date;
  const hoursOn = (date) => {
    const s = (ds.sleep || []).find((x) => x.sleep_date === date);
    if (s && num(s.duration_hours) != null) return { h: num(s.duration_hours), q: s.quality || null, src: "sleep" };
    const d = dayLog(ds, date); if (d && num(d.sleep_hours) != null) return { h: num(d.sleep_hours), q: null, src: "daily_log" };
    return null;
  };
  const prev = []; for (let i = 1; i <= C.avg_days; i++) { const h = hoursOn(addDays(D, -i)); if (h) prev.push(h.h); }
  const avg7 = prev.length >= 3 ? r1(avg(prev)) : null;
  const last = hoursOn(D);   // sleep_date = tanggal BANGUN -> tidur malam sebelum workout
  const out = { key: "sleep", value: last ? { hours: r1(last.h), quality: last.q } : null, compare: { avg_hours: avg7, avg_n: prev.length, target_hours: C.target_hours } };
  if (!last) return Object.assign(out, { status: "tidak_ada_data", deviation: 0 });
  const ref = avg7 || C.target_hours, h = last.h;
  let status = "baik";
  if (h < C.short_hours || (avg7 && h < avg7 - C.short_vs_avg_hours) || h < C.target_hours - 1.5) status = "kurang";
  else if (h > C.long_hours) status = "berlebih";
  return Object.assign(out, { status: status, deviation: status === "kurang" ? Math.max(0, (ref - h) / ref) : status === "berlebih" ? 0.1 : 0 });
}
function fNutrition(w, ds, cfg) {
  const C = cfg.nutrition, D1 = addDays(w.workout_date, -1), items = mealItems(ds, D1);
  const kcalT = Nutrition.goalFor(ds.profile || null), mac = Nutrition.macrosFor(ds.profile || null, kcalT);
  const out = { key: "nutrition", date: D1, compare: { kcal_target: kcalT, carbs_target_g: mac.c, protein_target_g: mac.p } };
  if (!items.length) return Object.assign(out, { status: "tidak_ada_data", value: null, deviation: 0 });
  const sum = (k) => Math.round(items.reduce((s, x) => s + (num(x[k]) || 0), 0));
  const kcal = sum("kcal"), c = sum("c"), p = sum("p");
  const kp = kcal / kcalT * 100, cp = mac.c ? c / mac.c * 100 : null, pp = mac.p ? p / mac.p * 100 : null;
  const flags = [];
  if (kp < C.kcal_low_pct) flags.push("low_kcal");
  if (cp != null && cp < C.carb_low_pct) flags.push("low_carb");
  if (pp != null && pp < C.protein_low_pct) flags.push("low_protein");
  let status = flags.length ? "kurang" : (kp > C.kcal_high_pct ? "berlebih" : "baik");
  const dev = status === "kurang" ? Math.max(0, 1 - kp / 100, cp != null ? 1 - cp / 100 : 0) : status === "berlebih" ? Math.min(1, kp / 100 - 1) : 0;
  return Object.assign(out, { status: status, flags: flags, deviation: dev,
    value: { kcal: kcal, carbs_g: c, protein_g: p, items: items.length, kcal_pct: Math.round(kp), carbs_pct: cp != null ? Math.round(cp) : null } });
}
function fPreMeal(w, ds, cfg) {
  const C = cfg.pre_meal, st = startedAt(w), out = { key: "pre_meal", compare: { too_close_min: C.too_close_min, ideal_max_min: C.ideal_max_min, long_gap_min: C.long_gap_min } };
  if (!st) return Object.assign(out, { status: "tidak_ada_data", reason: "no_start_time", value: null, deviation: 0 });
  const items = mealItems(ds, w.workout_date);
  if (!items.length) return Object.assign(out, { status: "tidak_ada_data", reason: "no_log", value: { started_at: st }, deviation: 0 });
  const stMin = hhmmToMin(st);
  const before = items.map((x) => ({ x: x, m: hhmmToMin(x.t) })).filter((o) => o.m != null && o.m <= stMin).sort((a, b) => b.m - a.m);
  if (!before.length) return Object.assign(out, { status: "kurang", reason: "no_meal_before", value: { started_at: st, gap_min: null }, deviation: 0.3 });
  const gap = stMin - before[0].m, last = before[0].x;
  let status = "baik", dev = 0;
  if (gap < C.too_close_min) { status = "berlebih"; dev = 0.2; }
  else if (gap > C.long_gap_min) { status = "kurang"; dev = Math.min(1, 0.15 + (gap - C.long_gap_min) / C.long_gap_min); }
  return Object.assign(out, { status: status, deviation: dev,
    value: { started_at: st, gap_min: gap, last_meal: String(last.name || "").slice(0, 60), last_meal_time: String(last.t).slice(0, 5), last_meal_kcal: num(last.kcal) } });
}
function fHydration(w, ds, cfg) {
  const C = cfg.hydration, D = w.workout_date, D1 = addDays(D, -1), st = startedAt(w);
  const rows = (date) => (ds.hydration || []).filter((h) => h.log_date === date);
  const total = (date) => {
    const r = rows(date); if (r.length) return r.reduce((s, h) => s + (num(h.amount_ml) || 0), 0);
    const d = dayLog(ds, date); return (d && num(d.water_glasses) != null) ? num(d.water_glasses) * 250 : null;
  };
  const dayBefore = total(D1), todayRows = rows(D);
  let beforeStart = null;
  if (st && todayRows.length) {
    const stMin = hhmmToMin(st);
    beforeStart = todayRows.filter((h) => { const t = ds.localTime ? ds.localTime(h.logged_at) : null; return t != null && hhmmToMin(t) <= stMin; })
      .reduce((s, h) => s + (num(h.amount_ml) || 0), 0);
  }
  const out = { key: "hydration", compare: { target_ml: C.target_ml }, value: { day_before_ml: dayBefore, before_start_ml: beforeStart } };
  if (dayBefore == null && beforeStart == null) return Object.assign(out, { status: "tidak_ada_data", value: null, deviation: 0 });
  const flags = [];
  if (dayBefore != null && dayBefore < C.target_ml * C.low_pct / 100) flags.push("low_day_before");
  if (beforeStart != null && beforeStart < C.target_ml * C.pre_low_pct / 100) flags.push("low_before_start");
  const dev = flags.length ? Math.max(dayBefore != null ? 1 - dayBefore / C.target_ml : 0, beforeStart != null ? (C.pre_low_pct / 100 - beforeStart / C.target_ml) : 0) : 0;
  return Object.assign(out, { status: flags.length ? "kurang" : "baik", flags: flags, deviation: Math.max(0, dev) });
}
function fLoad(w, ds, cfg) {
  const C = cfg.load, D = w.workout_date, age = ageOf(ds.profile);
  const others = (ds.workouts || []).filter((x) => x.id !== w.id && x.workout_date < D);
  const inRange = (a, b) => others.filter((x) => x.workout_date >= a && x.workout_date <= b);
  const last7 = inRange(addDays(D, -C.window_days), addDays(D, -1));
  const before = inRange(addDays(D, -C.window_days * (C.typical_weeks + 1)), addDays(D, -C.window_days - 1));
  const out = { key: "load" };
  if (!last7.length && !before.length) return Object.assign(out, { status: "tidak_ada_data", value: null, compare: null, deviation: 0 });
  const mins = (arr) => Math.round(arr.reduce((s, x) => s + (num(x.duration_min) || 0), 0));
  const hrMax = age ? 220 - age : null;
  const isHard = (x) => (num(x.duration_min) || 0) >= C.hard_duration_min || (hrMax && num(x.avg_heart_rate) && num(x.avg_heart_rate) >= hrMax * C.hard_hr_pct_of_max);
  const hard = last7.filter(isHard).sort((a, b) => (a.workout_date < b.workout_date ? 1 : -1));
  const daysSinceHard = hard.length ? WM.daysBetween(hard[0].workout_date, D) : null;
  const typical = before.length ? Math.round(mins(before) / C.typical_weeks) : null;
  const m7 = mins(last7), flags = [];
  if (daysSinceHard != null && daysSinceHard <= C.recent_hard_days) flags.push("recent_hard");
  if (m7 > C.high_minutes_abs || (typical && m7 > typical * C.high_vs_typical && m7 - typical > 60)) flags.push("high_volume");
  const dev = flags.length ? Math.min(1, Math.max(flags.indexOf("recent_hard") >= 0 ? 0.25 : 0, typical ? (m7 / typical - 1) / 2 : 0)) : 0;
  return Object.assign(out, { status: flags.length ? "berlebih" : "baik", flags: flags, deviation: dev,
    value: { sessions_7d: last7.length, minutes_7d: m7, hard_sessions_7d: hard.length, days_since_hard: daysSinceHard },
    compare: { typical_weekly_minutes: typical } });
}
function fBody(w, ds, cfg) {
  const C = cfg.body, D = w.workout_date;
  const scans = (ds.visbody || []).filter((s) => String(s.scanned_at || "").slice(0, 10) <= D).sort((a, b) => (a.scanned_at < b.scanned_at ? 1 : -1));
  const out = { key: "body" };
  if (!scans.length) return Object.assign(out, { status: "tidak_ada_data", value: null, compare: null, deviation: 0 });
  const a = scans[0], b = scans[1] || null, ageD = WM.daysBetween(String(a.scanned_at).slice(0, 10), D);
  const mus = num(a.muscle_mass), pm = b && num(b.muscle_mass), wt = num(a.body_weight), pw = b && num(b.body_weight);
  const flags = [];
  if (mus != null && pm != null && pm - mus >= C.muscle_drop_kg) flags.push("muscle_drop");
  if (wt != null && pw != null && Math.abs(wt - pw) / pw * 100 >= C.weight_change_pct) flags.push("weight_change");
  return Object.assign(out, { status: flags.indexOf("muscle_drop") >= 0 ? "kurang" : "baik", flags: flags, deviation: flags.length ? 0.1 : 0,
    value: { weight_kg: wt, muscle_kg: mus, scanned_on: String(a.scanned_at).slice(0, 10), age_days: ageD, stale: ageD > C.fresh_days },
    compare: b ? { weight_kg: pw, muscle_kg: pm, scanned_on: String(b.scanned_at).slice(0, 10) } : null });
}

// ---------- B3. Status -> kemungkinan pengaruh ----------
function influenceOf(dev, cfg) { return dev >= cfg.influence.high_dev ? "tinggi" : dev >= cfg.influence.mid_dev ? "sedang" : "rendah"; }

function analyze(w, ds, cfg) {
  const safety = safetyCheck(w, ds.profile, cfg);
  const baseline = computeBaseline(w, ds, cfg);
  const factors = [fSleep, fNutrition, fPreMeal, fHydration, fLoad, fBody].map((fn) => fn(w, ds, cfg));
  factors.forEach((f) => {
    f.role = null; f.influence = null;
    if (f.status === "baik" || f.status === "tidak_ada_data") return;
    if (baseline.perf === "down") { f.role = "possible_cause"; f.influence = f.key === "body" ? "rendah" : influenceOf(f.deviation, cfg); }
    else f.role = "watch";   // performa normal/bagus/tak terukur -> "perlu diperhatikan", bukan penyebab
  });
  let verdict;
  if (safety) verdict = "safety";
  else if (baseline.perf === "unknown") verdict = "no_baseline";
  else if (baseline.perf === "down") verdict = factors.some((f) => f.role === "possible_cause") ? "factors" : "no_clear_factor";
  else verdict = baseline.perf === "up" ? "better" : "normal";
  const inputs = {
    w: [w.id, w.workout_date, w.type, num(w.duration_min), num(w.distance_km), num(w.avg_heart_rate), num(w.max_heart_rate), WM.paceSec(w), startedAt(w), w.note || null],
    b: [baseline.status, baseline.current, baseline.base, baseline.n, baseline.hr, baseline.base_hr],
    f: factors.map((f) => [f.key, f.status, f.value, f.compare]),
    profile: ds.profile ? [ds.profile.weight_kg, ds.profile.height_cm, ds.profile.main_goal, ds.profile.calorie_target_kcal, ageOf(ds.profile)] : null,
  };
  return { version: 1, workout_id: w.id, date: w.workout_date, type: w.type, started_at: startedAt(w), safety: safety, baseline: baseline, factors: factors, verdict: verdict, inputs: inputs };
}

module.exports = { analyze, addDays };
