// lib/workout-signals.js — sinyal dari HEART RATE & PACE satu workout (dibanding kebiasaan user sendiri),
// lalu kandidat penyebab yang dicek silang dengan log tidur/makan/minum/beban + jawaban check-in.
//
// DETERMINISTIK (tanpa AI). Ambang di lib/workout-analysis-config.js (signals, causes) — PERLU DIVALIDASI.
// Batas yang dipegang kode ini:
// - Sinyal HR/pace hanya tanda UMUM. Kandidat penyebab dibaca dari POLA sinyal seperti coach membaca
//   performa (config causes.signature) — dari performa saja keyakinan maksimal "sedang"; log & check-in
//   yang ADA menaikkan atau membantahnya. Penyebab tidak pernah dinyatakan pasti.
// - Nutrisi yang bisa dibaca dari performa hanya level latihan: bahan bakar (karbohidrat) & cairan.
//   TIDAK pernah menyimpulkan kekurangan zat gizi spesifik (itu butuh lab -> MCU / dokter).
"use strict";
const WM = require("../js/workout-metrics.js");

function num(v) { const n = Number(v); return (v != null && v !== "" && isFinite(n)) ? n : null; }
function r1(n) { return n == null ? null : Math.round(n * 10) / 10; }
function r2(n) { return n == null ? null : Math.round(n * 100) / 100; }
function avg(a) { const v = a.filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; }
function median(a) { const v = a.filter((x) => x != null).sort((x, y) => x - y); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; }
const PACE_TYPES = { run: 1, walk: 1, hyrox: 1 };
const SPEED_TYPES = { cycling: 1 };

// Kecepatan m/menit dari pace (jenis lari/jalan) atau km/jam (sepeda).
function speedMpm(w) {
  if (PACE_TYPES[w.type]) { const p = WM.paceSec(w); return p ? 60000 / p : null; }
  if (SPEED_TYPES[w.type]) { const s = WM.speedKmh(w); return s ? s * 1000 / 60 : null; }
  return null;
}
function efOf(w) { const v = speedMpm(w), hr = num(w.avg_heart_rate); return v && hr ? v / hr : null; }
function zoneHighShare(w) {
  const z = w && w.hr_zone_data; if (!z) return null;
  const t = ["z1", "z2", "z3", "z4", "z5"].reduce((s, k) => s + (num(z[k]) || 0), 0);
  return t > 0 ? ((num(z.z4) || 0) + (num(z.z5) || 0)) / t * 100 : null;
}
function sig(id, detected, o) { return Object.assign({ id: id, detected: detected, magnitude: null, evidence: null, data_level_required: "basic", reason: null }, o || {}); }
function insufficient(id, reason, level) { return sig(id, "insufficient_data", { reason: reason, data_level_required: level || "basic" }); }

// Workout sejenis milik user (pool baseline) — dipakai B1, HR maks, B4.
function poolOf(w, ds, baseline) {
  const ids = (baseline && baseline.sample_ids) || [];
  return (ds.workouts || []).filter((x) => ids.indexOf(x.id) >= 0);
}

// ---------- B1 efisiensi aerobik ----------
function bEfficiency(w, ds, cfg, baseline) {
  const S = cfg.signals, id = "efficiency_drop";
  if (!PACE_TYPES[w.type] && !SPEED_TYPES[w.type]) return insufficient(id, "not_applicable");
  const ef = efOf(w);
  if (!ef) return insufficient(id, num(w.avg_heart_rate) ? "no_pace" : "no_hr");
  if (!baseline || baseline.status !== "ok") return insufficient(id, "baseline");
  const pool = poolOf(w, ds, baseline).map(efOf).filter((x) => x != null);
  if (pool.length < cfg.baseline.min_samples) return insufficient(id, "baseline");
  const base = avg(pool), pct = (ef - base) / base * 100;
  const ev = { ef: r2(ef), base_ef: r2(base), n: pool.length, delta_pct: r1(pct), hr: num(w.avg_heart_rate), base_hr: baseline.base_hr,
    hr_delta: baseline.hr_delta, current: baseline.current, base: baseline.base, kind: baseline.kind };
  if (pct < -S.ef_drop_pct) return sig(id, true, { magnitude: r1(-pct), evidence: ev, threshold: S.ef_drop_pct });
  return sig(id, false, { magnitude: r1(-pct), evidence: Object.assign(ev, { better: pct > S.ef_rise_pct }), threshold: S.ef_drop_pct });
}

