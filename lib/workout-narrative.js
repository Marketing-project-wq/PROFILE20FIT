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
function d2(n, lang) { return n == null ? null : WM.dec(n, 2, lang); }
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
    let s = T(lang, { en: v.sessions_7d + (v.sessions_7d === 1 ? " session, " : " sessions, ") + v.minutes_7d + " min in the 7 days before", id: v.sessions_7d + " sesi, " + v.minutes_7d + " menit dalam 7 hari sebelumnya" });
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

// ---------- Sinyal & penyebab -> kalimat ----------
const CNAME = {
  short_sleep: { en: "short sleep", id: "kurang tidur" }, low_fuel: { en: "low fuel before training", id: "kurang bahan bakar sebelum latihan" },
  dehydration: { en: "not drinking enough", id: "kurang minum" }, heat: { en: "heat & humidity", id: "panas & lembap" },
  high_load: { en: "accumulated training load", id: "beban latihan menumpuk" }, unwell: { en: "not feeling well", id: "badan kurang fit" },
  pacing: { en: "starting too fast", id: "pacing awal terlalu cepat" },
};
function pace(sec) { return sec ? WM.fmtPace(sec) : "—"; }
function signalSentence(sg, lang) {
  const e = sg.evidence || {};
  if (sg.id === "efficiency_drop") {
    const hr = e.base_hr != null && e.hr != null ? T(lang, { en: " — average heart rate " + e.hr + " bpm vs " + e.base_hr + " bpm usually", id: " — HR rata-rata " + e.hr + " bpm, biasanya " + e.base_hr + " bpm" }) : "";
    return sg.detected === true
      ? T(lang, { en: "Your heart worked harder than usual for your pace: " + d2(e.ef, lang) + " m per heartbeat vs " + d2(e.base_ef, lang) + " usually (" + d1(e.delta_pct, lang) + "%)", id: "Jantungmu bekerja lebih keras dari biasanya untuk pace yang sama: " + d2(e.ef, lang) + " m per detak, biasanya " + d2(e.base_ef, lang) + " (" + d1(e.delta_pct, lang) + "%)" }) + hr + "."
      : T(lang, { en: "Heart rate vs pace was in line with your usual (" + d2(e.ef, lang) + " m per heartbeat vs " + d2(e.base_ef, lang) + ").", id: "HR dibanding pace sesuai biasanya (" + d2(e.ef, lang) + " m per detak, biasanya " + d2(e.base_ef, lang) + ")." });
  }
  if (sg.id === "cardiac_drift") return sg.detected === true
    ? T(lang, { en: "In the second half your heart rate rose from " + e.first_hr + " to " + e.second_hr + " bpm while your pace went from " + pace(e.first_pace) + " to " + pace(e.second_pace) + " (decoupling " + d1(e.decoupling_pct, lang) + "%).", id: "Di paruh kedua HR naik dari " + e.first_hr + " ke " + e.second_hr + " bpm, sementara pace " + pace(e.first_pace) + " → " + pace(e.second_pace) + " (decoupling " + d1(e.decoupling_pct, lang) + "%)." })
    : T(lang, { en: "Heart rate stayed steady relative to pace across the session (decoupling " + d1(e.decoupling_pct, lang) + "%).", id: "HR stabil terhadap pace sepanjang sesi (decoupling " + d1(e.decoupling_pct, lang) + "%)." });
  if (sg.id === "late_fade" || sg.id === "late_fade_short") return sg.detected === true
    ? T(lang, { en: "Your last split slowed to " + pace(e.last_pace) + ", " + d1(e.fade_pct, lang) + "% slower than your earlier splits (" + pace(e.early_pace) + ")" + (e.last_hr ? " while heart rate stayed at " + e.last_hr + " bpm" : "") + ".", id: "Split terakhir melambat ke " + pace(e.last_pace) + ", " + d1(e.fade_pct, lang) + "% lebih lambat dari split sebelumnya (" + pace(e.early_pace) + ")" + (e.last_hr ? " sementara HR tetap " + e.last_hr + " bpm" : "") + "." })
    : T(lang, { en: "No big slowdown at the end (last split " + pace(e.last_pace) + " vs " + pace(e.early_pace) + ").", id: "Tidak ada penurunan pace besar di akhir (split terakhir " + pace(e.last_pace) + ", sebelumnya " + pace(e.early_pace) + ")." });
  if (sg.id === "hr_suppressed") return sg.detected === true
    ? T(lang, { en: "Your max heart rate was " + e.max_hr + " bpm, " + e.drop_bpm + " bpm below your usual " + e.base_max_hr + " bpm, even though the pace wasn't easier.", id: "HR maksimal " + e.max_hr + " bpm, " + e.drop_bpm + " bpm di bawah biasanya (" + e.base_max_hr + " bpm) padahal pace tidak lebih santai." })
    : T(lang, { en: "Max heart rate " + e.max_hr + " bpm, close to your usual " + e.base_max_hr + " bpm.", id: "HR maksimal " + e.max_hr + " bpm, mirip biasanya (" + e.base_max_hr + " bpm)." });
  if (sg.id === "zones_high") return sg.detected === true
    ? T(lang, { en: e.high_pct + "% of the session was in zones 4–5, vs " + e.base_high_pct + "% usually for this type of workout.", id: e.high_pct + "% waktu sesi ada di zona 4–5, biasanya " + e.base_high_pct + "% untuk jenis workout ini." })
    : T(lang, { en: "Time in zones 4–5: " + e.high_pct + "% (usually " + e.base_high_pct + "%).", id: "Waktu di zona 4–5: " + e.high_pct + "% (biasanya " + e.base_high_pct + "%)." });
  if (sg.id === "readiness_low") {
    const p = [];
    if (e.resting_hr) p.push(T(lang, { en: "resting HR " + e.resting_hr.value + " bpm (usually " + e.resting_hr.usual + ")", id: "resting HR " + e.resting_hr.value + " bpm (biasanya " + e.resting_hr.usual + ")" }));
    if (e.hrv_ms) p.push(T(lang, { en: "HRV " + e.hrv_ms.value + " ms (usually " + e.hrv_ms.usual + ")", id: "HRV " + e.hrv_ms.value + " ms (biasanya " + e.hrv_ms.usual + ")" }));
    if (e.sleep_score) p.push(T(lang, { en: "sleep score " + e.sleep_score.value + " (usually " + e.sleep_score.usual + ")", id: "sleep score " + e.sleep_score.value + " (biasanya " + e.sleep_score.usual + ")" }));
    return (sg.detected === true ? T(lang, { en: "Your recovery numbers were below your usual: ", id: "Angka pemulihanmu di bawah biasanya: " }) : T(lang, { en: "Recovery numbers: ", id: "Angka pemulihan: " })) + p.join(", ") + ".";
  }
  return "";
}
const MEAL_GAP_TXT = {
  close: (c) => ({ en: "less than " + c.too_close_min + " min", id: "kurang dari " + c.too_close_min + " menit" }),
  ok: (c) => ({ en: c.too_close_min + " min – " + c.ideal_max_min / 60 + " h", id: c.too_close_min + " menit – " + c.ideal_max_min / 60 + " jam" }),
  mid: (c) => ({ en: c.ideal_max_min / 60 + "–" + c.long_gap_min / 60 + " h", id: c.ideal_max_min / 60 + "–" + c.long_gap_min / 60 + " jam" }),
  long: (c) => ({ en: "more than " + c.long_gap_min / 60 + " h", id: "lebih dari " + c.long_gap_min / 60 + " jam" }),
  none: () => ({ en: "nothing since waking up", id: "belum makan sejak bangun" }),
};
function causeEvidence(c, a, lang) {
  const f = (k) => a.factors.find((x) => x.key === k);
  if (c.factor && (c.support === "log" || c.support === "checkin")) {
    const fx = f(c.factor);
    if (fx && fx.value && fx.value.src === "checkin" && fx.key === "pre_meal") return T(lang, { en: "In your check-in, your last meal was ", id: "Dari check-in, makan terakhir " }) + T(lang, MEAL_GAP_TXT[fx.value.meal_gap](fx.compare)) + T(lang, { en: " before training.", id: " sebelum latihan." });
    if (fx) return factorSentence(fx, lang);
  }
  if (c.key === "heat" && c.support === "checkin") return T(lang, { en: "You trained outdoors around midday.", id: "Kamu latihan di luar ruangan sekitar siang hari." });
  if (c.key === "heat" && c.support === "weak") return T(lang, { en: "You started at " + c.start_hour + ":00 — midday in Jakarta can be hot and humid.", id: "Kamu mulai jam " + c.start_hour + ":00 — siang di Jakarta bisa panas & lembap." });
  if (c.key === "heat") return T(lang, { en: "Where and when you trained isn't known yet — answer the check-in.", id: "Lokasi & jam latihan belum diketahui — isi check-in." });
  if (c.key === "unwell") return c.support === "checkin" ? T(lang, { en: "You said you weren't feeling well.", id: "Kamu menjawab badan terasa kurang enak." }) : c.support === "weak" ? T(lang, { en: "You said you felt tired.", id: "Kamu menjawab badan terasa capek." })
    : T(lang, { en: "How you felt isn't known yet — answer the check-in.", id: "Kondisi badanmu belum diketahui — isi check-in." });
  if (c.key === "pacing" && c.first_pace) return T(lang, { en: "Your first split was " + pace(c.first_pace) + ", faster than your usual " + pace(a.baseline.base) + ".", id: "Split pertamamu " + pace(c.first_pace) + ", lebih cepat dari biasanya (" + pace(a.baseline.base) + ")." });
  if (c.key === "short_sleep" && c.support === "weak") return T(lang, { en: "Your recovery numbers were below your usual.", id: "Angka pemulihanmu di bawah biasanya." });
  return T(lang, { en: "No data yet to check this.", id: "Belum ada data untuk mengecek ini." });
}
function causeSentence(c, a, lang) {
  const tail = { tinggi: { en: "likely played a part", id: "kemungkinan besar ikut berperan" }, sedang: { en: "may have played a part", id: "kemungkinan ikut berperan" },
    rendah: { en: "possible, but your data doesn't confirm it yet", id: "mungkin, tapi belum didukung datamu" } }[c.confidence];
  const nm = T(lang, CNAME[c.key]);
  return nm.charAt(0).toUpperCase() + nm.slice(1) + " — " + T(lang, tail) + ". " + causeEvidence(c, a, lang);
}
const TIPS_C = {
  short_sleep: (a, lang) => TIPS.sleep(a.factors.find((f) => f.key === "sleep"), lang),
  low_fuel: (a, lang) => T(lang, { en: "Have a light carb-based meal a few hours before training, and eat enough the day before longer sessions.", id: "Makan ringan berkarbohidrat beberapa jam sebelum latihan, dan cukupi makan sehari sebelum sesi panjang." }),
  dehydration: (a, lang) => TIPS.hydration(a.factors.find((f) => f.key === "hydration"), lang),
  heat: (a, lang) => T(lang, { en: "If you train outdoors, pick the morning or evening and bring water.", id: "Kalau latihan di luar ruangan, pilih pagi atau sore dan bawa minum." }),
  high_load: (a, lang) => TIPS.load(null, lang),
  unwell: (a, lang) => T(lang, { en: "If you don't feel well, rest first. Chest pain, dizziness or shortness of breath — see a doctor.", id: "Kalau badan kurang fit, istirahat dulu. Kalau ada nyeri dada, pusing, atau sesak — periksa ke dokter." }),
  pacing: (a, lang) => T(lang, { en: "Start the first km a little slower and build up gradually.", id: "Mulai km pertama sedikit lebih pelan, lalu naikkan bertahap." }),
};
function names(keys, lang) {
  const l = keys.map((k) => T(lang, CNAME[k])), and = T(lang, { en: " and ", id: " dan " });
  return l.length <= 2 ? l.join(and) : l.slice(0, -1).join(", ") + "," + and + l[l.length - 1];
}

