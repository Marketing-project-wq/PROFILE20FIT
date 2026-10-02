// Plan mingguan DI SEKITAR jadwal olahraga user (Activity multi-sport, Fase 2). DETERMINISTIK —
// AI tidak dipakai di sini. Ambang di lib/sport-week-config.js (PERLU DIVALIDASI COACH 20FIT).
//
// Aturan:
//   1. Hari main/latihan olahraga (profil olahraga, play_days) = sesi utama, TIDAK diganti.
//   2. Sehari setelah sesi berat = pemulihan (mobilitas singkat) kalau hari itu tersedia, kalau tidak istirahat.
//   3. Latihan pendukung (dari paket olahraga) di hari tersedia lainnya, tidak menumpuk dua sesi berat
//      berturut-turut; sehari sebelum sesi berat dibuat ringan.
//   4. Batas sesi berat / total sesi / latihan pendukung per level; minimal 1 hari istirahat penuh.
//   5. Mode event: fase dasar -> meningkat -> menjelang event (lebih pendek & ringan).
//
// Hasil = objek plan yang KOMPATIBEL dengan my20fit_workout_plan.plan yang sudah ada:
//   days[] = sesi latihan pendukung & pemulihan (punya exercises; dipakai sesi harian, centang
//   selesai, kartu plan di Activity — label = nama hari supaya "hari ini" tertandai), ditambah
//   week[7] = layout Sen–Min lengkap (main olahraga / latihan / pemulihan / istirahat).
const CFG = require("./sport-week-config");
const SP = require("./sport-packs");

const DAY_LONG = [null, { en: "Monday", id: "Senin" }, { en: "Tuesday", id: "Selasa" }, { en: "Wednesday", id: "Rabu" },
  { en: "Thursday", id: "Kamis" }, { en: "Friday", id: "Jumat" }, { en: "Saturday", id: "Sabtu" }, { en: "Sunday", id: "Minggu" }];
const prev = (d) => (d === 1 ? 7 : d - 1);
const next = (d) => (d === 7 ? 1 : d + 1);
const tx = (o, lang) => (o && (o[lang] || o.id || o.en)) || "";
const round5 = (n) => Math.max(10, Math.round(n / 5) * 5);

// ISO day-of-week (1=Sen … 7=Min) dari "YYYY-MM-DD".
function dowOf(ymd) { const g = new Date(ymd + "T00:00:00Z").getUTCDay(); return g === 0 ? 7 : g; }
function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000); }

function sportName(s) {
  const p = SP.get(s.sport_key);
  if (!p) return { en: s.sport_key, id: s.sport_key };
  return p.other && s.other_label ? { en: s.other_label, id: s.other_label } : p.label;
}

// Fase event. null kalau tak ada event / sudah lewat.
function eventPhase(event, today, mainKey) {
  if (!event || !event.date) return null;
  const left = daysBetween(today, event.date);
  if (left < 0) return { days_left: left, phase: "done" };
  const taper = CFG.event.taper_days[mainKey] != null ? CFG.event.taper_days[mainKey] : CFG.event.taper_days.general;
  if (left <= taper) return { days_left: left, phase: "taper" };
  if (left <= taper + CFG.event.build_weeks * 7) return { days_left: left, phase: "build" };
  return { days_left: left, phase: "base" };
}

