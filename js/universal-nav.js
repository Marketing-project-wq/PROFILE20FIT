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
 * IKON: SVG outline, BUKAN emoji. `home`, `calorie`, `my20fit` memakai path yang SAMA
 * dengan js/nav.js supaya konsisten dengan ikon yang sudah dipakai app ini.
 *
 * Pakai: <script src="js/universal-nav.js" defer></script>  (otomatis memasang dirinya)
 */
(function () {
  "use strict";

  var P = {
    home:    '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    my20fit: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    recipe:  '<path d="M3 2v7a3 3 0 0 0 6 0V2"/><path d="M6 9v13"/><path d="M18 2v20"/><path d="M18 2a3 3 0 0 0-3 3v6h6V5a3 3 0 0 0-3-3z"/>',
    calorie: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    mcu:     '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 12 0V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 12 0v-4"/><circle cx="20" cy="10" r="2"/>',
    media:   '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V7h4"/><path d="M10 6h8M10 10h8M10 14h5"/>',
    workout: '<path d="M6.5 6.5 17.5 17.5"/><path d="m21 21-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7 4 4-7 7z"/><path d="m14 17 7-7-4-4-7 7z"/>',
    photo:   '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    ticket:  '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    talent:  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    grid:    '<circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    logout:  '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    close:   '<path d="M18 6 6 18M6 6l12 12"/>'
  };
  function svg(k, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) +
      '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (P[k] || "") + '</svg>';
  }

  // Satu daftar produk. Menambah produk = menambah satu baris.
  var ITEMS = [
    { id: "home",    label: "Home",            desc: "Direktori Olahraga",       icon: "home",    url: "https://20fit.id",                    color: "#1a1a1a" },
    { id: "my20fit", label: "My 20FIT",        desc: "Member Portal",            icon: "my20fit", url: "https://my.20fit.id",                 color: "#6366F1" },
    { id: "recipe",  label: "Recipe",          desc: "Menu & Resep Sehat",       icon: "recipe",  url: "https://recepie.20fit.id",            color: "#16A34A" },
    { id: "calorie", label: "Calorie Tracker", desc: "Hitung Kalori Harian",     icon: "calorie", url: "https://calorietracker.20fit.id",     color: "#F97316" },
    { id: "mcu",     label: "MCU Scanner",     desc: "Baca Hasil Medical Check-Up", icon: "mcu",  url: "https://medicalscanner.20fit.id",     color: "#0EA5E9" },
    { id: "media",   label: "Media",           desc: "Blog & Artikel",           icon: "media",   url: "https://media.20fit.id",              color: "#8B5CF6" },
    { id: "workout", label: "Workout",         desc: "Streaming Latihan",        icon: "workout", url: "https://workout.20fit.id",            color: "#EF4444" },
    { id: "photo",   label: "Photo",           desc: "Foto Event",               icon: "photo",   url: "https://photo.20fit.id",              color: "#EC4899" },
    { id: "ticket",  label: "Ticket",          desc: "Tiket & Booking",          icon: "ticket",  url: "https://ticket.20fit.id",             color: "#14B8A6" },
    { id: "talent",  label: "Talent",          desc: "Talent & Event Organizer", icon: "talent",  url: "https://talent.20fit.id",             color: "#3B82F6" }
  ];

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
  function currentId() { return HOSTS[location.hostname] || null; }

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
    '.un-apps{width:min(480px,95vw);display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
    '.un-app{display:flex;flex-direction:column;align-items:center;text-align:center;gap:3px;padding:13px 6px;border-radius:12px;',
    'text-decoration:none;color:#1a1a1a;border:2px solid transparent;background:transparent;cursor:pointer;font-family:inherit}',
    '.un-app:hover{background:#f5f5f5}',
    '.un-app[aria-current="page"]{background:#f0f0f0;border-color:#111;cursor:default}',
    '.un-app .un-ic{line-height:0}',
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
    '.un-apps{width:100%;grid-template-columns:repeat(2,1fr)}',
    '.un-prof{width:100%}',
    '.un-x{display:flex;align-items:center;justify-content:center;position:absolute;top:12px;right:12px;',
    'width:36px;height:36px;border:0;border-radius:50%;background:#f0f0f0;color:#111;cursor:pointer}',
    '.un-apps,.un-prof{margin-top:44px}',
    '}',
    '@media(min-width:640px) and (max-width:1023px){.un-apps{width:min(560px,95vw)}}'
  ].join("");

  function mount() {
    if (document.getElementById("un20")) return;
    var st = document.createElement("style"); st.id = "un20-css"; st.textContent = CSS;
    document.head.appendChild(st);

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
        ITEMS.map(function (it) {
          var on = it.id === cur;
          return '<a class="un-app" role="menuitem" href="' + esc(it.url) + '" data-url="' + esc(it.url) + '"' +
            (on ? ' aria-current="page"' : '') + '>' +
            '<span class="un-ic" style="color:' + esc(it.color) + '">' + svg(it.icon, 28) + '</span>' +
            '<span class="un-l">' + esc(it.label) + '</span>' +
            '<span class="un-d">' + esc(it.desc) + '</span>' +
            (on ? '<span class="un-here">● Kamu di sini</span>' : '') +
            '</a>';
        }).join("") + '</div>';
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  window.UniversalNav = { mount: mount, ITEMS: ITEMS, currentId: currentId };
})();
