// lib/workout-narrative.js — teks analisa workout dari hasil lib/workout-analysis.js.
//
// 1) templateNarrative(): narasi DETERMINISTIK (tanpa AI) — dipakai sebagai fallback & kalimat
//    penjelasan per faktor. Semua angka langsung dari hasil analisa.
// 2) aiMessages() + checkNarrative(): narasi coach via AI. AI hanya menerima angka yang sudah
//    dihitung + daftar angka yang BOLEH ditulis; server menolak narasi yang memuat angka lain.
// Bahasa sebab-akibat selalu "kemungkinan ikut memengaruhi", tidak pernah "menyebabkan".
// Gaya = coach yang MEMBACA heart rate & pace; tidak menyuruh user mencatat tidur/makan/minum.
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
      sleep: { en: "No sleep logged for the night before.", id: "Tidak ada catatan tidur malam sebelumnya." },
      nutrition: { en: "No meals logged the day before.", id: "Belum ada catatan makan hari sebelumnya." },
      pre_meal: f.reason === "no_start_time" ? { en: "Workout start time unknown.", id: "Jam mulai latihan tidak diketahui." }
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
// Jenis yang dibaca lewat pace/kecepatan. Lainnya (padel, tennis, gym, …) dibanding lewat HR & rasa berat (RPE).
const PACED = { run: 1, walk: 1, hyrox: 1, cycling: 1 };
// Pola sinyal dalam bahasa awam — dipakai sebagai "dibaca dari" di kartu penyebab.
const SIGSHORT = {
  efficiency_drop: { en: "heart rate higher than usual at the same pace", id: "HR lebih tinggi dari biasanya di pace yang sama" },
  cardiac_drift: { en: "heart rate kept climbing while pace held", id: "HR terus naik padahal pace stabil" },
  late_fade: { en: "pace dropped at the end of a long session", id: "pace turun di akhir sesi panjang" },
  late_fade_short: { en: "pace dropped at the end", id: "pace turun di akhir" },
  hr_suppressed: { en: "heart rate wouldn't climb as high as usual", id: "HR sulit naik setinggi biasanya" },
  zones_high: { en: "more time than usual in zones 4–5", id: "lebih lama dari biasanya di zona 4–5" },
  readiness_low: { en: "recovery numbers below your usual", id: "angka pemulihan di bawah biasanya" },
  hr_high_effort: { en: "heart rate higher than usual for the same effort", id: "HR lebih tinggi dari biasanya untuk usaha yang sama" },
  hr_low_effort: { en: "heart rate wouldn't climb although it felt hard", id: "HR sulit naik padahal terasa berat" },
  rpe_high: { en: "felt much harder than similar sessions", id: "terasa jauh lebih berat dari sesi serupa" },
};
// Bacaan coach dari SATU sesi (tanpa pembanding): intensitas, pemulihan/tidur, bahan bakar.
function readSentences(a, w, lang) {
  const r = a.read || {}, out = [], sg = (id) => a.signals.find((x) => x.id === id);
  const it = r.intensity;
  if (it) {
    const band = { easy: { en: "easy", id: "ringan" }, moderate: { en: "moderate", id: "sedang" }, hard: { en: "hard", id: "berat" } }[it.band];
    const src = it.hr_max_src === "observed" ? T(lang, { en: "your highest recorded", id: "HR maks tertinggi yang pernah tercatat" }) : T(lang, { en: "estimated from your age", id: "perkiraan dari umur" });
    out.push(T(lang, { en: "Effort: " + band.en + " — average heart rate " + it.avg_hr + " bpm, about " + it.pct + "% of your max " + it.hr_max + " bpm (" + src + ").",
      id: "Intensitas: " + band.id + " — HR rata-rata " + it.avg_hr + " bpm, sekitar " + it.pct + "% dari HR maks " + it.hr_max + " bpm (" + src + ")." }));
  }
  const ef = sg("efficiency_drop"), rd = sg("readiness_low"), detected = a.signals.some((x) => x.detected === true);
  if (!detected) {
    if ((ef && ef.detected === false) || (rd && rd.detected === false))
      out.push(T(lang, { en: "Sleep & recovery: heart rate at this pace matched your usual — no sign of short sleep or poor recovery.", id: "Tidur & pemulihan: HR di pace ini sesuai biasanya — tidak ada tanda kurang tidur atau belum pulih." }));
    else out.push(T(lang, { en: "Sleep & recovery: there are no earlier similar sessions to compare yet, so short sleep can't be read from this one session.", id: "Tidur & pemulihan: belum ada sesi sejenis sebelumnya sebagai pembanding, jadi tanda kurang tidur belum terbaca dari satu sesi ini." }));
  }
  const fu = r.fuel, fd = a.signals.find((x) => (x.id === "late_fade" || x.id === "late_fade_short"));
  if (fu && !(fd && fd.detected === true)) {
    if (!fu.relevant) out.push(T(lang, { en: "Fuel: for a " + fu.duration_min + "-minute session, carbohydrate stores are rarely the limiting factor — low fuel is unlikely to have held you back.", id: "Bahan bakar: untuk sesi " + fu.duration_min + " menit, cadangan karbohidrat jarang jadi pembatas — kecil kemungkinan kurang makan menahan performamu." }));
    else if (fd && fd.detected === false) out.push(T(lang, { en: "Fuel: your pace held to the end of a " + fu.duration_min + "-minute session — no sign you ran low on fuel.", id: "Bahan bakar: pace bertahan sampai akhir sesi " + fu.duration_min + " menit — tidak ada tanda kehabisan bahan bakar." }));
    else if (!PACED[w.type]) out.push(T(lang, { en: "Fuel: at " + fu.duration_min + " minutes fuelling starts to matter — eat some carbohydrates a few hours before long sessions.", id: "Bahan bakar: di " + fu.duration_min + " menit bahan bakar mulai berpengaruh — makan karbohidrat beberapa jam sebelum sesi panjang." }));
    else out.push(T(lang, { en: "Fuel: at " + fu.duration_min + " minutes fuelling starts to matter, but without per-km splits a late drop in pace can't be seen.", id: "Bahan bakar: di " + fu.duration_min + " menit bahan bakar mulai berpengaruh, tapi tanpa split per km penurunan pace di akhir belum terlihat." }));
  }
  return out;
}
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
  if (sg.id === "hr_high_effort") {
    const how = e.matched === "rpe" ? T(lang, { en: " at a similar effort (RPE " + e.rpe + ")", id: " di rasa berat serupa (RPE " + e.rpe + ")" }) : T(lang, { en: " in similar-length sessions", id: " di sesi dengan durasi serupa" });
    return sg.detected === true
      ? T(lang, { en: "Average heart rate " + e.hr + " bpm, " + e.diff_bpm + " bpm above your usual " + e.base_hr + " bpm", id: "HR rata-rata " + e.hr + " bpm, " + e.diff_bpm + " bpm di atas biasanya (" + e.base_hr + " bpm)" }) + how + "."
      : T(lang, { en: "Average heart rate " + e.hr + " bpm, close to your usual " + e.base_hr + " bpm", id: "HR rata-rata " + e.hr + " bpm, mirip biasanya (" + e.base_hr + " bpm)" }) + how + ".";
  }
  if (sg.id === "hr_low_effort") return sg.detected === true
    ? T(lang, { en: "It felt hard (RPE " + e.rpe + ") but your average heart rate was " + e.hr + " bpm, " + e.drop_bpm + " bpm below your usual " + e.base_hr + " bpm.", id: "Terasa berat (RPE " + e.rpe + ") tapi HR rata-rata " + e.hr + " bpm, " + e.drop_bpm + " bpm di bawah biasanya (" + e.base_hr + " bpm)." })
    : T(lang, { en: "Heart rate matched how hard it felt (RPE " + e.rpe + ", average " + e.hr + " bpm).", id: "HR sesuai rasa beratnya (RPE " + e.rpe + ", rata-rata " + e.hr + " bpm)." });
  if (sg.id === "rpe_high") return sg.detected === true
    ? T(lang, { en: "You rated it RPE " + e.rpe + " — similar sessions usually feel like " + d1(e.base_rpe, lang) + ".", id: "Kamu menilai RPE " + e.rpe + " — sesi serupa biasanya terasa " + d1(e.base_rpe, lang) + "." })
    : T(lang, { en: "Effort RPE " + e.rpe + ", in line with similar sessions (" + d1(e.base_rpe, lang) + ").", id: "Rasa berat RPE " + e.rpe + ", sesuai sesi serupa (" + d1(e.base_rpe, lang) + ")." });
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
  if (c.key === "unwell" && c.support === "checkin") return T(lang, { en: "You said you weren't feeling well.", id: "Kamu menjawab badan terasa kurang enak." });
  if (c.key === "unwell" && c.support === "weak") return T(lang, { en: "You said you felt tired.", id: "Kamu menjawab badan terasa capek." });
  if (c.key === "pacing" && c.first_pace) return T(lang, { en: "Your first split was " + pace(c.first_pace) + ", faster than your usual " + pace(a.baseline.base) + ".", id: "Split pertamamu " + pace(c.first_pace) + ", lebih cepat dari biasanya (" + pace(a.baseline.base) + ")." });
  return T(lang, { en: "Read from: ", id: "Dibaca dari: " }) + (c.signals || []).map((id) => T(lang, SIGSHORT[id] || { en: id, id: id })).join(T(lang, { en: " and ", id: " dan " })) + ".";
}
function causeSentence(c, a, lang) {
  const tail = { tinggi: { en: "likely played a part", id: "kemungkinan besar ikut berperan" }, sedang: { en: "may have played a part", id: "kemungkinan ikut berperan" },
    rendah: { en: "possible — one of several things that fit this pattern", id: "mungkin — salah satu dari beberapa hal yang cocok dengan pola ini" } }[c.confidence];
  const nm = T(lang, CNAME[c.key]);
  return nm.charAt(0).toUpperCase() + nm.slice(1) + " — " + T(lang, tail) + ". " + causeEvidence(c, a, lang);
}
const TIPS_C = {
  short_sleep: (a, lang) => TIPS.sleep(a.factors.find((f) => f.key === "sleep"), lang),
  low_fuel: (a, lang) => T(lang, { en: "Before longer sessions, have a carb-based meal (rice, bread, oats, banana) a few hours before, and eat enough carbs the day before.", id: "Sebelum sesi panjang, makan berkarbohidrat (nasi, roti, oat, pisang) beberapa jam sebelumnya, dan cukupi karbohidrat sehari sebelumnya." }),
  dehydration: (a, lang) => TIPS.hydration(a.factors.find((f) => f.key === "hydration"), lang) + T(lang, { en: " On long or hot sessions, sip during the workout too.", id: " Di sesi panjang atau panas, minum sedikit-sedikit juga saat latihan." }),
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
  const saw = [], reads = readSentences(a, w, lang);
  if (a.read && a.read.intensity) saw.push(reads.shift());
  if (a.baseline.status !== "not_comparable" && a.baseline.status !== "insufficient") saw.push(perfSentence(a, w, lang));
  det.forEach((x) => saw.push(signalSentence(x, lang)));
  if (!det.length) evl.slice(0, 2).forEach((x) => saw.push(signalSentence(x, lang)));
  if (!saw.length) saw.push(T(lang, { en: title + " logged.", id: title + " tercatat." }));
  const why = a.causes.length ? a.causes.map((c) => causeSentence(c, a, lang)) : reads;
  const top = a.causes.filter((c) => c.confidence !== "rendah").map((c) => c.key);
  const watch = a.factors.filter((f) => f.role === "watch");
  let headline, cant = null;
  if (a.verdict === "signals_explained") headline = T(lang, { en: "Signs of fatigue — " + names(top.slice(0, 2), lang) + " may have played a part.", id: "Ada tanda kelelahan — " + names(top.slice(0, 2), lang) + " kemungkinan ikut berperan." });
  else if (a.verdict === "signals_unclear") headline = a.causes.length
    ? T(lang, { en: "Signs of fatigue — coach's read: possibly " + names([a.causes[0].key], lang) + ", but other causes fit too.", id: "Ada tanda kelelahan — bacaan coach: mungkin " + names([a.causes[0].key], lang) + ", tapi penyebab lain juga cocok." })
    : T(lang, { en: "Signs of fatigue, but the cause isn't clear yet.", id: "Ada tanda kelelahan, tapi penyebabnya belum jelas." });
  else if (a.verdict === "better") headline = T(lang, { en: "More efficient than usual — " + title + ".", id: "Lebih efisien dari biasanya — " + title + "." });
  else if (a.verdict === "normal") headline = T(lang, { en: "No signs of fatigue — this workout looks normal" + (watch.length ? "; keep an eye on your " + watch.map((f) => T(lang, FNAME[f.key])).slice(0, 2).join(", ") + "." : "."), id: "Tidak ada tanda kelelahan — workout ini terlihat normal" + (watch.length ? "; perhatikan " + watch.map((f) => T(lang, FNAME[f.key])).slice(0, 2).join(", ") + "." : ".") });
  else if (a.read && a.read.intensity) {
    const b = { easy: { en: "an easy", id: "ringan" }, moderate: { en: "a moderate", id: "sedang" }, hard: { en: "a hard", id: "berat" } }[a.read.intensity.band];
    headline = T(lang, { en: title + " — " + b.en + " effort (about " + a.read.intensity.pct + "% of max heart rate). No fatigue signs readable from one session yet.", id: title + " — intensitas " + b.id + " (sekitar " + a.read.intensity.pct + "% HR maks). Belum ada tanda kelelahan yang terbaca dari satu sesi." });
  } else headline = T(lang, { en: title + " — this summary has no heart rate, so the coach can't read fatigue signs from it yet.", id: title + " — ringkasan ini tanpa heart rate, jadi coach belum bisa membaca tanda kelelahan." });
  if (a.verdict === "signals_unclear") cant = T(lang, { en: "One workout can't pin the cause down — stress, caffeine, the route, or starting to feel unwell can also play a part.", id: "Satu workout belum bisa memastikan penyebabnya — stres, kafein, rute, atau mulai kurang fit juga bisa berperan." });
  else if (a.verdict === "signals_explained") cant = T(lang, { en: "These are likely contributors, not certainties — things outside your data (stress, caffeine, the route) can also play a part.", id: "Ini kemungkinan, bukan kepastian — hal di luar data (stres, kafein, rute) juga bisa ikut berperan." });
  else if (a.verdict === "limited") {
    const r = a.signals.map((x) => x.reason);
    cant = !PACED[w.type]
      ? T(lang, { en: "Rate how hard each session felt (RPE) — after " + (a.baseline.needed || 3) + " similar sessions the coach can compare your heart rate at the same effort.", id: "Isi rasa berat (RPE) tiap sesi — setelah " + (a.baseline.needed || 3) + " sesi serupa, coach bisa membandingkan HR-mu di usaha yang sama." })
      : a.data_level.level === "basic" && r.indexOf("baseline") < 0
      ? T(lang, { en: "A summary screen alone hides heart rate and pace per km — the Splits screen lets the coach see drift and an end-of-session fade.", id: "Layar ringkasan saja menyembunyikan HR & pace per km — layar Splits membuat coach bisa melihat drift dan penurunan pace di akhir." })
      : T(lang, { en: "The coach compares you with yourself: after " + (a.baseline.needed || 3) + " similar workouts, a higher heart rate at the same pace becomes readable.", id: "Coach membandingkanmu dengan dirimu sendiri: setelah " + (a.baseline.needed || 3) + " workout sejenis, HR yang lebih tinggi di pace yang sama mulai terbaca." });
  } else if (a.data_level.level === "basic" && PACED[w.type]) cant = T(lang, { en: "This analysis uses the summary only — add the Splits screen with heart rate to also check drift and end-of-session fade.", id: "Analisa ini hanya dari ringkasan — tambahkan layar Splits dengan heart rate supaya drift & penurunan pace di akhir juga bisa dicek." });
  const tips = [];
  a.causes.filter((c) => c.confidence !== "rendah").forEach((c) => { if (TIPS_C[c.key]) tips.push(TIPS_C[c.key](a, lang)); });
  watch.sort((x, y) => y.deviation - x.deviation).forEach((f) => { if (tips.length < 3) tips.push(TIPS[f.key](f, lang)); });
  if (tips.length < 3 && a.verdict === "signals_unclear") a.causes.slice(0, 1).forEach((c) => { if (TIPS_C[c.key]) tips.push(TIPS_C[c.key](a, lang)); });
  const band = a.read && a.read.intensity && a.read.intensity.band;
  if (tips.length < 3 && band) tips.push(T(lang, {
    easy: { en: "Easy sessions like this build your base — keep most of your week at this effort.", id: "Sesi ringan seperti ini membangun daya tahan — jadikan sebagian besar latihan mingguanmu di intensitas ini." },
    moderate: PACED[w.type] ? { en: "Repeat this effort — when the same pace feels easier at a lower heart rate, you're getting fitter.", id: "Ulangi intensitas ini — kalau pace yang sama terasa lebih ringan dengan HR lebih rendah, berarti kamu makin fit." }
      : { en: "Repeat this effort — when the same session feels easier at a lower heart rate, you're getting fitter.", id: "Ulangi intensitas ini — kalau sesi serupa terasa lebih ringan dengan HR lebih rendah, berarti kamu makin fit." },
    hard: { en: "After a hard session like this, keep the next one or two easy so your body can recover.", id: "Setelah sesi berat seperti ini, buat satu-dua sesi berikutnya ringan supaya tubuh pulih." } }[band]));
  if (!tips.length) tips.push(T(lang, { en: "Keep your current sleep and eating routine.", id: "Pertahankan pola tidur dan makanmu." }));
  return { headline: headline, what_we_saw: saw.slice(0, 5), likely_why: why, what_we_cant_tell: cant, next_session_tips: Array.from(new Set(tips)).slice(0, 3), source: "template" };
}