// ---------- B2 cardiac drift / decoupling ----------
function halves(sp) {
  const full = sp.filter((x, i) => !(i === sp.length - 1 && x.km != null && x.km % 1 > 0 && x.km % 1 < 0.5));   // split sisa < 0,5 km dibuang
  const mid = Math.floor(full.length / 2);
  return [full.slice(0, mid), full.slice(full.length - mid)];
}
function bDrift(w, cfg) {
  const S = cfg.signals, id = "cardiac_drift";
  const sp = WM.splitsOf(w).filter((x) => x.hr);
  if (sp.length < S.min_split_hr) return insufficient(id, WM.splitsOf(w).length ? "no_split_hr" : "no_splits", "detailed");
  if ((num(w.duration_min) || 0) < S.decoupling_min_minutes) return insufficient(id, "too_short", "detailed");
  const [a, b] = halves(sp);
  if (!a.length || !b.length) return insufficient(id, "no_splits", "detailed");
  const ef = (arr) => avg(arr.map((x) => (60000 / x.sec) / x.hr));
  const e1 = ef(a), e2 = ef(b), pct = (e1 - e2) / e1 * 100;
  const ev = { decoupling_pct: r1(pct), first_pace: Math.round(avg(a.map((x) => x.sec))), second_pace: Math.round(avg(b.map((x) => x.sec))),
    first_hr: Math.round(avg(a.map((x) => x.hr))), second_hr: Math.round(avg(b.map((x) => x.hr))), n: sp.length };
  return sig(id, pct > S.decoupling_pct, { magnitude: r1(pct), evidence: ev, threshold: S.decoupling_pct, data_level_required: "detailed" });
}

// ---------- B3 pace turun di akhir (HR tidak ikut turun) ----------
function bFade(w, cfg) {
  const S = cfg.signals;
  const sp = WM.splitsOf(w);
  const id = (num(w.duration_min) || 0) >= S.fade_min_minutes ? "late_fade" : "late_fade_short";
  if (sp.length < S.min_splits) return insufficient("late_fade", sp.length ? "few_splits" : "no_splits", "detailed");
  const body = sp.filter((x, i) => !(i === sp.length - 1 && x.km != null && x.km % 1 > 0 && x.km % 1 < 0.5));
  const last = body[body.length - 1], early = body.slice(0, -1);
  const med = median(early.map((x) => x.sec)), pct = (last.sec - med) / med * 100;
  const eHr = avg(early.map((x) => x.hr)), hrHeld = last.hr == null || eHr == null || last.hr >= eHr - S.fade_hr_tolerance_bpm;
  const ev = { last_pace: last.sec, early_pace: Math.round(med), fade_pct: r1(pct), last_hr: last.hr, early_hr: eHr != null ? Math.round(eHr) : null,
    first_pace: early[0] ? early[0].sec : null, long: id === "late_fade" };
  return sig(id, pct > S.fade_pct && hrHeld, { magnitude: r1(pct), evidence: ev, threshold: S.fade_pct, data_level_required: "detailed" });
}

// ---------- HR sulit naik ----------
function bHrSuppressed(w, ds, cfg, baseline) {
  const S = cfg.signals, id = "hr_suppressed", mx = num(w.max_heart_rate);
  if (!PACE_TYPES[w.type] && !SPEED_TYPES[w.type]) return insufficient(id, "not_applicable");   // tanpa pace -> hr_low_effort
  if (!mx) return insufficient(id, "no_max_hr");
  if (!baseline || baseline.status !== "ok") return insufficient(id, "baseline");
  const pool = poolOf(w, ds, baseline).map((x) => num(x.max_heart_rate)).filter((x) => x != null);
  if (pool.length < cfg.baseline.min_samples) return insufficient(id, "baseline");
  const base = avg(pool), drop = base - mx, easier = baseline.delta_pct != null && baseline.delta_pct > cfg.baseline.pace_change_pct;
  const ev = { max_hr: mx, base_max_hr: Math.round(base), drop_bpm: Math.round(drop), n: pool.length };
  return sig(id, drop > S.maxhr_drop_bpm && !easier, { magnitude: Math.round(drop), evidence: ev, threshold: S.maxhr_drop_bpm });
}