function templateNarrative(a, w, lang) {
  if (a.safety) return safetyNarrative(a, lang);
  const title = WM.title(w, lang), det = a.signals.filter((x) => x.detected === true), evl = a.signals.filter((x) => x.detected === false);
  const saw = [];
  if (a.baseline.status !== "not_comparable") saw.push(perfSentence(a, w, lang));
  det.forEach((x) => saw.push(signalSentence(x, lang)));
  if (!det.length) evl.slice(0, 2).forEach((x) => saw.push(signalSentence(x, lang)));
  if (!saw.length) saw.push(T(lang, { en: title + " logged.", id: title + " tercatat." }));
  const why = a.causes.map((c) => causeSentence(c, a, lang));
  const top = a.causes.filter((c) => c.confidence !== "rendah").map((c) => c.key);
  const watch = a.factors.filter((f) => f.role === "watch");
  let headline, cant = null;
  if (a.verdict === "signals_explained") headline = T(lang, { en: "Signs of fatigue — " + names(top.slice(0, 2), lang) + " may have played a part.", id: "Ada tanda kelelahan — " + names(top.slice(0, 2), lang) + " kemungkinan ikut berperan." });
  else if (a.verdict === "signals_unclear") headline = T(lang, { en: "Signs of fatigue, but the cause isn't clear from your data yet.", id: "Ada tanda kelelahan, tapi penyebabnya belum jelas dari datamu." });
  else if (a.verdict === "better") headline = T(lang, { en: "More efficient than usual — " + title + ".", id: "Lebih efisien dari biasanya — " + title + "." });
  else if (a.verdict === "normal") headline = T(lang, { en: "No signs of fatigue — this workout looks normal" + (watch.length ? "; keep an eye on your " + watch.map((f) => T(lang, FNAME[f.key])).slice(0, 2).join(", ") + "." : "."), id: "Tidak ada tanda kelelahan — workout ini terlihat normal" + (watch.length ? "; perhatikan " + watch.map((f) => T(lang, FNAME[f.key])).slice(0, 2).join(", ") + "." : ".") });
  else headline = T(lang, { en: title + " logged — not enough data yet to read heart-rate & pace signals.", id: title + " tercatat — data belum cukup untuk membaca sinyal heart rate & pace." });
  if (a.verdict === "signals_unclear") cant = T(lang, { en: "The cause can't be pinned down from the data available — stress, caffeine, the route, or starting to feel unwell can also play a part." + (a.needs_checkin ? " Answer the quick check-in to sharpen this." : ""), id: "Penyebabnya belum bisa dipastikan dari data yang ada — stres, kafein, rute, atau mulai kurang fit juga bisa berperan." + (a.needs_checkin ? " Isi check-in singkat supaya analisanya lebih tepat." : "") });
  else if (a.verdict === "signals_explained") cant = T(lang, { en: "These are likely contributors, not certainties — things outside your data (stress, caffeine, the route) can also play a part.", id: "Ini kemungkinan, bukan kepastian — hal di luar data (stres, kafein, rute) juga bisa ikut berperan." });
  else if (a.verdict === "limited") {
    const r = a.signals.map((x) => x.reason);
    cant = a.data_level.level === "basic" && r.indexOf("baseline") < 0
      ? T(lang, { en: "With a summary screenshot only, heart-rate & pace signals can't be read. Upload the Splits screen (with heart rate per km) for a deeper analysis.", id: "Dari screenshot ringkasan saja, sinyal heart rate & pace belum bisa dibaca. Upload layar Splits (dengan heart rate per km) supaya analisanya lebih dalam." })
      : T(lang, { en: "Your usual can't be compared yet — at least " + (a.baseline.needed || 3) + " similar workouts are needed. Keep logging and upload splits with heart rate.", id: "Belum bisa dibandingkan dengan kebiasaanmu — butuh minimal " + (a.baseline.needed || 3) + " workout sejenis. Terus catat dan upload splits dengan heart rate." });
  } else if (a.data_level.level === "basic") cant = T(lang, { en: "This analysis uses the summary only — add the Splits screen with heart rate to also check drift and end-of-session fade.", id: "Analisa ini hanya dari ringkasan — tambahkan layar Splits dengan heart rate supaya drift & penurunan pace di akhir juga bisa dicek." });
  const tips = [];
  a.causes.filter((c) => c.confidence !== "rendah").forEach((c) => { if (TIPS_C[c.key]) tips.push(TIPS_C[c.key](a, lang)); });
  watch.sort((x, y) => y.deviation - x.deviation).forEach((f) => { if (tips.length < 3) tips.push(TIPS[f.key](f, lang)); });
  if (tips.length < 3 && a.verdict === "signals_unclear") tips.push(T(lang, { en: "Log your sleep, meals and water (or answer the check-in) so the cause can be checked next time.", id: "Catat tidur, makan, dan minum (atau isi check-in) supaya penyebabnya bisa dicek." }));
  if (tips.length < 3 && a.data_level.level === "basic") tips.push(T(lang, { en: "Next time, also upload the Splits/Laps screen with heart rate per km.", id: "Lain kali, upload juga layar Splits/Laps dengan heart rate per km." }));
  if (!tips.length) tips.push(T(lang, { en: "Keep your current sleep and eating routine.", id: "Pertahankan pola tidur dan makanmu." }));
  return { headline: headline, what_we_saw: saw.slice(0, 5), likely_why: why, what_we_cant_tell: cant, next_session_tips: Array.from(new Set(tips)).slice(0, 3), cta: "BOOK_CLASS", source: "template" };
}

