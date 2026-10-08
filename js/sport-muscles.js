/* sport-muscles.js — peta JENIS workout -> otot utama/pendukung (muscle_key kanonik bodymap.js).
 * Dipakai BodyMap "Minggu ini" di /activity (dan nanti analisa/rekap/story).
 *
 * ⚠️ DRAFT — PERLU DIVALIDASI COACH/FISIOTERAPIS 20FIT. Ini konvensi kebugaran umum
 * ("otot yang dominan dipakai"), BUKAN klaim medis/EMG. "other" & jenis tak dikenal -> kosong
 * (tidak menyalakan apa pun, biar jujur). muscle_key harus cocok dengan bodymap.js.
 *
 * SportMuscles.forType(type) -> { primary:[...], secondary:[...] }
 * SportMuscles.week(items)   -> { active:[...], secondary:[...] }  (union sepekan; primary menang)
 */
(function () {
  "use strict";
  // key = jenis workout (WorkoutMetrics.TYPES). primary = otot dominan, secondary = pendukung.
  var MAP = {
    run:      { primary: ["quads", "hamstrings", "calves", "glutes"], secondary: ["abs", "adductors"] },
    walk:     { primary: ["calves", "quads", "glutes"], secondary: ["hamstrings"] },
    cycling:  { primary: ["quads", "glutes", "calves"], secondary: ["hamstrings", "lower_back"] },
    swimming: { primary: ["lats", "side_delts", "chest", "triceps"], secondary: ["abs", "glutes", "forearms"] },
    gym:      { primary: ["chest", "quads", "lats", "glutes"], secondary: ["biceps", "triceps", "hamstrings", "abs", "side_delts"] },
    hyrox:    { primary: ["quads", "glutes", "hamstrings", "lats", "side_delts"], secondary: ["calves", "abs", "forearms", "lower_back"] },
    hiit:     { primary: ["quads", "glutes", "abs"], secondary: ["calves", "chest", "side_delts", "hamstrings"] },
    padel:    { primary: ["quads", "calves", "forearms", "side_delts"], secondary: ["glutes", "abs", "obliques"] },
    tennis:   { primary: ["quads", "forearms", "side_delts", "obliques"], secondary: ["calves", "glutes", "abs"] },
    other:    { primary: [], secondary: [] }
  };

  function forType(type) {
    var m = MAP[String(type || "").toLowerCase()];
    return m ? { primary: m.primary.slice(), secondary: m.secondary.slice() } : { primary: [], secondary: [] };
  }

  // Union sepekan dari daftar item workout (butuh .type). Otot yang pernah jadi primary
  // tetap "active"; yang hanya muncul sebagai secondary -> "secondary". muscle_keys eksplisit
  // (mis. dari sesi playlist: item.muscle_keys) diperlakukan sebagai primary.
  function week(items) {
    var act = {}, sec = {};
    (items || []).forEach(function (it) {
      if (!it) return;
      var mk = it.muscle_keys;
      if (mk && mk.length) { mk.forEach(function (k) { act[k] = 1; }); return; }
      var m = forType(it.type);
      m.primary.forEach(function (k) { act[k] = 1; });
      m.secondary.forEach(function (k) { if (!act[k]) sec[k] = 1; });
    });
    Object.keys(act).forEach(function (k) { delete sec[k]; });   // primary menang
    return { active: Object.keys(act), secondary: Object.keys(sec) };
  }

  window.SportMuscles = { forType: forType, week: week };
})();