// ---------- B4 distribusi zona ----------
function bZones(w, ds, cfg) {
  const S = cfg.signals, id = "zones_high", cur = zoneHighShare(w);
  if (cur == null) return insufficient(id, "no_zones", "full");
  const pool = (ds.workouts || []).filter((x) => x.id !== w.id && x.type === w.type && x.workout_date <= w.workout_date).map(zoneHighShare).filter((x) => x != null).slice(0, 10);
  if (pool.length < cfg.baseline.min_samples) return insufficient(id, "baseline", "full");
  const base = avg(pool), diff = cur - base;
  return sig(id, diff > S.zone_high_pp, { magnitude: r1(diff), evidence: { high_pct: Math.round(cur), base_high_pct: Math.round(base), n: pool.length }, threshold: S.zone_high_pp, data_level_required: "full" });
}

// ---------- B5 kesiapan (resting HR / HRV / sleep score dari screenshot) ----------
function bReadiness(w, ds, cfg) {
  const S = cfg.signals, id = "readiness_low";
  const cur = WM.readinessOf(w.raw_data && w.raw_data.readiness);
  if (!cur) return insufficient(id, "no_readiness", "full");
  const before = (ds.workouts || []).filter((x) => x.id !== w.id && x.workout_date < w.workout_date).map((x) => WM.readinessOf(x.raw_data && x.raw_data.readiness)).filter(Boolean);
  const upRhr = (ds.uploads || []).filter((u) => String(u.upload_date || "") < w.workout_date).map((u) => num((u.extracted_data || {}).resting_heart_rate)).filter((x) => x != null && x > 25 && x < 150);
  const series = (k) => before.map((r) => r[k]).filter((x) => x != null).concat(k === "resting_hr" ? upRhr : []);
  const ev = {}, hits = [];
  let any = false;
  [["resting_hr", (c, b) => c - b > S.rhr_up_bpm, (c, b) => c - b], ["hrv_ms", (c, b) => (b - c) / b * 100 > S.hrv_drop_pct, (c, b) => (b - c) / b * 100],
    ["sleep_score", (c, b) => b - c > S.sleep_score_drop, (c, b) => b - c]].forEach(([k, bad, mag]) => {
    if (cur[k] == null) return;
    const h = series(k);
    if (h.length < S.readiness_min_samples) return;
    any = true;
    const b = avg(h);
    ev[k] = { value: cur[k], usual: Math.round(b), n: h.length };
    if (bad(cur[k], b)) hits.push({ key: k, magnitude: r1(mag(cur[k], b)) });
  });
  if (!any) return insufficient(id, "baseline", "full");
  return sig(id, hits.length > 0, { magnitude: hits.length ? hits[0].magnitude : 0, evidence: Object.assign(ev, { hits: hits.map((h) => h.key) }), data_level_required: "full" });
}

