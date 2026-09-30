/* coach-profiles.js — kartu profil 4 persona AI Coach yang bisa digeser (carousel).
 *
 * SATU SUMBER (CLAUDE.md §2): dipakai /activity (kotak "Kenalan sama coach") dan picker
 * /activity/chat (coach.js). Isi persona = deskripsi coach dari pemilik (spec AI Coach);
 * gaya bicara AI-nya sendiri ada di COACH_PERSONAS (server.js). Foto, lokasi & kelas terdekat
 * diambil dari data asli (/api/coaches, /api/coaches/:id/classes) — tidak dikarang.
 *
 * Pakai:  CoachProfiles.box({ active: "nando" })          -> HTML kotak carousel
 *         CoachProfiles.wire(rootEl, function (slug) {...}) -> geser/titik + klik "Chat dengan"
 *         await CoachProfiles.loadRoster(); CoachProfiles.loadNext();
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

  // [slug, tagline, warna persona]
  var LIST = [
    ["nando",   { en: "Strict & ambitious",    id: "Tegas & ambisius" },     "#2F6BFF"],
    ["calysta", { en: "Cheerful & friendly",   id: "Ceria & suportif" },     "#EC4899"],
    ["rheza",   { en: "Playful & competitive", id: "Playful & kompetitif" }, "#F59E0B"],
    ["elsen",   { en: "Detail-oriented",       id: "Detail & teknis" },      "#16A34A"],
  ];
  var NAME = { nando: "Nando", calysta: "Calysta", rheza: "Rheza", elsen: "Elsen" };
  var PROFILE = {
    nando: {
      traits: [{ en: "Motivational", id: "Motivational" }, { en: "Strict", id: "Tegas" }, { en: "Ambitious", id: "Ambisius" }, { en: "Detailed", id: "Detail" }],
      style: { en: "Direct, no sugarcoating — like a tough big brother who genuinely cares.", id: "Direct, tanpa basa-basi — kayak abang yang tegas tapi beneran peduli." },
      quote: "Bro, 1x gym minggu ini? That's not a plan, that's a hobby. Let's fix this. 💪",
      fit: { en: "You need a push and clear targets.", id: "Kamu butuh didorong keras & target yang jelas." },
    },
    calysta: {
      traits: [{ en: "Inspiring", id: "Inspiring" }, { en: "Playful", id: "Playful" }, { en: "Cheerful", id: "Ceria" }, { en: "Friendly", id: "Ramah" }],
      style: { en: "Warm and encouraging — says “we”, never “you must”, like a close friend.", id: "Hangat & suportif — pakai “kita”, bukan “kamu harus”, kayak teman dekat." },
      quote: "Hiii! Gak apa-apa kalau slip dikit, yang penting kita mulai lagi yaa ✨",
      fit: { en: "You're starting out or want support without pressure.", id: "Kamu baru mulai atau butuh semangat tanpa tekanan." },
    },
    rheza: {
      traits: [{ en: "Playful", id: "Playful" }, { en: "Serious", id: "Serius" }, { en: "Ambitious", id: "Ambisius" }, { en: "Competitive", id: "Kompetitif" }],
      style: { en: "Casual with jokes, but straight to the point — a competitive gym buddy.", id: "Santai & suka bercanda, tapi langsung ke point — teman gym yang kompetitif." },
      quote: "Challenge: 4x latihan minggu ini. Deal? Kalau gak deal, aku unfollow kamu 😂",
      fit: { en: "You love challenges and a bit of competition.", id: "Kamu suka tantangan & sedikit kompetisi." },
    },
    elsen: {
      traits: [{ en: "Detail-oriented", id: "Detail" }, { en: "Professional", id: "Profesional" }, { en: "Friendly", id: "Bersahabat" }],
      style: { en: "Technical but easy to follow — clear breakdowns, knowledgeable yet humble.", id: "Teknis tapi mudah dipahami — breakdown jelas, paham banget tapi humble." },
      quote: "Dari Visbody kamu, muscle mass 32kg itu bagus. Yang perlu kita improve itu visceral fat-nya — aku breakdown ya.",
      fit: { en: "You like data and detailed explanations.", id: "Kamu suka data & penjelasan detail." },
    },
  };

  var ROSTER = {};   // slug -> {id, venue, photo} dari roster CMS (baris "Coach <Nama>")
  var NEXT = {};     // slug -> kelas terdekat | null (undefined = belum dimuat)
  var _roster = null, _next = null;

  function color(slug) { for (var i = 0; i < LIST.length; i++) if (LIST[i][0] === slug) return LIST[i][2]; return "#E4002B"; }
  function photo(slug) { return (ROSTER[slug] && ROSTER[slug].photo) || ""; }

  function loadRoster() {
    if (_roster) return _roster;
    _roster = fetch("/api/coaches").then(function (r) { return r.json(); }).then(function (j) {
      ((j && j.coaches) || []).forEach(function (c) {
        var nm = String(c.name || "").trim().toLowerCase();
        LIST.forEach(function (p) { if (nm === "coach " + p[0]) ROSTER[p[0]] = { id: c.id, venue: c.venue, photo: c.photo_url || "" }; });
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

  function nextHtml(slug) {
    var n = NEXT[slug];
    if (n === undefined) return '<span class="cprof-mut">' + esc(Lx({ en: "Checking schedule…", id: "Cek jadwal…" })) + '</span>';
    if (!n) return '<span class="cprof-mut">' + esc(Lx({ en: "No upcoming class yet", id: "Belum ada jadwal kelas" })) + '</span>';
    var dt = n.date;
    try { dt = new Date(n.date + "T00:00:00").toLocaleDateString((window.I18N && I18N.lang === "en") ? "en-GB" : "id-ID", { weekday: "short", day: "numeric", month: "short" }); } catch (e) {}
    return '📅 ' + esc(Lx({ en: "Next class: ", id: "Kelas terdekat: " })) + '<b>' + esc(n.name) + '</b> · ' + esc(dt + " " + n.start);
  }
  function paintNext() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-cp-next]"), function (el) { el.innerHTML = nextHtml(el.getAttribute("data-cp-next")); });
  }
  // Kelas terdekat tiap coach (jadwal asli, yang masih bisa dibooking). Sekali per halaman.
  function loadNext() {
    if (!_next) {
      _next = loadRoster().then(function () {
        return Promise.all(LIST.map(function (c) {
          var slug = c[0], row = ROSTER[slug];
          if (!row || !row.id) { NEXT[slug] = null; return null; }
          return fetch("/api/coaches/" + encodeURIComponent(row.id) + "/classes").then(function (r) { return r.json(); })
            .then(function (j) { NEXT[slug] = ((j && j.classes) || []).filter(function (k) { return k.selectable; })[0] || null; })
            .catch(function () { NEXT[slug] = null; });
        }));
      });
    }
    return _next.then(paintNext);
  }

  function card(c, active) {
    var slug = c[0], pf = PROFILE[slug] || {}, row = ROSTER[slug] || {};
    var venue = row.venue === "gym" ? "20FIT Gym" : (row.venue === "both" ? "20FIT Arena & Gym" : "20FIT Arena");
    return '<div class="cprof' + (active ? ' on' : '') + '" style="--cc:' + c[2] + '">' +
      (active ? '<span class="cprof-badge">' + esc(Lx({ en: "Your coach", id: "Coach kamu" })) + '</span>' : '') +
      '<div class="cprof-top">' + avatar(slug, 76) +
        '<div class="cprof-n">Coach ' + esc(NAME[slug]) + '</div>' +
        '<div class="cprof-tag">' + esc(Lx(c[1])) + '</div>' +
        '<div class="cprof-v">📍 ' + esc(venue) + '</div></div>' +
      '<div class="cprof-traits">' + (pf.traits || []).map(function (t) { return '<span>' + esc(Lx(t)) + '</span>'; }).join("") + '</div>' +
      '<div class="cprof-sec"><b>' + esc(Lx({ en: "Coaching style", id: "Gaya ngobrol" })) + '</b>' + esc(Lx(pf.style)) + '</div>' +
      '<div class="cprof-quote">“' + esc(pf.quote || "") + '”</div>' +
      '<div class="cprof-sec"><b>' + esc(Lx({ en: "Great if", id: "Cocok kalau" })) + '</b>' + esc(Lx(pf.fit)) + '</div>' +
      '<div class="cprof-next" data-cp-next="' + esc(slug) + '">' + nextHtml(slug) + '</div>' +
      '<button type="button" class="cprof-go" data-pick="' + esc(slug) + '">💬 ' + esc(Lx({ en: "Chat with ", id: "Chat dengan " }) + NAME[slug]) + '</button>' +
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

  window.CoachProfiles = { LIST: LIST, NAME: NAME, color: color, photo: photo, loadRoster: loadRoster, loadNext: loadNext, avatar: avatar, box: box, wire: wire };
})();
