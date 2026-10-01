// workout-metrics.js — SATU sumber format & aturan data workout, dipakai browser (window.WorkoutMetrics)
// DAN server (require). Judul kartu dibuat dari ANGKA workout (bukan deskripsi AI), pace dihitung
// dari data yang ada, dan tanggal hasil baca screenshot divalidasi sebelum dipakai.
(function (root) {
  "use strict";

  // Jenis workout app (nilai disimpan di my20fit_workout.type). Label ID/EN.
  var TYPES = {
    run: { en: "Run", id: "Lari" },
    cycling: { en: "Ride", id: "Bersepeda" },
    walk: { en: "Walk", id: "Jalan kaki" },
    swimming: { en: "Swim", id: "Renang" },
    gym: { en: "Strength", id: "Latihan beban" },
    hyrox: { en: "HYROX", id: "HYROX" },
    hiit: { en: "HIIT", id: "HIIT" },
    other: { en: "Workout", id: "Workout" },
  };
  // Jenis yang wajar diukur pakai pace (menit/km); sepeda pakai kecepatan (km/jam).
  var PACE_TYPES = { run: 1, walk: 1, hyrox: 1 };
  var SPEED_TYPES = { cycling: 1 };

  function lbl(o, lang) { return (o && (lang === "en" ? o.en : o.id)) || ""; }
  function typeLabel(t, lang) { return lbl(TYPES[t] || TYPES.other, lang); }
  function num(v) { var n = Number(v); return (v != null && v !== "" && isFinite(n)) ? n : null; }
  function dec(n, digits, lang) {
    var s = (Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits)).toFixed(digits).replace(/\.?0+$/, "");
    return lang === "en" ? s : s.replace(".", ",");
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  // 35.17 menit -> "35:10"; 65.3 -> "1:05:18"
  function fmtDuration(min) {
    var m = num(min); if (m == null || m <= 0) return null;
    var s = Math.round(m * 60), h = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return h ? h + ":" + pad(mm) + ":" + pad(ss) : mm + ":" + pad(ss);
  }
  // Detik per km: dari tracker kalau ada, kalau tidak dihitung dari durasi & jarak (keduanya angka asli).
  function paceSec(w) {
    var p = w && w.pace_data && num(w.pace_data.avg_sec_per_km);
    if (p && p > 60 && p < 3600) return Math.round(p);
    var d = num(w && w.distance_km), m = num(w && w.duration_min);
    if (d && m && d > 0.05) { var s = Math.round(m * 60 / d); if (s > 60 && s < 3600) return s; }
    return null;
  }
  function fmtPace(sec) { if (!sec) return null; return Math.floor(sec / 60) + ":" + pad(Math.round(sec % 60)) + "/km"; }
  function speedKmh(w) {
    var raw = w && w.raw_data && w.raw_data.metrics && num(w.raw_data.metrics.avg_speed_kmh);
    if (raw && raw > 0 && raw < 120) return Math.round(raw * 10) / 10;
    var d = num(w && w.distance_km), m = num(w && w.duration_min);
    return (d && m) ? Math.round(d / (m / 60) * 10) / 10 : null;
  }
  // "Lari 5,2 km · 35:10 · 6:45/km" — hanya bagian yang datanya ada.
  function title(w, lang) {
    var parts = [typeLabel(w && w.type, lang)];
    var d = num(w && w.distance_km); if (d) parts[0] += " " + dec(d, 2, lang) + " km";
    var dur = fmtDuration(w && w.duration_min); if (dur) parts.push(dur);
    if (PACE_TYPES[w && w.type] && d) { var p = fmtPace(paceSec(w)); if (p) parts.push(p); }
    else if (SPEED_TYPES[w && w.type] && d) { var sp = speedKmh(w); if (sp) parts.push(dec(sp, 1, lang) + " km/h"); }
    return parts.join(" · ");
  }

  // ---- Tanggal hasil baca screenshot ----
  // read  : "YYYY-MM-DD" dari AI (boleh null). yearVisible=false -> tahun ditebak AI, jangan dipercaya.
  // today : "YYYY-MM-DD" (hari ini, zona app). maxDays: lebih tua dari ini -> minta konfirmasi.
  // Hasil: {date, needs_confirm, reason: null|"unread"|"future"|"old"|"year_guess", read}
  function ymdOf(d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function parseYmd(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); if (!m) return null; var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return isNaN(d) || ymdOf(d) !== m[0] ? null : d; }
  function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 864e5); }
  // Bulan & tanggal yang sama, tahun terdekat yang TIDAK di masa depan.
  function nearestPast(read, today) {
    var r = parseYmd(read), t = parseYmd(today); if (!r || !t) return today;
    var y = t.getUTCFullYear(), cand = new Date(Date.UTC(y, r.getUTCMonth(), r.getUTCDate()));
    if (cand > t) cand = new Date(Date.UTC(y - 1, r.getUTCMonth(), r.getUTCDate()));
    return ymdOf(cand);
  }
  function resolveDate(o) {
    var today = o.today, maxDays = o.maxDays == null ? 3 : o.maxDays, read = parseYmd(o.read) ? o.read : null;
    if (!read) return { date: o.fallback || today, needs_confirm: true, reason: "unread", read: null };
    if (o.yearVisible === false) {
      var g = nearestPast(read, today);
      return { date: g, needs_confirm: daysBetween(g, today) > maxDays, reason: daysBetween(g, today) > maxDays ? "year_guess" : null, read: read };
    }
    if (read > today) return { date: nearestPast(read, today), needs_confirm: true, reason: "future", read: read };
    var age = daysBetween(read, today);
    if (age > 300) return { date: nearestPast(read, today), needs_confirm: true, reason: "year_guess", read: read };
    if (age > maxDays) return { date: read, needs_confirm: true, reason: "old", read: read };
    return { date: read, needs_confirm: false, reason: null, read: read };
  }

  // Teks tanggal tanpa tahun dari screenshot ("Oct 5", "5 Okt", "October 5th", "Today", "Kemarin") -> YYYY-MM-DD
  // terdekat yang tidak di masa depan. Tidak terbaca -> null.
  var MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5, jul: 6, aug: 7, agu: 7, agt: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11 };
  function parseDateText(text, today) {
    var t = String(text || "").toLowerCase().trim(), td = parseYmd(today); if (!t || !td) return null;
    if (/^(today|hari ini)\b/.test(t)) return today;
    if (/^(yesterday|kemarin)\b/.test(t)) { td.setUTCDate(td.getUTCDate() - 1); return ymdOf(td); }
    var m = /([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?/.exec(t), day, mon;
    if (m && MON[m[1]] != null) { mon = MON[m[1]]; day = +m[2]; }
    else { m = /(\d{1,2})\s+([a-z]{3})/.exec(t); if (m && MON[m[2]] != null) { mon = MON[m[2]]; day = +m[1]; } }
    if (mon == null || !(day >= 1 && day <= 31)) return null;
    return nearestPast(td.getUTCFullYear() + "-" + pad(mon + 1) + "-" + pad(day), today);
  }

  var api = { TYPES: TYPES, parseDateText: parseDateText, typeLabel: typeLabel, fmtDuration: fmtDuration, paceSec: paceSec, fmtPace: fmtPace,
    speedKmh: speedKmh, title: title, resolveDate: resolveDate, daysBetween: daysBetween, dec: dec };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkoutMetrics = api;
})(typeof window !== "undefined" ? window : this);
