/* bodymap.js — siluet tubuh depan+belakang (SVG milik sendiri), otot aktif di-highlight warna brand.
 * Dipakai Story Card (Fase 7) & bisa dipakai Body Status (Fase 3 #1).
 * BodyMap.svg(activeKeys, opts) -> string SVG. activeKeys = array/Set muscle_key kanonik.
 * BodyMap.focus(activeKeys) -> label ringkas grup otot utama (untuk judul story).
 */
(function () {
  "use strict";
  // Shape otot relatif ke pusat figur (dx, y, rx, ry). y absolut dalam tinggi figur ~400.
  var MUS_FRONT = [
    { k: ["front_delts", "side_delts"], e: [[-40, 84, 13, 12], [40, 84, 13, 12]] },
    { k: ["chest"], e: [[-16, 102, 15, 13], [16, 102, 15, 13]] },
    { k: ["biceps"], e: [[-54, 122, 8, 20], [54, 122, 8, 20]] },
    { k: ["forearms"], e: [[-55, 182, 7, 22], [55, 182, 7, 22]] },
    { k: ["abs"], e: [[0, 138, 13, 24]] },
    { k: ["obliques"], e: [[-19, 142, 6, 18], [19, 142, 6, 18]] },
    { k: ["quads"], e: [[-16, 252, 12, 40], [16, 252, 12, 40]] },
    { k: ["adductors"], e: [[-7, 256, 5, 30], [7, 256, 5, 30]] },
    { k: ["calves"], e: [[-16, 352, 9, 26], [16, 352, 9, 26]] }
  ];
  var MUS_BACK = [
    { k: ["traps"], e: [[0, 84, 22, 13]] },
    { k: ["rear_delts", "side_delts"], e: [[-40, 88, 12, 11], [40, 88, 12, 11]] },
    { k: ["upper_back"], e: [[0, 110, 18, 13]] },
    { k: ["lats"], e: [[-19, 130, 13, 26], [19, 130, 13, 26]] },
    { k: ["triceps"], e: [[-54, 122, 8, 20], [54, 122, 8, 20]] },
    { k: ["lower_back"], e: [[0, 164, 15, 14]] },
    { k: ["glutes"], e: [[-15, 206, 15, 15], [15, 206, 15, 15]] },
    { k: ["abductors"], e: [[-31, 202, 7, 13], [31, 202, 7, 13]] },
    { k: ["hamstrings"], e: [[-16, 256, 12, 40], [16, 256, 12, 40]] },
    { k: ["calves"], e: [[-16, 352, 9, 26], [16, 352, 9, 26]] }
  ];
  function silhouette(cx, sil) {
    return (
      '<circle cx="' + cx + '" cy="42" r="21" fill="' + sil + '"/>' +
      '<rect x="' + (cx - 8) + '" y="56" width="16" height="16" rx="6" fill="' + sil + '"/>' +
      '<rect x="' + (cx - 39) + '" y="66" width="78" height="112" rx="24" fill="' + sil + '"/>' +
      '<rect x="' + (cx - 35) + '" y="168" width="70" height="44" rx="18" fill="' + sil + '"/>' +
      '<rect x="' + (cx - 58) + '" y="74" width="19" height="140" rx="9" fill="' + sil + '"/>' +
      '<rect x="' + (cx + 39) + '" y="74" width="19" height="140" rx="9" fill="' + sil + '"/>' +
      '<rect x="' + (cx - 31) + '" y="202" width="27" height="188" rx="13" fill="' + sil + '"/>' +
      '<rect x="' + (cx + 4) + '" y="202" width="27" height="188" rx="13" fill="' + sil + '"/>'
    );
  }
  function muscles(cx, defs, active, on, off) {
    var out = "";
    defs.forEach(function (d) {
      var lit = d.k.some(function (k) { return active[k]; });
      d.e.forEach(function (e) {
        out += '<ellipse cx="' + (cx + e[0]) + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '" fill="' + (lit ? on : off) + '"' + (lit ? ' opacity="0.95"' : '') + '/>';
      });
    });
    return out;
  }
  function label(cx, y, text, color) {
    return '<text x="' + cx + '" y="' + y + '" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="15" font-weight="800" letter-spacing="1" fill="' + color + '">' + text + '</text>';
  }
  // opts: {w,h, sil, on, off, label, dark} — warna bisa dioverride (default tema gelap story).
  function svg(activeKeys, opts) {
    opts = opts || {};
    var active = {}; (activeKeys instanceof Set ? Array.from(activeKeys) : (activeKeys || [])).forEach(function (k) { active[k] = 1; });
    var sil = opts.sil || "#2b313d", on = opts.on || "#E4002B", off = opts.off || "#394150", lab = opts.label || "#9aa3b2";
    var w = opts.w || 400, h = opts.h || 440, fL = 100, fR = 300;
    var en = (opts.lang === "en");
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="' + w + '" height="' + h + '">' +
      silhouette(fL, sil) + muscles(fL, MUS_FRONT, active, on, off) +
      silhouette(fR, sil) + muscles(fR, MUS_BACK, active, on, off) +
      label(fL, 420, en ? "FRONT" : "DEPAN", lab) + label(fR, 420, en ? "BACK" : "BELAKANG", lab) +
      '</svg>';
  }
  // Grup otot utama untuk judul story (dari muscle_key -> grup ringkas).
  var GROUP = {
    chest: { en: "Chest", id: "Dada" }, front_delts: { en: "Shoulders", id: "Bahu" }, side_delts: { en: "Shoulders", id: "Bahu" }, rear_delts: { en: "Shoulders", id: "Bahu" },
    biceps: { en: "Arms", id: "Lengan" }, triceps: { en: "Arms", id: "Lengan" }, forearms: { en: "Arms", id: "Lengan" },
    abs: { en: "Core", id: "Core" }, obliques: { en: "Core", id: "Core" },
    traps: { en: "Back", id: "Punggung" }, lats: { en: "Back", id: "Punggung" }, upper_back: { en: "Back", id: "Punggung" }, lower_back: { en: "Back", id: "Punggung" },
    glutes: { en: "Glutes", id: "Bokong" }, quads: { en: "Legs", id: "Kaki" }, hamstrings: { en: "Legs", id: "Kaki" }, adductors: { en: "Legs", id: "Kaki" }, abductors: { en: "Legs", id: "Kaki" }, calves: { en: "Legs", id: "Kaki" }
  };
  function focus(activeKeys, lang) {
    var seen = {}, order = [];
    (activeKeys instanceof Set ? Array.from(activeKeys) : (activeKeys || [])).forEach(function (k) {
      var g = GROUP[k]; if (!g) return; var lbl = (lang === "en") ? g.en : g.id; if (!seen[lbl]) { seen[lbl] = 1; order.push(lbl); }
    });
    return order.slice(0, 3).join(" · ");
  }
  window.BodyMap = { svg: svg, focus: focus };
})();