// 1) KERANGKA minggu: base = sport | second | support | free. Disimpan di plan supaya "Pindah hari"
//    cukup menukar kerangka lalu menjalankan finalize() lagi.
function skeleton(input) {
  const sports = (input.sports || []).slice().sort((a, b) => a.rank - b.rank);
  const main = sports[0], level = CFG.levels[(main && main.level) || "beginner"] || CFG.levels.beginner;
  const avail = new Set((input.avail_days || []).map(Number).filter((d) => d >= 1 && d <= 7));
  const week = [];
  for (let d = 1; d <= 7; d++) week.push({ dow: d, base: "free", sports: [] });
  sports.forEach((s) => (s.play_days || []).forEach((d) => {
    const w = week[d - 1];
    w.base = "sport";
    w.sports.push({ sport_key: s.sport_key, rank: s.rank, other_label: s.other_label || null });
  }));
  let active = week.filter((w) => w.base === "sport").length;
  const isFree = (d) => week[d - 1].base === "free" && avail.has(d);
  const hardSport = (d) => week[d - 1].base === "sport" && week[d - 1].sports.some((x) => CFG.sport_intensity[x.sport_key] === "hard");
  const restLeft = () => week.filter((w) => w.base === "free").length;

  // Olahraga kedua tanpa hari tetap -> 1 sesi santai di hari tersedia yang tidak menempel sesi berat.
  const second = sports[1];
  const easy = second && !(second.play_days || []).length && CFG.second_easy_session[second.sport_key];
  if (easy && active < level.max_sessions) {
    const d = [1, 2, 3, 4, 5, 6, 7].reverse().find((x) => isFree(x) && !hardSport(prev(x)) && !hardSport(next(x)) && restLeft() > CFG.min_rest_days);
    if (d) { week[d - 1].base = "second"; week[d - 1].sports.push({ sport_key: second.sport_key, rank: 2, other_label: second.other_label || null }); active++; }
  }

  // Latihan pendukung: dua putaran — pertama berjarak (tidak bersebelahan dgn latihan lain), lalu isi sisa.
  let support = 0;
  const canAdd = (d) => isFree(d) && !hardSport(prev(d)) && support < level.max_support && active < level.max_sessions && restLeft() > CFG.min_rest_days;
  const order = [1, 2, 3, 4, 5, 6, 7];
  [true, false].forEach((spaced) => order.forEach((d) => {
    if (!canAdd(d)) return;
    if (spaced && (week[prev(d) - 1].base === "support" || week[next(d) - 1].base === "support")) return;
    week[d - 1].base = "support"; support++; active++;
  }));
  return week;
}

// Pilih latihan dari exercise library coach untuk kategori latihan pendukung.
function pickExercises(cats, ctx, n, conservative) {
  const loc = ctx.location || "home", used = {}, out = [];
  const exCats = [];
  cats.forEach((c) => (CFG.training_to_exlib[c] || []).forEach((x) => { if (exCats.indexOf(x) < 0) exCats.push(x); }));
  const pool = ctx.exlib.filter((e) => e.loc.indexOf(loc) >= 0 && (!conservative || e.impact === "low"));
  for (let round = 0; out.length < n && round < 3; round++) {
    exCats.forEach((c) => {
      if (out.length >= n) return;
      const e = pool.find((x) => x.cat === c && !used[x.key]);
      if (e) { used[e.key] = 1; out.push(e); }
    });
  }
  return out;
}
function exRows(list, vol, lang) {
  return list.map((e) => ({ key: e.key, name: tx(e.name, lang), sets: vol.sets,
    reps: e.unit === "sec" ? vol.sec : (e.unit === "min" ? vol.min : vol.reps), unit: e.unit, rest_sec: vol.rest, note: "", progression: "" }));
}

