/* coach-profiles.js — kartu profil 4 persona AI Coach yang bisa digeser (carousel).
 *
 * SATU SUMBER (CLAUDE.md §2): dipakai /activity (kotak "Kenalan sama coach") dan picker
 * /activity/chat (coach.js). Isi persona = deskripsi coach dari pemilik (spec AI Coach);
 * gaya bicara AI-nya sendiri ada di COACH_PERSONAS (server.js). Foto, lokasi & spesialisasi
 * diambil dari data asli (/api/coaches) — tidak dikarang.
 *
 * Ikon = js/fiticons.js (FIC), bukan emoji.
 * Pakai:  CoachProfiles.box({ active: "nando" })          -> HTML kotak carousel
 *         CoachProfiles.wire(rootEl, function (slug) {...}) -> geser/titik + klik "Chat dengan"
 *         await CoachProfiles.loadRoster();   // foto, lokasi & spesialisasi dari CMS
 * CSS: css/coach-profiles.css
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function Lx(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function ic(n, sz) { return window.FIC ? window.FIC(n, sz || 14) : ""; }   // ikon minimalis (js/fiticons.js)

  // [slug, tagline, warna persona]
  var LIST = [
    ["nando",   { en: "Strict & ambitious",    id: "Tegas & ambisius" },     "#2F6BFF"],
    ["calysta", { en: "Cheerful & friendly",   id: "Ceria & suportif" },     "#EC4899"],
    ["rheza",   { en: "Playful & competitive", id: "Playful & kompetitif" }, "#F59E0B"],
    ["elsen",   { en: "Detail-oriented",       id: "Detail & teknis" },      "#16A34A"],
  ];
  var NAME = { nando: "Ben", calysta: "Angie", rheza: "Stella", elsen: "Tom" };   // slug internal tetap; nama tampil diganti
  var PROFILE = {
    nando: {
      traits: [{ en: "Motivational", id: "Motivational" }, { en: "Strict", id: "Tegas" }, { en: "Ambitious", id: "Ambisius" }, { en: "Detailed", id: "Detail" }],
    },
    calysta: {
      traits: [{ en: "Inspiring", id: "Inspiring" }, { en: "Playful", id: "Playful" }, { en: "Cheerful", id: "Ceria" }, { en: "Friendly", id: "Ramah" }],
    },
    rheza: {
      traits: [{ en: "Playful", id: "Playful" }, { en: "Serious", id: "Serius" }, { en: "Ambitious", id: "Ambisius" }, { en: "Competitive", id: "Kompetitif" }],
    },
    elsen: {
      traits: [{ en: "Detail-oriented", id: "Detail" }, { en: "Professional", id: "Profesional" }, { en: "Friendly", id: "Bersahabat" }],
    },
  };

  var ROSTER = {};   // slug -> {id, venue, photo, speciality} dari roster CMS (baris "Coach <Nama>")
  var _roster = null;

  function color(slug) { for (var i = 0; i < LIST.length; i++) if (LIST[i][0] === slug) return LIST[i][2]; return "#E4002B"; }
  function photo(slug) { return (ROSTER[slug] && ROSTER[slug].photo) || ""; }
  function speciality(slug) { return (ROSTER[slug] && ROSTER[slug].speciality) || ""; }   // spesialisasi olahraga (CMS /api/coaches)
  function tagline(slug) { for (var i = 0; i < LIST.length; i++) if (LIST[i][0] === slug) return Lx(LIST[i][1]); return ""; }

  function loadRoster() {
    if (_roster) return _roster;
    _roster = fetch("/api/coaches").then(function (r) { return r.json(); }).then(function (j) {
      ((j && j.coaches) || []).forEach(function (c) {
        var nm = String(c.name || "").trim().toLowerCase();
        LIST.forEach(function (p) { if (nm === "coach " + (NAME[p[0]] || p[0]).toLowerCase()) ROSTER[p[0]] = { id: c.id, venue: c.venue, photo: c.photo_url || "", speciality: c.speciality || "" }; });
      });
      return ROSTER;
    }).catch(function () { return ROSTER; });
    return _roster;
  }

  function avatar(slug, size) {
    size = size || 72;
    var ph = photo(slug), fs = Math.round(size * 0.4);
    return '<span class="cpa" style="width:' + size + 'px;height:' + size + 'px;--cc:' + color(slug) + '">' +
      '<span class="cpa-i" style="font-size:' + fs + 'px">' + esc((NAME[slug] || "?").charAt(0)) + '</span>' +
      (ph ? '<img src="' + esc(ph) + '" alt="' + esc(NAME[slug] || "") + '" loading="lazy" decoding="async" onerror="this.remove()">' : '') + '</span>';
  }

  function card(c, active) {
    var slug = c[0], pf = PROFILE[slug] || {}, row = ROSTER[slug] || {};
    var venue = row.venue === "gym" ? "20FIT Gym" : (row.venue === "both" ? "20FIT Arena & Gym" : "20FIT Arena");
    return '<div class="cprof' + (active ? ' on' : '') + '" style="--cc:' + c[2] + '">' +
      (active ? '<span class="cprof-badge">' + esc(Lx({ en: "Your coach", id: "Coach kamu" })) + '</span>' : '') +
      '<div class="cprof-top">' + avatar(slug, 76) +
        '<div class="cprof-n">Coach ' + esc(NAME[slug]) + '</div>' +
        '<div class="cprof-tag">' + esc(Lx(c[1])) + '</div>' +
        // Spesialisasi = isian tim di admin-v2 → Coaches (tidak ditebak); kosong -> tidak tampil.
        (row.speciality ? '<div class="cprof-v">' + ic("medal", 13) + ' ' + esc(Lx({ en: "Specialty: ", id: "Spesialisasi: " }) + row.speciality) + '</div>' : '') +
        '<div class="cprof-v">' + ic("pin", 13) + ' ' + esc(venue) + '</div></div>' +
      '<div class="cprof-traits">' + (pf.traits || []).map(function (t) { return '<span>' + esc(Lx(t)) + '</span>'; }).join("") + '</div>' +
      '<button type="button" class="cprof-go" data-pick="' + esc(slug) + '">' + ic("chat", 16) + ' ' + esc(Lx({ en: "Chat with ", id: "Chat dengan " }) + NAME[slug]) + '</button>' +
    '</div>';
  }

  // opts.active = slug coach aktif (ditandai & ditaruh pertama), opts.title = judul kotak.
  function box(opts) {
    opts = opts || {};
    var list = LIST.slice();
    if (opts.active) list.sort(function (a, b) { return (b[0] === opts.active) - (a[0] === opts.active); });
    return '<div class="cprof-box">' +
      '<div class="cprof-hd"><span class="cprof-t">' + esc(opts.title || Lx({ en: "Meet the coaches", id: "Kenalan dulu sama coach-nya" })) + '</span>' +
      '<span class="cprof-nav"><button type="button" data-cp-dir="-1" aria-label="Prev">‹</button><button type="button" data-cp-dir="1" aria-label="Next">›</button></span></div>' +
      '<div class="cprof-track">' + list.map(function (c) { return card(c, c[0] === opts.active); }).join("") + '</div>' +
      '<div class="cprof-dots">' + list.map(function (c, i) { return '<span data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '></span>'; }).join("") + '</div>' +
      '<p class="cprof-note">' + esc(Lx({ en: "Swipe to meet each coach — you can switch anytime.", id: "Geser untuk kenalan tiap coach — bisa ganti kapan aja." })) + '</p>' +
    '</div>';
  }

  // Geser: tombol ‹ › (desktop) + titik; scroll-snap untuk swipe di HP. onPick(slug) saat "Chat dengan".
  function wire(root, onPick) {
    if (!root) return;
    var tr = root.querySelector(".cprof-track"), dots = root.querySelector(".cprof-dots");
    if (!tr) return;
    function step() { var c = tr.querySelector(".cprof"); return c ? c.getBoundingClientRect().width + 12 : 280; }
    Array.prototype.forEach.call(root.querySelectorAll("[data-cp-dir]"), function (b) {
      b.onclick = function () { tr.scrollBy({ left: step() * (+b.getAttribute("data-cp-dir")), behavior: "smooth" }); };
    });
    tr.addEventListener("scroll", function () {
      var i = Math.round(tr.scrollLeft / step());
      Array.prototype.forEach.call(dots.children, function (d, k) { d.className = k === i ? "on" : ""; });
    }, { passive: true });
    Array.prototype.forEach.call(dots.children, function (d) {
      d.onclick = function () { tr.scrollTo({ left: step() * (+d.getAttribute("data-i")), behavior: "smooth" }); };
    });
    Array.prototype.forEach.call(root.querySelectorAll("[data-pick]"), function (b) {
      b.onclick = function () { if (onPick) onPick(b.getAttribute("data-pick")); };
    });
  }

  window.CoachProfiles = { LIST: LIST, NAME: NAME, color: color, photo: photo, speciality: speciality, tagline: tagline, loadRoster: loadRoster, avatar: avatar, box: box, wire: wire };
})();
