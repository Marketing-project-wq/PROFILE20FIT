/* universal-nav.js — Bar navigasi ekosistem 20FIT (app switcher + profil).
 *
 * Satu berkas, tanpa dependensi, tanpa framework (CLAUDE.md §5). Menyuntik CSS + DOM-nya
 * sendiri. Bisa disalin apa adanya ke subdomain 20FIT lain — tidak mengandaikan React,
 * tidak mengandaikan bundler.
 *
 * NAVIGASI PAKAI SSO: kalau js/auth.js ada, memakai Auth.ssoTo() supaya sesi ikut terbawa
 * dan user tidak diminta login lagi. Kalau tidak ada (subdomain yang belum memasang
 * auth.js), jatuh ke navigasi biasa — user login di tujuan. Jadi berkas ini aman dipasang
 * lebih dulu sebelum SSO-nya siap di sana.
 *
 * IKON: SEMUA path diambil VERBATIM dari ikon vektor yang sudah dipakai app ini
 * (dashboard.html, js/nav.js, js/tour.js) — bukan ditulis ulang, bukan emoji.
 *
 * DUA CARA PAKAI:
 *  1. Bar sendiri (default, untuk subdomain lain):
 *       <script src="js/universal-nav.js" defer></script>
 *  2. TANPA bar — grid produknya ditempel ke menu yang sudah ada di halaman:
 *       <script src="js/universal-nav.js" data-no-bar defer></script>
 *       ... lalu: UniversalNav.renderAppsInto(elemen)
 *     Dipakai dashboard.html: halaman itu SUDAH punya menu di samping toggle EN/ID,
 *     jadi menambah bar hitam di atasnya = dua menu produk (langgar CLAUDE.md §2).
 */