// 2) FINALIZE: terapkan aturan berat/ringan, fase event, judul, latihan, dan days[] kompatibel.
function finalize(week, input, ctx) {
  const lang = ctx.lang === "en" ? "en" : "id";
  const sports = (input.sports || []).slice().sort((a, b) => a.rank - b.rank);
  const main = sports[0] || { sport_key: "general", rank: 1 };
  const lvKey = CFG.levels[main.level] ? main.level : "beginner", level = CFG.levels[lvKey];
  const vol = ctx.vol[level.vol] || ctx.vol.beginner;
  const avail = new Set((input.avail_days || []).map(Number));
  const minutes = Math.max(15, Math.min(90, parseInt(input.minutes, 10) || 30));
  const ev = eventPhase(input.event, input.today, main.sport_key);
  const phase = ev && ev.phase !== "done" ? ev.phase : null;
  const warnings = [];

  const isHardSport = (w) => w.base === "sport" && w.sports.some((x) => CFG.sport_intensity[x.sport_key] === "hard");
  const hardSports = week.filter(isHardSport).length;
  const overHard = hardSports > level.max_hard;
  if (overHard) warnings.push({ en: "You already play " + hardSports + " hard sessions a week — extra training is kept light.",
    id: "Kamu sudah main " + hardSports + " sesi berat seminggu — latihan tambahan dibuat ringan." });
  week.forEach((w) => {
    if (isHardSport(w) && isHardSport(week[next(w.dow) - 1])) {
      warnings.push({ en: DAY_LONG[w.dow].en + " and " + DAY_LONG[next(w.dow)].en + " are both hard sessions — listen to your body.",
        id: DAY_LONG[w.dow].id + " dan " + DAY_LONG[next(w.dow)].id + " sama-sama sesi berat — dengarkan tubuhmu." });
    }
  });
  if (!sports.some((s) => (s.play_days || []).length)) warnings.push({ en: "Add the days you usually play in your profile so the plan can build around them.",
    id: "Isi hari biasa kamu main di profil supaya plan bisa disusun di sekitarnya." });

  // Kategori latihan pendukung bergiliran: utama dulu, lalu olahraga kedua (tanpa dobel).
  const cats = [];
  sports.forEach((s) => { const p = SP.get(s.sport_key); (p ? p.supporting_training : []).forEach((c) => { if (cats.indexOf(c) < 0) cats.push(c); }); });
  let ci = 0;
  const nextCats = () => { const a = cats[ci % cats.length], b = cats[(ci + 1) % cats.length]; ci += 2; return a === b ? [a] : [a, b]; };

  const out = week.map((w) => {
    const prevHard = isHardSport(week[prev(w.dow) - 1]), nextHard = isHardSport(week[next(w.dow) - 1]);
    const e = { dow: w.dow, base: w.base, sports: w.sports, kind: "rest", intensity: null, minutes: null, training: [],
      title: { en: "Rest", id: "Istirahat" }, note: null, day_key: null };
    if (w.base === "sport") {
      e.kind = "sport"; e.intensity = isHardSport(w) ? "hard" : "moderate";
      e.title = {
        en: w.sports.map((x) => sportName(x).en + (x.rank === 1 ? "" : " (2nd sport)")).join(" + "),
        id: w.sports.map((x) => sportName(x).id + (x.rank === 1 ? "" : " (olahraga kedua)")).join(" + "),
      };
    } else if (w.base === "second") {
      const x = w.sports[0], es = CFG.second_easy_session[x.sport_key];
      e.kind = "sport"; e.intensity = "easy"; e.minutes = es.minutes;
      e.title = { en: es.title.en + " (2nd sport)", id: es.title.id + " (olahraga kedua)" };
    } else if (w.base === "support" && prevHard) {
      // Setelah pindah hari, latihan bisa jatuh sehari setelah sesi berat -> jadi pemulihan.
      e.kind = "recovery";
    } else if (w.base === "support") {
      e.kind = "support";
      e.intensity = overHard || (CFG.easy_before_hard && nextHard) || phase === "taper" ? "easy" : "moderate";
      let m = minutes;
      if (phase === "build") m = round5(m * CFG.event.build_minutes_factor);
      if (phase === "taper") m = round5(m * CFG.event.taper_minutes_factor);
      e.minutes = m;
      e.training = e.intensity === "easy" ? ["core_stability", "hip_mobility"].filter((c) => cats.indexOf(c) >= 0).slice(0, 2) : nextCats();
      if (!e.training.length) e.training = nextCats();
      e.title = { en: e.training.map((c) => SP.TRAINING[c].en).join(" + "), id: e.training.map((c) => SP.TRAINING[c].id).join(" + ") };
      if (e.intensity === "easy") e.note = phase === "taper" ? { en: "Kept light — your event is close.", id: "Dibuat ringan — event-mu sudah dekat." }
        : { en: "Kept light — a hard session follows.", id: "Dibuat ringan — besok sesi berat." };
    } else if (w.base === "free" && prevHard && avail.has(w.dow)) {
      e.kind = "recovery";
    }
    if (e.kind === "recovery") {
      e.intensity = "easy"; e.minutes = CFG.recovery_minutes; e.training = ["hip_mobility", "shoulder_mobility"];
      e.title = { en: "Recovery · mobility", id: "Pemulihan · mobilitas" };
      e.note = { en: "The day after a hard session.", id: "Sehari setelah sesi berat." };
    }
    return e;
  });
  // Minimal hari istirahat penuh: pemulihan (dari belakang minggu) diubah jadi istirahat.
  let rests = out.filter((e) => e.kind === "rest").length;
  for (let i = out.length - 1; i >= 0 && rests < CFG.min_rest_days; i--) {
    if (out[i].kind !== "recovery") continue;
    Object.assign(out[i], { kind: "rest", intensity: null, minutes: null, training: [], title: { en: "Rest", id: "Istirahat" },
      note: { en: "Full rest after a hard session.", id: "Istirahat penuh setelah sesi berat." } });
    rests++;
  }
  if (!out.some((e) => e.kind === "rest")) warnings.push({ en: "No full rest day this week — consider one.", id: "Minggu ini tanpa hari istirahat penuh — sebaiknya sisakan satu." });

  // days[] (kompatibel plan lama): hanya hari dengan latihan yang bisa dipandu.
  const conservative = !!ctx.conservative;
  const days = [];
  out.forEach((e) => {
    if (e.kind !== "support" && e.kind !== "recovery") return;
    const n = e.kind === "recovery" ? 3 : (e.minutes >= 45 ? 5 : (e.minutes >= 30 ? 4 : 3));
    const easyVol = Object.assign({}, ctx.vol.beginner);
    const list = pickExercises(e.kind === "recovery" ? ["hip_mobility", "core_stability"] : e.training, ctx, n, conservative || e.intensity === "easy");
    if (!list.length) return;
    e.day_key = "w" + e.dow;
    days.push({ key: e.day_key, label: tx(DAY_LONG[e.dow], lang), focus: tx(e.title, lang), duration_min: e.minutes,
      exercises: exRows(list, e.intensity === "easy" ? easyVol : vol, lang) });
  });

  const names = sports.map((s) => tx(sportName(s), lang));
  const active = out.filter((e) => e.kind === "sport" || e.kind === "support").length;
  return {
    kind: "sport_week",
    plan_name: (lang === "en" ? "Weekly plan · " : "Plan mingguan · ") + names.join(" + "),
    level: level.vol, goal: main.goal || null, location: ctx.location || "home",
    days_per_week: active, minutes_per_session: minutes,
    weekly_note: lang === "en"
      ? active + " active days, built around your " + names.join(" & ") + " schedule."
      : active + " hari aktif, disusun di sekitar jadwal " + names.join(" & ") + " kamu.",
    week: out,
    days: days,
    event: input.event ? Object.assign({}, input.event, ev || {}) : null,
    warnings: warnings,
    sport_context: { sports: sports, avail_days: Array.from(avail).sort(), minutes: minutes, location: ctx.location || "home",
      sports_updated_at: input.sports_updated_at || null },
    disclaimer: lang === "en"
      ? "Built by rules from your sport schedule — not medical advice. Values still need validation by 20FIT coaches."
      : "Disusun otomatis dari jadwal olahragamu — bukan nasihat medis. Angka & aturannya masih perlu divalidasi coach 20FIT.",
  };
}

function build(input, ctx) { return finalize(skeleton(input), input, ctx); }

// Pindah hari: tukar kerangka dua hari lalu susun ulang dengan aturan yang sama.
function move(plan, fromDow, toDow, input, ctx) {
  const week = (plan.week || []).map((e) => ({ dow: e.dow, base: e.base, sports: e.sports || [] }));
  const a = week[fromDow - 1], b = week[toDow - 1];
  if (!a || !b || fromDow === toDow) return null;
  week[fromDow - 1] = { dow: fromDow, base: b.base, sports: b.sports };
  week[toDow - 1] = { dow: toDow, base: a.base, sports: a.sports };
  return finalize(week, input, ctx);
}

module.exports = { build, move, dowOf };