function safetyNarrative(a, lang) {
  const em = a.safety.level === "emergency", hr = a.safety.reasons.indexOf("hr_abnormal") >= 0;
  const paras = [];
  if (em) paras.push(T(lang, { en: "Your note mentions a symptom that needs urgent attention. Stop training and seek medical help right away.", id: "Catatanmu menyebut gejala yang perlu ditangani segera. Hentikan latihan dan segera cari pertolongan medis." }));
  else if (a.safety.reasons.indexOf("note_symptom") >= 0) paras.push(T(lang, { en: "Your note mentions pain or discomfort. Stop training until it has been checked by a doctor.", id: "Catatanmu menyebut nyeri atau keluhan. Hentikan latihan dulu sampai diperiksa dokter." }));
  if (hr) paras.push(T(lang, { en: "Your max heart rate reading (" + a.safety.max_hr + " bpm) is unusually high. It may be a sensor error, but if you felt chest pain, dizziness or shortness of breath, consult a doctor before training again.", id: "Detak jantung maksimal yang terbaca (" + a.safety.max_hr + " bpm) tidak wajar. Bisa karena sensor, tapi kalau kamu merasa nyeri dada, pusing, atau sesak, konsultasikan ke dokter sebelum latihan lagi." }));
  paras.push(T(lang, { en: "Performance analysis is paused for this workout. This is not a medical assessment.", id: "Analisa performa untuk workout ini dihentikan dulu. Ini bukan penilaian medis." }));
  return { headline: em ? T(lang, { en: "Stop training and seek medical help.", id: "Hentikan latihan dan cari pertolongan medis." }) : T(lang, { en: "Get this checked by a doctor before your next session.", id: "Periksakan ke dokter sebelum sesi berikutnya." }),
    what_we_saw: paras, likely_why: [], what_we_cant_tell: null, next_session_tips: [], cta: em ? "EMERGENCY" : "BOOK_DOCTOR", source: "template" };
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
  walk({ b: a.baseline, f: a.factors, s: a.safety, sg: a.signals.map((x) => x.evidence), c: a.causes, ci: a.checkin,
    w: [w.workout_date, w.distance_km, w.avg_heart_rate, w.max_heart_rate, w.calories_burned] });
  const b = a.baseline, paces = [b.current, b.base, WM.paceSec(w)];
  a.signals.forEach((x) => { const e = x.evidence || {}; ["first_pace", "second_pace", "last_pace", "early_pace"].forEach((k) => paces.push(e[k])); });
  a.causes.forEach((c) => paces.push(c.first_pace));
  paces.map((p) => (p ? WM.fmtPace(p) : null)).concat([WM.fmtDuration(w.duration_min), b.delta != null ? WM.fmtDuration(Math.abs(b.delta) / 60) : null])
    .forEach((s) => { if (s) strs.add(String(s).replace("/km", "")); });
  // Angka dari kalimat template (label check-in, ambang jeda makan, zona 4–5) juga boleh dikutip ulang.
  [].concat(templateText(a, w, lang)).forEach((t) => (String(t).match(NUM_RE) || []).forEach((x) => { strs.add(x); addN(+x.replace(",", ".")); }));
  return { nums: nums, strs: strs };
}
// Angka yang berdiri sendiri (angka yang menempel huruf seperti "20FIT" atau "Z2" bukan data).
const NUM_RE = /(?<![A-Za-z\d])\d+(?:[.,:]\d+)*(?![A-Za-z\d])/g;
// Klaim kekurangan zat gizi spesifik dilarang (butuh lab -> MCU/dokter); narasi yang memuatnya ditolak.
const BANNED_RE = /zat besi|\biron\b|vitamin|anemi|defisiensi|deficien|ferritin|feritin|magnesium|\bb12\b/i;
function narrativeText(n) { return [n.headline].concat(n.what_we_saw || [], n.likely_why || [], n.what_we_cant_tell ? [n.what_we_cant_tell] : [], n.next_session_tips || []).join(" "); }
function templateText(a, w, lang) { const t = templateNarrative(a, w, lang); return narrativeText(t); }
function checkNarrative(n, allowed) {
  const txt = narrativeText(n);
  const bad = [];
  const ban = txt.match(BANNED_RE); if (ban) bad.push("banned:" + ban[0]);
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
  const strs = (x, mn, mx) => Array.isArray(x) && x.length >= mn && x.length <= mx && x.every((p) => typeof p === "string" && p.trim());
  return !!(n && typeof n.headline === "string" && n.headline.trim() && strs(n.what_we_saw, 1, 5) && strs(n.likely_why || [], 0, 3) &&
    (n.what_we_cant_tell == null || typeof n.what_we_cant_tell === "string") && strs(n.next_session_tips || [], 0, 3) &&
    ["BOOK_CLASS", "BOOK_DOCTOR", "NONE"].indexOf(n.cta) >= 0);
}
function aiMessages(a, w, lang, persona, template) {
  const allowed = allowedNumbers(a, w, lang);
  const data = { workout: { type: w.type, date: w.workout_date, title: WM.title(w, lang), started_at: a.started_at, data_level: a.data_level.level },
    verdict: a.verdict, baseline: a.baseline,
    signals: a.signals.map((x) => ({ id: x.id, detected: x.detected, magnitude: x.magnitude, evidence: x.evidence, reason: x.reason, sentence: x.detected === "insufficient_data" ? null : signalSentence(x, lang) })),
    likely_causes: a.causes.map((c) => ({ key: c.key, name: T(lang, CNAME[c.key]), confidence: c.confidence, support: c.support, sentence: causeSentence(c, a, lang) })),
    factors: a.factors.map((f) => ({ key: f.key, status: f.status, role: f.role, sentence: factorSentence(f, lang) })), checkin: a.checkin,
    reference_text: template };
  const sys = persona + "\n\n" +
    "TUGAS: tulis analisa SATU workout seperti coach yang membaca data. Server SUDAH menghitung sinyal heart rate & pace dan kandidat penyebab (DATA). " +
    "ATURAN KERAS: (1) Pakai HANYA angka yang ada di DATA / ALLOWED_NUMBERS. Jangan menghitung angka baru, jangan menulis rentang normal, studi, atau angka lain. " +
    "(2) Sinyal = tanda umum; penyebab = KEMUNGKINAN dengan tingkat keyakinan di DATA (tinggi/sedang/rendah). Pakai 'kemungkinan', 'sepertinya ikut memengaruhi' / 'likely', 'may have played a part' — JANGAN 'menyebabkan' atau 'pasti'. Jangan menaikkan keyakinan di atas DATA. " +
    "(3) verdict normal/better -> katakan normal/bagus; faktor role 'watch' = 'perlu diperhatikan', bukan penyebab. verdict signals_unclear -> jujur bahwa penyebab belum bisa dipastikan. verdict limited -> JANGAN klaim lebih lambat/cepat/lelah; jelaskan data apa yang kurang. " +
    "(4) Status tidak_ada_data = BELUM DICATAT, bukan kurang. (5) DILARANG menyimpulkan kekurangan zat gizi spesifik (zat besi, vitamin, dll), diagnosis medis, diet ekstrem, dosis suplemen, body shaming. Gaya persona boleh, tanpa sapaan pembuka. " +
    "Balas HANYA JSON (tanpa code fence): {\"headline\":\"1 kalimat untuk kartu\",\"what_we_saw\":[\"1-4 kalimat: sinyal dalam bahasa awam, dengan angka\"],\"likely_why\":[\"0-3 kalimat: kandidat penyebab + bukti + keyakinan\"],\"what_we_cant_tell\":\"1 kalimat jujur tentang batas analisa, atau null\",\"next_session_tips\":[\"2-3 saran konkret\"],\"cta\":\"BOOK_CLASS|BOOK_DOCTOR|NONE\"}. " +
    (lang === "en" ? "LANGUAGE: write everything in natural English." : "BAHASA: tulis semuanya dalam Bahasa Indonesia.");
  const user = "DATA:\n" + JSON.stringify(data).slice(0, 9000) + "\n\nALLOWED_NUMBERS: " + JSON.stringify([...allowed.strs].concat([...allowed.nums].map(String))).slice(0, 3000);
  return { messages: [{ role: "system", content: sys }, { role: "user", content: user }], allowed: allowed };
}
function parseAi(text) {
  const t = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i < 0 || j <= i) return null;
  try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; }
}