(function () {
  "use strict";

  var SELF = document.currentScript;
  var NO_BAR = !!(SELF && SELF.hasAttribute("data-no-bar"));

  // IKON: SEMUANYA diambil VERBATIM dari ikon vektor yang SUDAH dipakai app ini
  // (dashboard.html TICON & js/nav.js ICON) — bukan ditulis ulang, bukan emoji.
  // Komentar tiap baris menyebut asal & nama kuncinya supaya mudah dilacak.
  //
  // CATATAN: berkas *.svg di root repo (Menu Food.svg, Footer Home.svg, dst) SENGAJA
  // TIDAK dipakai. Isinya bukan vektor — gambar raster base64 dibungkus <svg>
  // (diukur: 1–2,6 MB per berkas, path vektornya cuma 231–353 karakter untuk bingkai).
  // Sepuluh di antaranya = ~15 MB untuk tile 28px, dan tak bisa ikut warna/tema.
  var P = {
    home    : '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',   // dashboard.html :: home
    my20fit : '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',   // js/nav.js :: profile
    recipe  : '<path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2"/><path d="M5 2v20"/><path d="M21 15V2a5 5 0 0 0-3 9v11"/>',   // dashboard.html :: food
    calorie : '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',   // js/nav.js :: calories
    mcu     : '<path d="M11 2a2 2 0 0 0-2 2v1a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0V7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2"/><circle cx="20" cy="10" r="2"/>',   // js/tour.js :: medical (stetoskop)
    media   : '<path d="M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1h-2"/><path d="M4 4a1 1 0 0 0-1 1v13a2 2 0 0 0 2 2h11a1 1 0 0 0 1-1V4z"/><path d="M7 8h7M7 12h7M7 16h4"/>',   // dashboard.html :: news
    workout : '<path d="M6.5 6.5 17.5 17.5"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>',   // dashboard.html :: dumbbell
    photo   : '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3.2"/>',   // dashboard.html :: camera
    ticket  : '<path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4z"/><line x1="13" y1="7" x2="13" y2="17"/>',   // dashboard.html :: ticket
    talent  : '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',   // dashboard.html :: coach
    bodyscan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',   // js/nav.js :: scan
    progress: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',   // js/nav.js :: progress (tren naik)
    bookclass: '<path d="M6.5 6.5 17.5 17.5M4 9l1-1M20 15l-1 1M8 4l-2 2 3 3M16 20l2-2-3-3M3 12l2 2M19 10l2 2"/>',   // dashboard.html :: dumbbell
    bookcoach: '<circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/>',   // dashboard.html :: coach
    bookdoctor: '<path d="M12 3v4M8 4h8"/><path d="M6 7v5a6 6 0 0 0 12 0V7"/><circle cx="18" cy="17" r="3"/>',   // dashboard.html :: doctor (stetoskop)
    bookrecovery: '<path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 4.5 7 9.5 10 11.5 1.5-1 4-2.8 6-5"/>',   // dashboard.html :: heart
    grid    : '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',   // dashboard.html :: grid
    receipt : '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',   // dashboard.html :: card
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',   // dashboard.html :: gear
    logout  : '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',   // dashboard.html :: logout
    close   : '<path d="M18 6 6 18M6 6l12 12"/>'   // pola silang yang dipakai dashboard/profile/recipe/calories
  };

  function svg(k, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) +
      '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[k] || "") + '</svg>';
  }

  // SATU daftar produk untuk SATU mega menu "Semua produk 20FIT" — tidak ada lagi daftar
  // "Di my.20fit" terpisah yang mengulang produk yang sama (CLAUDE.md §2: satu sumber,
  // tanpa duplikat). Menambah produk = menambah satu baris.
  //
  // `group`  : kelompok tampilan (lihat GROUPS di bawah).
  // `url`    : alamat kanonik (subdomain). Dipakai saat nav ini dipasang di subdomain LAIN
  //            (dibawa lewat SSO Auth.ssoTo bila ada sesi).
  // `path`   : alamat INTERNAL di my.20fit. Kalau ADA dan user SEDANG di my.20fit, klik
  //            tetap di dalam my.20fit (navigasi biasa, tanpa SSO) — mis. Calorie/Recipe/MCU
  //            memang sengaja in-app di my.20fit (keputusan pemilik), bukan dilempar ke subdomain.
  //            Item tanpa `path` (Home/Workout/Media/Photo/Ticket/Talent) selalu ke subdomain.
  var ITEMS = [
    // Utama
    { id: "home",    group: "main", label: "Home",            desc: "Direktori Olahraga",          icon: "home",    url: "https://20fit.id",                color: "#1a1a1a" },
    { id: "my20fit", group: "main", label: "My 20FIT",        desc: "Member Portal",               icon: "my20fit", url: "https://my.20fit.id",             color: "#6366F1", path: "/dashboard" },
    { id: "recipe",  group: "main", label: "Recipe",          desc: "Menu & Resep Sehat",          icon: "recipe",  url: "https://recepie.20fit.id",        color: "#16A34A", path: "/recipe" },
    // Health
    { id: "calorie", group: "health", label: "Calorie Tracker", desc: "Hitung Kalori Harian",      icon: "calorie", url: "https://calorietracker.20fit.id", color: "#F97316", path: "/calories" },
    { id: "mcu",     group: "health", label: "MCU Scanner",     desc: "Baca Hasil Medical Check-Up", icon: "mcu",    url: "https://medicalscanner.20fit.id", color: "#0EA5E9", path: "/medical" },
    { id: "bodyscan",group: "health", label: "Body Scan",       desc: "Komposisi Tubuh (Visbody)", icon: "bodyscan",url: "https://my.20fit.id/body-scan",   color: "#EC4899", path: "/body-scan" },
    // Activity
    { id: "workout", group: "activity", label: "Workout",       desc: "Streaming Latihan",         icon: "workout", url: "https://workout.20fit.id",        color: "#EF4444" },
    { id: "progress",group: "activity", label: "Progress",      desc: "Tracking Progres",          icon: "progress",url: "https://my.20fit.id/activity",    color: "#F43F5E", path: "/activity" },
    { id: "media",   group: "activity", label: "Media",         desc: "Blog & Artikel",            icon: "media",   url: "https://media.20fit.id",          color: "#8B5CF6" },
    // Event
    { id: "photo",   group: "event", label: "Photo",           desc: "Foto Event",                  icon: "photo",   url: "https://photo.20fit.id",          color: "#EC4899" },
    { id: "ticket",  group: "event", label: "Ticket",          desc: "Tiket & Event",               icon: "ticket",  url: "https://ticket.20fit.id",         color: "#14B8A6" },
    { id: "talent",  group: "event", label: "Talent",          desc: "Talent & Event Organizer",    icon: "talent",  url: "https://talent.20fit.id",         color: "#3B82F6" },
    // Booking (semua diproses di my.20fit → booking.20fit.id)
    { id: "book-class",   group: "booking", label: "Book Class",    desc: "Arena & Gym",            icon: "bookclass",    url: "https://my.20fit.id/book-class",           color: "#F59E0B", path: "/book-class" },
    { id: "book-coach",   group: "booking", label: "Book Coach",    desc: "Personal Training",      icon: "bookcoach",    url: "https://my.20fit.id/book-coach",           color: "#F59E0B", path: "/book-coach" },
    { id: "book-doctor",  group: "booking", label: "Book Doctor",   desc: "Konsultasi Dokter",      icon: "bookdoctor",   url: "https://my.20fit.id/book-doctor",          color: "#0EA5E9", path: "/book-doctor" },
    { id: "book-recovery",group: "booking", label: "Book Recovery", desc: "Fisioterapi & Recovery", icon: "bookrecovery", url: "https://my.20fit.id/classes?venue=clinic", color: "#EF4444", path: "/classes?venue=clinic" }
  ];

  // Urutan + judul kelompok. Kelompok "main" tanpa judul (baris teratas).
  var GROUPS = [
    { id: "main",     label: "" },
    { id: "health",   label: "Health" },
    { id: "activity", label: "Activity" },
    { id: "event",    label: "Event" },
    { id: "booking",  label: "Booking" }
  ];

  // Host tempat kita berada DI DALAM my.20fit (produksi + staging + dev). Dipakai untuk
  // (a) highlight aktif berbasis path, dan (b) smart routing: klik item ber-`path` → tetap
  // internal, bukan SSO ke subdomain.
  var MY_HOSTS = { "my.20fit.id": 1, "profile20fit-staging.up.railway.app": 1, "localhost": 1, "127.0.0.1": 1 };

  // Prefix path my.20fit → id item (untuk highlight "Kamu di sini"). Beberapa alias
  // di-redirect server: /mcu→/medical, /recipes→/recipe, /progress→/activity — jadi
  // keduanya dipetakan. /classes ditangani khusus (venue=clinic → book-recovery).
  var PATHS = [
    ["/book-class", "book-class"], ["/book-coach", "book-coach"], ["/book-doctor", "book-doctor"],
    ["/body-scan", "bodyscan"],
    ["/activity", "progress"], ["/progress", "progress"],
    ["/calories", "calorie"],
    ["/medical", "mcu"], ["/mcu", "mcu"],
    ["/recipe", "recipe"], ["/recipes", "recipe"],
    ["/dashboard", "my20fit"]
  ];

  // Ikon produk = artwork branded 20FIT (hasil kecilkan berkas .svg repo jadi PNG kecil
  // di /img/products/<id>.png). 14 dari 16 produk punya artwork; Body Scan & Talent belum
  // ada → tetap pakai ikon garis inline (P[icon], ikut warna/tema). Artwork raster full-color
  // (tidak ikut tema) — makanya diberi chip putih di CSS supaya rapi di light & dark.
  var NO_ART = { bodyscan: 1, talent: 1 };
  ITEMS.forEach(function (it) { if (!NO_ART[it.id]) it.img = "/img/products/" + it.id + ".png"; });
  // Base URL ikon: di my.20fit/staging = same-origin (""), di subdomain lain = absolut ke
  // my.20fit.id (tempat berkasnya) supaya bar universal tetap dapat ikon di mana pun dipasang.
  var ICON_BASE = MY_HOSTS[location.hostname] ? "" : "https://my.20fit.id";

  // recepie.20fit.id = typo domain yang SUDAH terpasang di produksi; keduanya dipetakan
  // ke id yang sama supaya highlight "Kamu di sini" tetap benar.
  var HOSTS = {
    "20fit.id": "home", "www.20fit.id": "home",
    "my.20fit.id": "my20fit",
    "recipe.20fit.id": "recipe", "recepie.20fit.id": "recipe",
    "calorietracker.20fit.id": "calorie",
    "medicalscanner.20fit.id": "mcu",
    "media.20fit.id": "media",
    "workout.20fit.id": "workout",
    "photo.20fit.id": "photo",
    "ticket.20fit.id": "ticket",
    "talent.20fit.id": "talent"
  };
  function currentId() {
    var h = location.hostname;
    if (MY_HOSTS[h]) {
      // Di dalam my.20fit → tentukan dari PATH (host-nya selalu sama untuk banyak halaman).
      var p = location.pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
      if (p === "/classes") return /venue=clinic/.test(location.search) ? "book-recovery" : "book-class";
      for (var i = 0; i < PATHS.length; i++) {
        if (p === PATHS[i][0] || p.indexOf(PATHS[i][0] + "/") === 0) return PATHS[i][1];
      }
      return "my20fit"; // root / halaman my.20fit lain
    }
    return HOSTS[h] || null;
  }

  // Smart routing: kalau item punya `path` DAN kita sedang di my.20fit → tetap internal
  // (navigasi biasa, tanpa SSO — sudah same-origin). Selain itu → SSO ke subdomain kalau
  // Auth.ssoTo ada, kalau tidak navigasi biasa (tujuan yang minta login).
  function navTo(it) {
    if (!it) return;
    if (it.path && MY_HOSTS[location.hostname]) { location.href = it.path; return; }
    if (window.Auth && typeof Auth.ssoTo === "function") { Auth.ssoTo(it.url); return; }
    location.href = it.url;
  }
  function itemById(id) { for (var i = 0; i < ITEMS.length; i++) { if (ITEMS[i].id === id) return ITEMS[i]; } return null; }

  // Render satu kartu produk + baris grup berlabel. Dipakai dua varian (bar & tertanam).
  function appCell(it, size, embed, cur) {
    var on = it.id === cur;
    // Semua ikon duduk di "chip" putih membulat → tampil konsisten seperti app-tile, dan
    // rapi baik di menu terang maupun gelap. Chip berisi artwork branded (img) atau, untuk
    // 2 produk tanpa artwork, ikon garis berwarna merah 20FIT.
    var inner = it.img
      ? '<img class="un-img" src="' + esc(ICON_BASE + it.img) + '" alt="" loading="lazy">'
      : svg(it.icon, size);
    return '<a class="un-app" role="menuitem" href="' + esc(it.url) + '" data-id="' + esc(it.id) + '"' +
      (on ? ' aria-current="page"' : '') + '>' +
      '<span class="un-ic' + (it.img ? '' : ' un-line') + '">' + inner + '</span>' +
      '<span class="un-l">' + esc(it.label) + '</span>' +
      (embed ? '' : '<span class="un-d">' + esc(it.desc) + '</span>') +
      (on ? '<span class="un-here">● Kamu di sini</span>' : '') +
      '</a>';
  }
  function groupsHtml(size, embed) {
    var cur = currentId();
    return GROUPS.map(function (g) {
      var list = ITEMS.filter(function (it) { return it.group === g.id; });
      if (!list.length) return "";
      var lab = g.label ? '<div class="un-glabel">' + esc(g.label) + '</div>' : '';
      // Selalu 3 kolom per baris (semua breakpoint) — keputusan pemilik. Booking (4 item)
      // otomatis jadi 3 + 1.
      return '<div class="un-group">' + lab + '<div class="un-grow">' +
        list.map(function (it) { return appCell(it, size, embed, cur); }).join("") + '</div></div>';
    }).join("");
  }
  function bindApps(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll(".un-app[data-id]"), function (a) {
      a.onclick = function (e) {
        e.preventDefault();
        if (a.getAttribute("aria-current") === "page") return;
        navTo(itemById(a.getAttribute("data-id")));
      };
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CSS = [
    '#un20{position:relative;z-index:9999;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}',
    '#un20 *{box-sizing:border-box}',
    '.un-bar{display:flex;align-items:center;gap:10px;height:40px;padding:0 14px;background:#111;color:#fff}',
    '.un-logo{color:#fff;text-decoration:none;font-weight:800;font-size:15px;letter-spacing:.02em;flex:0 0 auto}',
    '.un-cur{flex:1;min-width:0;text-align:center;font-size:12.5px;opacity:.72;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.un-btn{flex:0 0 auto;display:flex;align-items:center;justify-content:center;background:none;border:0;color:#fff;cursor:pointer;',
    'width:32px;height:32px;border-radius:8px;padding:0}',
    '.un-btn[aria-expanded="true"]{background:rgba(255,255,255,.15)}',
    '.un-av{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:0;cursor:pointer;background:#6366F1;color:#fff;',
    'font:700 12px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0}',
    '.un-av img{width:100%;height:100%;object-fit:cover;display:block}',
    '.un-in{flex:0 0 auto;background:#fff;color:#111;border:0;border-radius:6px;padding:5px 12px;cursor:pointer;font:600 12px system-ui,sans-serif}',
    '#un20 :focus-visible{outline:none;box-shadow:0 0 0 2px #111,0 0 0 4px #6366F1}',
    /* panel */
    '.un-pop{position:absolute;top:100%;right:0;z-index:10000;background:#fff;color:#1a1a1a;border-radius:0 0 16px 16px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.18);padding:14px;animation:unIn .2s ease}',
    '@keyframes unIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
    '.un-apps{width:min(520px,95vw)}',
    '.un-group{margin-top:14px}.un-group:first-child{margin-top:0}',
    '.un-glabel{font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 4px}',
    '.un-grow{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
    '.un-app{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;padding:13px 6px;border-radius:12px;',
    'text-decoration:none;color:#1a1a1a;border:2px solid transparent;background:transparent;cursor:pointer;font-family:inherit}',
    '.un-app:hover{background:#f5f5f5}',
    '.un-app[aria-current="page"]{background:#f0f0f0;border-color:#111;cursor:default}',
    '.un-app .un-ic{width:52px;height:52px;display:flex;align-items:center;justify-content:center;line-height:0}',
    '.un-embed .un-app .un-ic{width:46px;height:46px}',
    '.un-ic .un-img{width:100%;height:100%;object-fit:contain;display:block}',
    '.un-ic.un-line{color:#C41101}',
    '.un-ic.un-line svg{width:88%;height:88%}',
    '.un-app .un-l{font-size:12px;font-weight:600;line-height:1.2}',
    '.un-app .un-d{font-size:10px;color:#888;line-height:1.2}',
    '.un-here{font-size:9px;color:#16A34A;font-weight:700}',
    /* profil */
    '.un-prof{width:min(300px,95vw)}',
    '.un-head{display:flex;gap:12px;align-items:center;margin-bottom:6px}',
    '.un-big{width:48px;height:48px;border-radius:50%;background:#6366F1;color:#fff;display:flex;align-items:center;',
    'justify-content:center;font:700 20px system-ui,sans-serif;flex:0 0 auto;overflow:hidden}',
    '.un-big img{width:100%;height:100%;object-fit:cover}',
    '.un-nm{font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.un-em{font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.un-hr{border:0;border-top:1px solid #eee;margin:12px 0}',
    '.un-row{display:flex;align-items:center;gap:12px;padding:10px 8px;border-radius:8px;text-decoration:none;color:#1a1a1a;',
    'background:none;border:0;width:100%;cursor:pointer;font-family:inherit;text-align:left}',
    '.un-row:hover{background:#f5f5f5}',
    '.un-row .un-t{font-size:13px;font-weight:600}',
    '.un-row .un-s{font-size:11px;color:#888}',
    '.un-out{color:#EF4444}.un-out:hover{background:#FEF2F2}',
    '.un-x{display:none}',
    /* mobile: overlay penuh, 2 kolom */
    '@media(max-width:639px){',
    '.un-pop{position:fixed;inset:0;width:100vw;height:100dvh;border-radius:0;padding:16px;overflow:auto}',
    '.un-apps{width:100%}',
    '.un-prof{width:100%}',
    '.un-x{display:flex;align-items:center;justify-content:center;position:absolute;top:12px;right:12px;',
    'width:36px;height:36px;border:0;border-radius:50%;background:#f0f0f0;color:#111;cursor:pointer}',
    '.un-apps,.un-prof{margin-top:44px}',
    '}',
    '@media(min-width:640px) and (max-width:1023px){.un-apps{width:min(560px,95vw)}}',
    /* Varian TERTANAM: dipakai saat grid ditempel ke menu milik halaman (tanpa bar). */
    '.un-embed{display:block}',
    '.un-embed .un-grow{gap:4px}',
    '.un-embed .un-group{margin-top:10px}',
    '.un-embed .un-app{padding:10px 4px;gap:2px;color:inherit}',
    '.un-embed .un-app .un-l{font-size:11px}',
    '.un-embed .un-app:hover{background:color-mix(in srgb,currentColor 7%,transparent)}',
    '.un-embed .un-here{font-size:8.5px}'
  ].join("");

  function injectCss() {
    if (document.getElementById("un20-css")) return;
    var st = document.createElement("style"); st.id = "un20-css"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // Pasang HANYA grid produk ke wadah yang diberikan. Dipakai halaman yang sudah punya
  // menunya sendiri (dashboard) supaya tidak ada dua menu produk. Menyuntik CSS-nya juga
  // supaya bisa dipanggil tanpa bar pernah dipasang.
  function renderAppsInto(el) {
    if (!el) return;
    injectCss();
    el.classList.add("un-embed");
    el.innerHTML = groupsHtml(24, true);
    bindApps(el);
    return el;
  }

  function mount() {
    if (document.getElementById("un20")) return;
    injectCss();

    var cur = currentId();
    var curItem = ITEMS.filter(function (i) { return i.id === cur; })[0];

    var root = document.createElement("div");
    root.id = "un20";
    root.innerHTML =
      '<div class="un-bar">' +
        '<a class="un-logo" href="https://20fit.id">20FIT</a>' +
        '<span class="un-cur">' + esc(curItem ? curItem.label : "20FIT") + '</span>' +
        '<button class="un-btn" id="unApps" aria-label="Menu aplikasi 20FIT" aria-expanded="false" aria-haspopup="true">' + svg("grid", 20) + '</button>' +
        '<span id="unAcct"></span>' +
      '</div>' +
      '<div id="unPop"></div>';
    document.body.insertBefore(root, document.body.firstChild);

    var pop = root.querySelector("#unPop");
    var appsBtn = root.querySelector("#unApps");
    var acct = root.querySelector("#unAcct");
    var openKind = null;   // null | "apps" | "prof"
    var USER = null;

    function closeAll() {
      pop.innerHTML = ""; openKind = null;
      appsBtn.setAttribute("aria-expanded", "false");
      var a = acct.querySelector(".un-av"); if (a) a.setAttribute("aria-expanded", "false");
    }

    // Navigasi: bawa sesi lewat Auth.ssoTo kalau tersedia; kalau tidak, navigasi biasa.
    function go(url) {
      if (window.Auth && typeof Auth.ssoTo === "function") { Auth.ssoTo(url); return; }
      location.href = url;
    }

    function appsHtml() {
      return '<div class="un-pop un-apps" role="menu" aria-label="Aplikasi 20FIT">' +
        '<button class="un-x" id="unClose" aria-label="Tutup">' + svg("close", 20) + '</button>' +
        groupsHtml(28, false) + '</div>';
    }

    function initial(u) {
      var n = (u && u.user_metadata && u.user_metadata.full_name) || (u && u.email) || "?";
      return String(n).trim().charAt(0).toUpperCase() || "?";
    }
    function avatarUrl(u) { return (u && u.user_metadata && u.user_metadata.avatar_url) || null; }

    function profHtml() {
      var av = avatarUrl(USER);
      var links = [
        { t: "Profil Saya", s: "Lihat & edit profil Anda", u: "https://my.20fit.id/profile", i: "my20fit" },
        { t: "Riwayat Pembelian", s: "Semua transaksi di 20FIT", u: "https://my.20fit.id/purchases", i: "receipt" },
        { t: "Pengaturan Akun", s: "Password, email, keamanan", u: "https://my.20fit.id/settings", i: "settings" }
      ];
      return '<div class="un-pop un-prof" role="menu" aria-label="Akun 20FIT">' +
        '<button class="un-x" id="unClose" aria-label="Tutup">' + svg("close", 20) + '</button>' +
        '<div class="un-head"><div class="un-big">' +
          (av ? '<img src="' + esc(av) + '" alt="">' : esc(initial(USER))) + '</div>' +
          '<div style="min-width:0"><div class="un-nm">' +
            esc((USER && USER.user_metadata && USER.user_metadata.full_name) || "User") + '</div>' +
          '<div class="un-em">' + esc((USER && USER.email) || "") + '</div></div></div>' +
        '<hr class="un-hr">' +
        links.map(function (l) {
          return '<a class="un-row" role="menuitem" href="' + esc(l.u) + '" data-url="' + esc(l.u) + '">' +
            '<span style="line-height:0;color:#555">' + svg(l.i, 20) + '</span>' +
            '<span><span class="un-t" style="display:block">' + esc(l.t) + '</span>' +
            '<span class="un-s">' + esc(l.s) + '</span></span></a>';
        }).join("") +
        '<hr class="un-hr">' +
        '<button class="un-row un-out" id="unOut" role="menuitem">' +
          '<span style="line-height:0">' + svg("logout", 20) + '</span>' +
          '<span class="un-t">Keluar</span></button>' +
        '</div>';
    }

    // Dua panel saling meniadakan — tak pernah terbuka berbarengan.
    function open(kind) {
      if (openKind === kind) { closeAll(); return; }
      closeAll();
      pop.innerHTML = (kind === "apps") ? appsHtml() : profHtml();
      openKind = kind;
      if (kind === "apps") appsBtn.setAttribute("aria-expanded", "true");
      else { var a = acct.querySelector(".un-av"); if (a) a.setAttribute("aria-expanded", "true"); }
      var x = pop.querySelector("#unClose"); if (x) x.onclick = closeAll;
      var o = pop.querySelector("#unOut");
      if (o) o.onclick = function () {
        if (window.Auth && typeof Auth.signOut === "function") {
          Promise.resolve(Auth.signOut()).catch(function () {}).then(function () {
            location.href = "https://my.20fit.id/login";
          });
        } else { location.href = "https://my.20fit.id/login"; }
      };
      // Kartu produk (grid apps) pakai data-id → smart routing navTo().
      bindApps(pop);
      // Baris profil pakai data-url (URL penuh) → go() biasa lewat SSO.
      Array.prototype.forEach.call(pop.querySelectorAll("[data-url]"), function (a2) {
        a2.onclick = function (e) {
          e.preventDefault();
          if (a2.getAttribute("aria-current") === "page") { closeAll(); return; }
          go(a2.getAttribute("data-url"));
        };
      });
    }

    appsBtn.onclick = function () { open("apps"); };

    function renderAcct() {
      if (USER) {
        var av = avatarUrl(USER);
        acct.innerHTML = '<button class="un-av" aria-label="Akun saya" aria-expanded="false" aria-haspopup="true">' +
          (av ? '<img src="' + esc(av) + '" alt="">' : esc(initial(USER))) + '</button>';
        acct.querySelector(".un-av").onclick = function () { open("prof"); };
      } else {
        acct.innerHTML = '<button class="un-in">Masuk</button>';
        acct.querySelector(".un-in").onclick = function () {
          go("https://my.20fit.id/login?next=" + encodeURIComponent(location.href));
        };
      }
    }
    renderAcct();

    // Ambil user kalau auth.js ada. Tanpa auth.js, bar tetap tampil dengan tombol "Masuk".
    if (window.Auth) {
      Promise.resolve(Auth.ready).then(function () {
        return Auth.supabase.auth.getSession();
      }).then(function (r) {
        USER = (r && r.data && r.data.session && r.data.session.user) || null;
        renderAcct();
      }).catch(function () {});
    }

    document.addEventListener("mousedown", function (e) { if (openKind && !root.contains(e.target)) closeAll(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openKind) closeAll(); });
    window.addEventListener("scroll", function () { if (openKind) closeAll(); }, { passive: true });
  }

  if (!NO_BAR) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }

  window.UniversalNav = { mount: mount, renderAppsInto: renderAppsInto, ITEMS: ITEMS, currentId: currentId };
})();