// ---------- Olahraga tanpa pace (padel, tennis, gym, HIIT, …): HR rata-rata & RPE vs sesi serupa ----------
// RPE = rasa berat 1–10 yang diisi user setelah upload (raw_data.rpe). Pace TIDAK dipakai di sini.
function rpeOf(w) { const v = num(w && w.raw_data && w.raw_data.rpe && w.raw_data.rpe.value); return v != null && v >= 1 && v <= 10 ? v : null; }
// Sesi sejenis sebelum workout ini dengan durasi mirip (± effort_duration_tolerance).
function effortPool(w, ds, cfg) {
  const dur = num(w.duration_min), tol = cfg.signals.effort_duration_tolerance;
  const from = new Date(new Date(w.workout_date + "T00:00:00Z").getTime() - cfg.baseline.lookback_days * 864e5).toISOString().slice(0, 10);
  return (ds.workouts || []).filter((x) => x.id !== w.id && x.type === w.type && x.workout_date >= from &&
    (x.workout_date < w.workout_date || (x.workout_date === w.workout_date && String(x.created_at || "") < String(w.created_at || ""))) &&
    (!dur || (num(x.duration_min) && Math.abs(num(x.duration_min) - dur) / dur <= tol))).slice(0, cfg.baseline.max_samples);
}
const paceless = (w) => !PACE_TYPES[w.type] && !SPEED_TYPES[w.type];
// HR lebih tinggi dari biasanya untuk usaha (RPE) yang sama — untuk jenis berpace ini sudah dibaca efficiency_drop.
function bHrHighEffort(w, ds, cfg) {
  const S = cfg.signals, id = "hr_high_effort", hr = num(w.avg_heart_rate), rpe = rpeOf(w);
  if (!paceless(w)) return insufficient(id, "not_applicable");
  if (!hr) return insufficient(id, "no_hr");
  const pool = effortPool(w, ds, cfg).filter((x) => num(x.avg_heart_rate));
  const same = rpe != null ? pool.filter((x) => rpeOf(x) != null && Math.abs(rpeOf(x) - rpe) <= S.effort_rpe_same) : [];
  const use = same.length >= cfg.baseline.min_samples ? same : pool, matched = use === same ? "rpe" : "duration";
  if (use.length < cfg.baseline.min_samples) return insufficient(id, "baseline");
  const base = avg(use.map((x) => num(x.avg_heart_rate))), diff = hr - base;
  const ev = { hr: hr, base_hr: Math.round(base), diff_bpm: Math.round(diff), n: use.length, matched: matched, rpe: rpe };
  return sig(id, diff > S.effort_hr_up_bpm, { magnitude: Math.round(diff), evidence: ev, threshold: S.effort_hr_up_bpm });
}
// HR sulit naik: HR rata-rata jauh di bawah biasanya padahal terasa lebih berat (RPE).
function bHrLowEffort(w, ds, cfg) {
  const S = cfg.signals, id = "hr_low_effort", hr = num(w.avg_heart_rate), rpe = rpeOf(w);
  if (!paceless(w)) return insufficient(id, "not_applicable");
  if (!hr) return insufficient(id, "no_hr");
  if (rpe == null) return insufficient(id, "no_rpe");
  const pool = effortPool(w, ds, cfg).filter((x) => num(x.avg_heart_rate));
  if (pool.length < cfg.baseline.min_samples) return insufficient(id, "baseline");
  const base = avg(pool.map((x) => num(x.avg_heart_rate))), rp = pool.map(rpeOf).filter((x) => x != null);
  const baseRpe = rp.length >= cfg.baseline.min_samples ? avg(rp) : null;
  const hard = baseRpe != null ? rpe >= baseRpe + 1 : rpe >= S.rpe_hard, drop = base - hr;
  const ev = { hr: hr, base_hr: Math.round(base), drop_bpm: Math.round(drop), rpe: rpe, base_rpe: baseRpe != null ? r1(baseRpe) : null, n: pool.length };
  return sig(id, drop > S.effort_hr_down_bpm && hard, { magnitude: Math.round(drop), evidence: ev, threshold: S.effort_hr_down_bpm });
}
// RPE jauh lebih tinggi dari biasanya untuk sesi serupa (semua jenis olahraga).
function bRpeHigh(w, ds, cfg) {
  const S = cfg.signals, id = "rpe_high", rpe = rpeOf(w);
  if (rpe == null) return insufficient(id, "no_rpe");
  const rp = effortPool(w, ds, cfg).map(rpeOf).filter((x) => x != null);
  if (rp.length < cfg.baseline.min_samples) return insufficient(id, "baseline_rpe");
  const base = avg(rp), diff = rpe - base;
  return sig(id, diff >= S.rpe_up, { magnitude: r1(diff), evidence: { rpe: rpe, base_rpe: r1(base), n: rp.length }, threshold: S.rpe_up });
}

function signals(w, ds, cfg, baseline) {
  return [bEfficiency(w, ds, cfg, baseline), bDrift(w, cfg), bFade(w, cfg), bHrSuppressed(w, ds, cfg, baseline), bZones(w, ds, cfg), bReadiness(w, ds, cfg),
    bHrHighEffort(w, ds, cfg), bHrLowEffort(w, ds, cfg), bRpeHigh(w, ds, cfg)];
}