// ---------- Rekomendasi sesi berikutnya (deterministik, bisa diterapkan ke Plan Hari Ini) ----------
// Dari hasil analisa: keamanan -> istirahat & dokter (tidak bisa diterapkan); tidur kurang / beban tinggi ->
// recovery; performa turun karena faktor lain -> sesi ringan; lebih baik -> naik sedikit; selain itu -> pertahankan.
// Durasi = durasi workout ini (data user) atau angka di config — tidak dikarang.
function nextSession(a, w, cfg, lang) {
  const typ = WM.typeLabel(w.type, lang), dur = Number(w.duration_min) > 0 ? Math.round(Number(w.duration_min)) : null;
  const bad = (k) => a.factors.some((f) => f.key === k && (f.status === "kurang" || f.status === "berlebih"));
  const cause = (k) => a.causes.some((c) => c.key === k && c.confidence !== "rendah");
  const supported = a.causes.filter((c) => c.confidence !== "rendah" && c.key !== "short_sleep" && c.key !== "high_load").map((c) => T(lang, CNAME[c.key]));
  const mins = (m) => (m ? " " + m + T(lang, { en: " min", id: " menit" }) : "");
  if (a.safety) return { kind: "doctor", implementable: false, intensity: "rest", type: "Rest", duration_min: 0,
    title: T(lang, { en: "Rest and get checked by a doctor first", id: "Istirahat dan periksa ke dokter dulu" }),
    reason: T(lang, { en: "This workout has a safety flag — no training plan until a doctor has checked it.", id: "Workout ini punya tanda keamanan — tidak ada plan latihan sampai diperiksa dokter." }) };
  const tired = cause("short_sleep") || bad("sleep"), loaded = cause("high_load") || bad("load");
  if (tired || loaded || cause("unwell")) {
    const m = cfg.today.template_minutes.recovery;
    return { kind: "recovery", implementable: true, intensity: "low", type: "Recovery", duration_min: m,
      title: T(lang, { en: "Recovery: easy walk or mobility", id: "Recovery: jalan santai atau mobilitas" }) + mins(m),
      reason: cause("unwell") ? T(lang, { en: "You weren't feeling well — keep it light until you feel better.", id: "Badanmu kurang fit — latihan ringan dulu sampai terasa lebih baik." })
        : tired && loaded ? T(lang, { en: "Short sleep and a high training load — let your body recover first.", id: "Tidur kurang dan beban latihan tinggi — beri tubuh waktu pulih dulu." })
        : tired ? T(lang, { en: "Your sleep before this workout was short — go easy next time and sleep enough first.", id: "Tidurmu sebelum workout ini kurang — sesi berikutnya ringan dulu dan cukupi tidur." })
        : T(lang, { en: "Your training load is high — an easy day helps you recover.", id: "Beban latihanmu tinggi — hari ringan membantu pemulihan." }) };
  }
  if (a.verdict === "signals_explained" || a.verdict === "signals_unclear") return { kind: "easy", implementable: true, intensity: "low", type: typ, duration_min: dur,
    title: T(lang, { en: "Easy " + typ.toLowerCase(), id: typ + " santai" }) + mins(dur),
    reason: supported.length ? T(lang, { en: "Signs of fatigue — fix your " + supported.join(", ") + " before pushing again.", id: "Ada tanda kelelahan — perbaiki " + supported.join(", ") + " dulu sebelum menambah beban." })
      : T(lang, { en: "Signs of fatigue with no clear cause yet — keep the next session easy.", id: "Ada tanda kelelahan tanpa penyebab jelas — sesi berikutnya dibuat ringan." }) };
  if (a.verdict === "better") {
    const m = dur ? Math.round(dur * (1 + cfg.next.progress_pct / 100)) : null;
    return { kind: "progress", implementable: true, intensity: "moderate", type: typ, duration_min: m,
      title: T(lang, { en: typ + ", a little longer", id: typ + ", sedikit lebih lama" }) + mins(m),
      reason: T(lang, { en: "More efficient than your usual — you can add about " + cfg.next.progress_pct + "% to the next session.", id: "Lebih efisien dari biasanya — sesi berikutnya bisa ditambah sekitar " + cfg.next.progress_pct + "%." }) };
  }
  return { kind: "maintain", implementable: true, intensity: "moderate", type: typ, duration_min: dur,
    title: T(lang, { en: "Repeat: " + typ.toLowerCase(), id: "Ulangi: " + typ.toLowerCase() }) + mins(dur),
    reason: a.verdict === "limited" ? T(lang, { en: "Keep logging similar sessions (with splits & heart rate) so your progress can be compared.", id: "Terus catat sesi sejenis (dengan splits & heart rate) supaya progresmu bisa dibandingkan." })
      : T(lang, { en: "No signs of fatigue — keep the same load.", id: "Tidak ada tanda kelelahan — pertahankan bebannya." }) };
}

module.exports = { factorSentence, signalSentence, causeSentence, templateNarrative, nextSession, aiMessages, checkNarrative, validShape, parseAi, FNAME };
