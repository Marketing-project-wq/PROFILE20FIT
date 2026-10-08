/* bodymap.js — siluet tubuh anatomis depan+belakang (SVG milik sendiri), otot aktif di-highlight warna brand.
 * Bentuk & koordinat otot diangkat dari komponen BodyMap desain Activity v3 (Nocturne) — siluet dihaluskan
 * (Catmull-Rom → Bézier) lalu dicerminkan, tiap grup otot punya path sendiri. Dipakai di /activity (Minggu ini),
 * /activity/recap, /activity/story, /activity/history/:id.
 *   BodyMap.svg(activeKeys, opts) -> string SVG. activeKeys = array/Set muscle_key kanonik.
 *   BodyMap.focus(activeKeys, lang) -> label ringkas grup otot utama (untuk judul story).
 * muscle_key kanonik: front_delts side_delts rear_delts chest biceps triceps forearms abs obliques
 *   traps lats upper_back lower_back glutes quads hamstrings adductors abductors calves.
 */
(function () {
  // ---- Geometri (dihitung sekali saat load) ----
  // Separuh kiri garis luar tubuh (x<=50); dicerminkan jadi siluet penuh.
  var HALF = [[46,20],[45.8,27],[39,29.5],[31,31],[26.5,33.5],[23.4,38],[22.6,45],[23,53],[22.4,62],[21.2,71],[19.6,80],[19,90],[19.6,98],[18.6,103],[19,109],[21.6,112],[24,109.5],[24.6,103],[24.2,98],[26,90],[28.4,80],[29.6,72],[30.8,63],[31.4,55],[33,49],[35.6,47.5],[36.6,56],[37.2,66],[38.4,78],[38,86],[36.2,93],[34.4,102],[33.8,115],[34.4,128],[36.4,138],[35.8,148],[36,160],[37.4,172],[38.6,182],[36.8,188],[37.2,192],[44.6,192.6],[45,188],[44.6,181],[45.8,168],[46.4,150],[47,138],[48.6,126],[49.4,112],[50,102]];

  function f2(v) { return Math.round(v * 100) / 100; }
  // Catmull-Rom tertutup -> kurva Bézier kubik (path mulus).
  function smooth(pts) {
    var n = pts.length, d = "M" + f2(pts[0][0]) + "," + f2(pts[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      var c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C" + f2(c1x) + "," + f2(c1y) + " " + f2(c2x) + "," + f2(c2y) + " " + f2(p2[0]) + "," + f2(p2[1]);
    }
    return d + " Z";
  }
  // Satu path otot + cerminannya (kiri+kanan tubuh).
  function pair(pts) {
    return smooth(pts) + " " + smooth(pts.map(function (p) { return [100 - p[0], p[1]]; }));
  }
  // Siluet penuh: separuh kiri + separuh kanan (dibalik) = outline tertutup.
  var SIL = (function () {
    var L = HALF.map(function (p) { return p[0] + "," + p[1]; });
    var R = HALF.slice(0, -1).reverse().map(function (p) { return (100 - p[0]) + "," + p[1]; });
    return "M" + L.concat(R).join(" L") + " Z";
  })();

  var FRONT = {
    traps: [[45,26],[39,30],[34,31.5],[41,32],[45.5,29.5]],
    side_delts: [[27,34.5],[24.6,38],[23.8,44],[24.8,48.5],[26.2,46],[25.6,40]],
    front_delts: [[35,31.5],[30,32],[26.8,35.5],[25.6,41],[26.6,47],[29,45],[32,39.5],[35.5,35]],
    chest: [[49.4,33.5],[43.5,33],[37.5,34],[33,37.5],[32,42.5],[34.5,47],[39.5,49.5],[45,49.5],[49.4,48]],
    biceps: [[29.5,47],[26.4,48],[24.8,54],[24.4,61],[25.6,67],[28,67.5],[29.8,62],[30.4,54]],
    forearms: [[25.2,69],[23,73],[21.2,81],[20.6,90],[21.6,97],[23.6,96],[25.8,88],[27.6,78],[28,70.5]],
    obliques: [[38,51],[37,58],[37.6,68],[38.8,77],[40.8,85],[43.8,87],[44,76],[43.4,62],[41.8,52.5]],
    abs: [[49.4,51],[45.2,51.4],[44.4,60],[44.6,73],[45.4,84],[47.4,91],[49.4,92]],
    quads: [[38.6,94],[35.6,102],[34.8,115],[35.8,127],[38.4,135],[42,137.5],[45.2,134],[46.4,124],[46.4,111],[45,101],[42.8,95.5]],
    adductors: [[46.4,100],[45.6,106],[46.6,117],[48.4,124],[49.5,122],[49.6,104],[48.6,99.5]],
    calves: [[37.6,143],[36.6,151],[37,163],[38.8,175],[41.6,177],[43.8,169],[45,155],[44.4,145],[41,141]]
  };
  var BACK = {
    traps: [[50,22],[46,26],[39.5,30],[34.5,32],[40,35.5],[45,43],[49.6,56],[49.6,22.5]],
    rear_delts: [[34.5,32],[29.6,32.4],[26.6,35.6],[25.4,41],[26.4,46.5],[29.6,43],[33,38]],
    side_delts: FRONT.side_delts,
    upper_back: [[44.5,42],[39.5,36.5],[34.5,38],[32.6,43],[34.6,48.5],[39.5,50],[44,48]],
    lats: [[35.2,49],[36.2,57],[37.8,67],[41,77],[45.4,82],[47.4,71],[46.4,58],[44.8,50.5],[39.6,51]],
    lower_back: [[49.4,58],[47.6,62],[46.6,73],[46,83],[47.4,89],[49.4,90]],
    triceps: FRONT.biceps,
    forearms: FRONT.forearms,
    abductors: [[39,86],[36.4,88.5],[35.4,93.5],[36.6,95],[39.4,90]],
    glutes: [[49.4,87.5],[44.6,86],[39.8,89],[36.8,94.5],[37.2,101.5],[40.8,106],[46,106],[49.4,103]],
    hamstrings: [[37.6,108],[35.2,116],[35.6,127],[38,135],[41.6,138],[45,134.5],[46.4,124],[46.4,113],[45.4,107.5],[41,107]],
    calves: [[37.4,142],[36.2,150],[36.8,159],[39,167],[41.6,169],[44,164],[45.2,154],[44.6,145],[41,140.5]]
  };
  // Urutan gambar = urutan desain (lapisan bawah dulu).
  var ORDER_F = ["traps","side_delts","front_delts","chest","biceps","forearms","obliques","abs","quads","adductors","calves"];
  var ORDER_B = ["lats","lower_back","upper_back","traps","side_delts","rear_delts","triceps","forearms","abductors","glutes","hamstrings","calves"];
  var DF = {}, DB = {};
  ORDER_F.forEach(function (k) { DF[k] = pair(FRONT[k]); });
  ORDER_B.forEach(function (k) { DB[k] = pair(BACK[k]); });
  // Garis definisi halus (otot/lekuk) — depan & belakang, dalam ruang 0..100.
  var DETAIL_F = "M44.8,59.5 Q50,60.6 55.2,59.5 M44.6,68 Q50,69.1 55.4,68 M44.9,77 Q50,78 55.1,77 M40.6,104 Q40,118 41.2,132 M59.4,104 Q60,118 58.8,132 M27.4,52 Q27.8,58 27.6,64 M72.6,52 Q72.2,58 72.4,64 M38.6,139 Q41,141.6 43.6,139 M61.4,139 Q59,141.6 56.4,139";
  var DETAIL_B = "M50,23 L50,88 M41,112 Q40.8,122 41.4,134 M59,112 Q59.2,122 58.6,134 M40.8,146 Q40.6,155 41.2,166 M59.2,146 Q59.4,155 58.8,166 M44.2,95 Q47,97 49.4,96 M55.8,95 Q53,97 50.6,96";

  // Lighten hex (#rgb/#rrggbb) ke arah putih; bukan hex -> kembalikan apa adanya (gradien jadi flat).
  function lighten(hex, amt) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return hex;
    var h = m[1]; if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
    return "#" + [r, g, b].map(function (v) { return ("0" + v.toString(16)).slice(-2); }).join("");
  }
  function grad(id, color, amt) {
    return '<radialGradient id="' + id + '" cx="40%" cy="35%" r="75%">' +
      '<stop offset="0%" stop-color="' + lighten(color, amt) + '"/>' +
      '<stop offset="100%" stop-color="' + color + '"/></radialGradient>';
  }
  function figure(muscleDefs, order, detail, state, base, line, ids) {
    var out = '<ellipse cx="50" cy="12" rx="6.6" ry="8.4" fill="' + base + '" stroke="' + line + '" stroke-width="0.5"/>' +
      '<path d="' + SIL + '" fill="' + base + '" stroke="' + line + '" stroke-width="0.6" stroke-linejoin="round"/>' +
      '<g stroke="' + line + '" stroke-width="0.5" stroke-linejoin="round">';
    order.forEach(function (k) {
      var st = state[k];   // "on" | "mid" | "off"
      out += '<path d="' + muscleDefs[k] + '" fill="url(#' + ids[st] + ')"/>';
    });
    out += '</g><path d="' + detail + '" fill="none" stroke="' + line + '" stroke-width="0.45" stroke-linecap="round" opacity="0.8"/>';
    return out;
  }

  // opts: {w,h, sil, on, mid, off, line, label, lang, labels, secondary} — warna bisa dioverride.
  //   sil = warna tubuh dasar; on = otot aktif; mid = otot pendukung (secondary); off = otot tak aktif.
  //   labels=false -> sembunyikan teks DEPAN/BELAKANG.
  function svg(activeKeys, opts) {
    opts = opts || {};
    var active = {}; (activeKeys instanceof Set ? Array.from(activeKeys) : (activeKeys || [])).forEach(function (k) { active[k] = 1; });
    var secondary = {}; (opts.secondary instanceof Set ? Array.from(opts.secondary) : (opts.secondary || [])).forEach(function (k) { if (!active[k]) secondary[k] = 1; });
    var sil = opts.sil || "#3a3d47", on = opts.on || "#E4002B", mid = opts.mid || "#8a2230", off = opts.off || "#394150";
    var line = opts.line || "rgba(120,125,140,0.5)", lab = opts.label || "#9aa3b2";
    var w = opts.w || 210, h = opts.h || 210;
    var en = (opts.lang === "en"), showLab = opts.labels !== false;
    // State per muscle_key.
    var ALL = ["chest","front_delts","side_delts","rear_delts","biceps","triceps","forearms","abs","obliques","traps","lats","upper_back","lower_back","glutes","quads","hamstrings","adductors","abductors","calves"];
    var state = {}; ALL.forEach(function (k) { state[k] = active[k] ? "on" : (secondary[k] ? "mid" : "off"); });
    // Id gradien unik per instance (cegah bentrok kalau ada >1 bodymap di halaman).
    var uid = "bm" + Math.random().toString(36).slice(2, 8);
    var ids = { on: uid + "On", mid: uid + "Mid", off: uid + "Off" };
    var defs = '<defs>' + grad(ids.on, on, 0.35) + grad(ids.mid, mid, 0.3) + grad(ids.off, off, 0.22) + '</defs>';
    var txt = showLab
      ? '<text x="50" y="206" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="' + lab + '">' + (en ? "FRONT" : "DEPAN") + '</text>' +
        '<text x="162" y="206" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="' + lab + '">' + (en ? "BACK" : "BELAKANG") + '</text>'
      : "";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212 212" width="' + w + '" height="' + h + '" preserveAspectRatio="xMidYMid meet">' +
      defs +
      '<g transform="translate(0,0)">' + figure(DF, ORDER_F, DETAIL_F, state, sil, line, ids) + '</g>' +
      '<g transform="translate(112,0)">' + figure(DB, ORDER_B, DETAIL_B, state, sil, line, ids) + '</g>' +
      txt +
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