// ---------- C. Kandidat penyebab + tingkat keyakinan ----------
// support: "log" (data log mendukung), "checkin" (jawaban user), "weak" (petunjuk lemah, mis. jam siang),
// "against" (data membantah -> dikeluarkan), "unknown" (tidak ada data).
function evalCause(key, f, w, checkin, cfg, sigs) {
  const st = (k) => (f[k] ? f[k].status : "tidak_ada_data");
  const fromCheckin = (k) => f[k] && f[k].value && f[k].value.src === "checkin";
  const bad = (s) => s === "kurang" || s === "berlebih";
  if (key === "short_sleep") {
    const s = st("sleep");
    if (s === "kurang") return { support: fromCheckin("sleep") ? "checkin" : "log", factor: "sleep" };
    if (s === "baik" || s === "berlebih") return { support: "against", factor: "sleep" };
    return { support: "unknown", factor: "sleep" };
  }
  if (key === "low_fuel") {
    const n = st("nutrition"), p = st("pre_meal");
    if (p === "kurang") return { support: fromCheckin("pre_meal") ? "checkin" : "log", factor: "pre_meal" };
    if (n === "kurang") return { support: "log", factor: "nutrition" };
    if ((n === "baik" || n === "berlebih") && (p === "baik" || p === "berlebih")) return { support: "against", factor: "pre_meal" };
    return { support: "unknown", factor: p !== "tidak_ada_data" ? "pre_meal" : "nutrition" };
  }
  if (key === "dehydration") {
    const h = st("hydration");
    return { support: h === "kurang" ? "log" : h === "baik" ? "against" : "unknown", factor: "hydration" };
  }
  if (key === "high_load") {
    const l = st("load");
    return { support: l === "berlebih" ? "log" : l === "baik" ? "against" : "unknown", factor: "load" };
  }
  if (key === "heat") {
    const c = checkin && checkin.conditions;
    if (c === "outdoor_midday") return { support: "checkin" };
    if (c === "indoor" || c === "outdoor_morning" || c === "outdoor_evening") return { support: "against" };
    const st0 = w.raw_data && w.raw_data.started_at, h = st0 ? +String(st0).slice(0, 2) : null, H = cfg.causes.heat_hours;
    if (h != null && h >= H[0] && h < H[1] && w.type !== "swimming") return { support: "weak", start_hour: h };
    return { support: "unknown" };
  }
  if (key === "unwell") {
    const fe = checkin && checkin.feeling;
    if (fe === "unwell") return { support: "checkin" };
    if (fe === "tired") return { support: "weak" };
    if (fe === "fresh" || fe === "normal") return { support: "against" };
    return { support: "unknown" };
  }
  if (key === "pacing") {
    const fd = sigs.find((x) => (x.id === "late_fade" || x.id === "late_fade_short") && x.detected === true);
    const base = w._baseline;
    if (fd && base && base.status === "ok" && base.kind === "pace" && fd.evidence.first_pace && fd.evidence.first_pace < base.base * (1 - cfg.baseline.pace_change_pct / 100)) return { support: "log", first_pace: fd.evidence.first_pace };
    return { support: "unknown" };
  }
  return { support: "unknown" };
}

// Bacaan coach: skor pola sinyal per kandidat (config causes.signature). Dari performa saja -> maks "sedang";
// log/check-in mendukung -> naik satu tingkat; membantah -> dikeluarkan.
function causes(sigs, factors, w, checkin, cfg, baseline) {
  const detected = sigs.filter((s) => s.detected === true);
  if (!detected.length) return { list: [], ruled_out: [] };
  const f = {}; factors.forEach((x) => { f[x.key] = x; });
  const wb = Object.assign({}, w, { _baseline: baseline });
  const SG = cfg.causes.signature, strongSig = (s) => s.magnitude != null && s.threshold && s.magnitude >= s.threshold * cfg.signals.strong_factor;
  const list = [], ruled = [];
  Object.keys(SG).forEach((k) => {
    const ss = detected.filter((s) => SG[k][s.id]);
    if (!ss.length) return;
    const ev = evalCause(k, f, wb, checkin, cfg, sigs);
    if (ev.support === "against") { ruled.push({ key: k, factor: ev.factor || null }); return; }
    const score = ss.reduce((t, s) => t + SG[k][s.id], 0) + (ss.some(strongSig) ? 1 : 0) + (ev.support === "weak" ? 1 : 0);
    let conf = score >= cfg.causes.perf_medium_score ? "sedang" : "rendah";
    if (ev.support === "log" || ev.support === "checkin") conf = conf === "sedang" ? "tinggi" : "sedang";
    list.push({ key: k, confidence: conf, score: score, support: ev.support, factor: ev.factor || null, signals: ss.map((s) => s.id), start_hour: ev.start_hour, first_pace: ev.first_pace });
  });
  const rank = { tinggi: 3, sedang: 2, rendah: 1 };
  list.sort((a, b) => (rank[b.confidence] - rank[a.confidence]) || (b.score - a.score));
  return { list: list.slice(0, cfg.causes.max_shown), ruled_out: ruled };
}

module.exports = { signals, causes, rpeOf };