function safetyNarrative(a, lang) {
  const em = a.safety.level === "emergency", hr = a.safety.reasons.indexOf("hr_abnormal") >= 0;
  const paras = [];
  if (em) paras.push(T(lang, { en: "Your note mentions a symptom that needs urgent attention. Stop training and seek medical help right away.", id: "Catatanmu menyebut gejala yang perlu ditangani segera. Hentikan latihan dan segera cari pertolongan medis." }));
  else if (a.safety.reasons.indexOf("note_symptom") >= 0) paras.push(T(lang, { en: "Your note mentions pain or discomfort. Stop training until it has been checked by a doctor.", id: "Catatanmu menyebut nyeri atau keluhan. Hentikan latihan dulu sampai diperiksa dokter." }));
  if (hr) paras.push(T(lang, { en: "Your max heart rate reading (" + a.safety.max_hr + " bpm) is unusually high. It may be a sensor error, but if you felt chest pain, dizziness or shortness of breath, consult a doctor before training again.", id: "Detak jantung maksimal yang terbaca (" + a.safety.max_hr + " bpm) tidak wajar. Bisa karena sensor, tapi kalau kamu merasa nyeri dada, pusing, atau sesak, konsultasikan ke dokter sebelum latihan lagi." }));
  paras.push(T(lang, { en: "Performance analysis is paused for this workout. This is not a medical assessment.", id: "Analisa performa untuk workout ini dihentikan dulu. Ini bukan penilaian medis." }));
  return { headline: em ? T(lang, { en: "Stop training and seek medical help.", id: "Hentikan latihan dan cari pertolongan medis." }) : T(lang, { en: "Get this checked by a doctor before your next session.", id: "Periksakan ke dokter sebelum sesi berikutnya." }),
    what_we_saw: paras, likely_why: [], what_we_cant_tell: null, next_session_tips: [], source: "template" };
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
  walk({ b: a.baseline, f: a.factors, s: a.safety, sg: a.signals.map((x) => x.evidence), c: a.causes, ci: a.checkin, r: a.read,
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
// Coach membaca performa, bukan menyuruh mencatat: narasi yang mengajak log tidur/makan/minum/check-in ditolak.
const NAG_RE = /\b(?:log|track|record)(?:ging)?\s+(?:your\s+|all\s+)?(?:sleep|meals?|food|water|drinks?|hydration|everything)|\b(?:try to|remember to|make sure to|don't forget to|please)\s+(?:log|track|record|answer|fill)|\b(?:catat(?:lah)?|mencatat|isi)\s+(?:juga\s+)?(?:tidur|makan|minum|semua|check-?in)|\b(?:coba|jangan lupa|pastikan|yuk)\s+(?:untuk\s+)?(?:catat|mencatat|isi|log)|\banswer the (?:quick )?check-?in|\bisi check-?in/i;
function narrativeText(n) { return [n.headline].concat(n.what_we_saw || [], n.likely_why || [], n.what_we_cant_tell ? [n.what_we_cant_tell] : [], n.next_session_tips || []).join(" "); }
function templateText(a, w, lang) { const t = templateNarrative(a, w, lang); return narrativeText(t); }
function checkNarrative(n, allowed) {
  const txt = narrativeText(n);
  const bad = [];
  const ban = txt.match(BANNED_RE); if (ban) bad.push("banned:" + ban[0]);
  const nag = txt.match(NAG_RE); if (nag) bad.push("nag:" + nag[0]);
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
    (n.what_we_cant_tell == null || typeof n.what_we_cant_tell === "string") && strs(n.next_session_tips || [], 0, 3));
}
function aiMessages(a, w, lang, persona, template) {
  const allowed = allowedNumbers(a, w, lang);
  const data = { workout: { type: w.type, date: w.workout_date, title: WM.title(w, lang), started_at: a.started_at, data_level: a.data_level.level },
    verdict: a.verdict, baseline: a.baseline,
    signals: a.signals.map((x) => ({ id: x.id, detected: x.detected, magnitude: x.magnitude, evidence: x.evidence, reason: x.reason, sentence: x.detected === "insufficient_data" ? null : signalSentence(x, lang) })),
    likely_causes: a.causes.map((c) => ({ key: c.key, name: T(lang, CNAME[c.key]), confidence: c.confidence, support: c.support, sentence: causeSentence(c, a, lang) })),
    coach_reads: readSentences(a, w, lang), session_read: a.read,
    factors: a.factors.filter((f) => f.status !== "tidak_ada_data").map((f) => ({ key: f.key, status: f.status, role: f.role, sentence: factorSentence(f, lang) })), checkin: a.checkin,
    reference_text: template };
  const sys = persona + "\n\n" +
    "TUGAS: tulis analisa SATU workout seperti coach yang membaca data. Server SUDAH menghitung sinyal heart rate & pace dan kandidat penyebab (DATA). " +
    "ATURAN KERAS: (1) Pakai HANYA angka yang ada di DATA / ALLOWED_NUMBERS. Jangan menghitung angka baru, jangan menulis rentang normal, studi, atau angka lain. " +
    "(2) Sinyal = tanda umum; penyebab = KEMUNGKINAN dengan tingkat keyakinan di DATA (tinggi/sedang/rendah). Pakai 'kemungkinan', 'sepertinya ikut memengaruhi' / 'likely', 'may have played a part' — JANGAN 'menyebabkan' atau 'pasti'. Jangan menaikkan keyakinan di atas DATA. " +
    "(3) verdict normal/better -> katakan normal/bagus; faktor role 'watch' = 'perlu diperhatikan', bukan penyebab. verdict signals_unclear -> jujur bahwa penyebab belum bisa dipastikan. verdict limited -> JANGAN klaim lebih lambat/cepat/lelah; jelaskan data apa yang kurang. " +
    "(4) Kamu coach yang MEMBACA heart rate & pace: sebut dugaan paling mungkin dari likely_causes dan coach_reads (tidur/pemulihan, bahan bakar/karbohidrat, cairan, beban latihan) dengan keyakinannya. JANGAN menyuruh/mengingatkan user mencatat atau log tidur, makan, minum, atau mengisi check-in. (5) DILARANG menyimpulkan kekurangan zat gizi spesifik (zat besi, vitamin, dll), diagnosis medis, diet ekstrem, dosis suplemen, body shaming. Gaya persona boleh, tanpa sapaan pembuka. " +
    "Balas HANYA JSON (tanpa code fence): {\"headline\":\"1 kalimat untuk kartu\",\"what_we_saw\":[\"1-4 kalimat: sinyal dalam bahasa awam, dengan angka\"],\"likely_why\":[\"0-3 kalimat: kandidat penyebab + bukti + keyakinan\"],\"what_we_cant_tell\":\"1 kalimat jujur tentang batas analisa, atau null\",\"next_session_tips\":[\"2-3 saran konkret\"]}. " +
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
        : tired && bad("sleep") ? T(lang, { en: "Your sleep before this workout was short — go easy next time and sleep enough first.", id: "Tidurmu sebelum workout ini kurang — sesi berikutnya ringan dulu dan cukupi tidur." })
        : tired ? T(lang, { en: "Your heart rate pattern looks like you hadn't fully recovered (often short sleep) — go easy next time and sleep enough first.", id: "Pola HR-mu seperti belum pulih penuh (sering karena kurang tidur) — sesi berikutnya ringan dulu dan cukupi tidur." })
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
    reason: a.verdict === "limited" ? T(lang, PACED[w.type] ? { en: "Repeat a similar session at the same effort — comparing sessions shows whether your heart rate drops at the same pace as you get fitter.", id: "Ulangi sesi serupa di intensitas yang sama — dari perbandingan sesi terlihat apakah HR-mu turun di pace yang sama seiring makin fit." }
      : { en: "Repeat a similar session and rate how hard it felt — comparing sessions shows whether your heart rate drops at the same effort as you get fitter.", id: "Ulangi sesi serupa dan isi rasa beratnya — dari perbandingan sesi terlihat apakah HR-mu turun di usaha yang sama seiring makin fit." })
      : T(lang, { en: "No signs of fatigue — keep the same load.", id: "Tidak ada tanda kelelahan — pertahankan bebannya." }) };
}

// ---------- Langkah berikutnya (Activity multi-sport Fase 3): 1–3 aksi konkret di SETIAP analisa ----------
// Dari kandidat penyebab & faktor yang ADA datanya (deterministik, angka dari config next_steps — PERLU
// DIVALIDASI). ctx: {next_sport: {en,id} mis. "main padel Kamis" | null, adjusted: {en,id} kalimat plan yang
// sudah diringankan | null}. Ajakan mencatat makan HANYA kalau bahan bakar jadi dugaan yang belum bisa dicek
// (bukan pengingat umum "log semuanya"). Selalu ada minimal 1 langkah (fallback = latihan berikutnya).
function nextSteps(a, w, cfg, lang, ctx) {
  ctx = ctx || {};
  const N = cfg.next_steps, out = [], add = (key, t, cta) => { if (!out.some((x) => x.key === key)) out.push({ key: key, text: T(lang, t), cta: cta || null }); };
  if (a.safety) return [];
  const cause = (k) => a.causes.find((c) => c.key === k);
  const bad = (k) => a.factors.some((f) => f.key === k && f.status === "kurang");
  const over = (k) => a.factors.some((f) => f.key === k && f.status === "berlebih");
  const nxt = ctx.next_sport || { en: "your next session", id: "sesi berikutnya" };
  // Kalimat plan yang sudah diringankan menempel ke langkah tidur/beban; kalau tidak ada, jadi langkah sendiri.
  let adjUsed = !ctx.adjusted;
  const adj = () => { if (adjUsed) return { en: "", id: "" }; adjUsed = true; return { en: " " + ctx.adjusted.en, id: " " + ctx.adjusted.id }; };
  const strong = (k) => { const c = cause(k); return c && c.confidence !== "rendah"; };
  if (strong("short_sleep") || bad("sleep")) { const j = adj(); add("sleep", { en: "Tonight, aim to be asleep before " + N.bedtime + "." + j.en, id: "Malam ini usahakan tidur sebelum jam " + N.bedtime + "." + j.id }); }
  if (strong("high_load") || over("load")) { const j = adj(); add("load", { en: "Keep tomorrow light or rest — your training load is high." + j.en, id: "Besok dibuat ringan atau istirahat — beban latihanmu sedang tinggi." + j.id }); }
  if (strong("low_fuel") || bad("pre_meal") || bad("nutrition")) add("fuel", { en: "Before " + nxt.en + ", eat some carbohydrates " + N.pre_meal_hours + " hours beforehand.", id: "Sebelum " + nxt.id + ", makan karbohidrat " + N.pre_meal_hours + " jam sebelumnya." });
  if (strong("dehydration") || bad("hydration")) add("water", { en: "Drink about " + N.water_before_ml + " ml in the 2 hours before " + nxt.en + ".", id: "Minum sekitar " + N.water_before_ml + " ml dalam 2 jam sebelum " + nxt.id + "." });
  if (strong("heat")) add("heat", { en: "If you play outdoors, pick the morning or evening, or drink more.", id: "Kalau main di luar, pilih pagi/sore atau minum lebih banyak." });
  if (strong("unwell")) add("unwell", { en: "Rest until you feel fit again; if symptoms continue, see a doctor.", id: "Istirahat sampai badan terasa fit; kalau gejala berlanjut, periksa ke dokter." }, "book_doctor");
  const lf = cause("low_fuel");
  if (lf && lf.support === "unknown" && out.length < N.max) add("log_food", { en: "Log what you eat today in Calorie Tracker so the next analysis can check this.", id: "Catat makanmu hari ini di Calorie Tracker agar analisa berikutnya bisa mengecek ini." }, "calorie_tracker");
  if (!adjUsed) out.unshift({ key: "plan", text: T(lang, ctx.adjusted), cta: null });
  if (!out.length) { const nx = nextSession(a, w, cfg, lang); out.push({ key: "next", text: nx.title + (nx.reason ? " — " + nx.reason : ""), cta: null }); }
  return out.slice(0, N.max);
}

module.exports = { factorSentence, signalSentence, causeSentence, readSentences, templateNarrative, nextSession, nextSteps, aiMessages, checkNarrative, validShape, parseAi, FNAME };
