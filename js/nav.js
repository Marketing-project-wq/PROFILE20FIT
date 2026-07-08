// Navigasi bersama — SIDEBAR kaca (desktop) + bottom-nav & Scan FAB (mobile).
// Mengikuti design system "Glass Minimalist" (20fit-design-system.css).
// Visual only: tidak mengubah handler/logika halaman.
(function () {
  const ICON = {
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    medical: '<path d="M11 2a2 2 0 0 0-2 2v1a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0V7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/>',
    progress: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    calories: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    profile: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',
  };
  const svg = (k) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[k] + '</svg>';

  const items = [
    { href: "dashboard.html", key: "nav_home", k: "home" },
    { href: "medical.html", key: "nav_medical", k: "medical" },
    { href: "calories.html", key: "nav_calories", k: "calories" },
    { href: "progress.html", key: "nav_progress", k: "progress" },
    { href: "profile.html", key: "nav_profile", k: "profile" },
  ];
  const cur = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  const tr = (key, fb) => (window.I18N ? I18N.t(key) : fb);

  const SYS = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Inter',system-ui,'Segoe UI',Roboto,Arial,sans-serif";
  const css = `
    body{padding-bottom:96px}
    /* ---------- SIDEBAR (desktop >=900px) — flat v4 ---------- */
    .navside{display:none}
    @media(min-width:900px){
      body{padding-bottom:0 !important;padding-left:238px}
      .bnav,.scanfab{display:none !important}
      .navside{position:fixed;left:0;top:0;bottom:0;width:238px;z-index:45;padding:26px 18px;display:flex;flex-direction:column;gap:6px;
        background:var(--card,#fff);border-right:1px solid var(--line,#EBEBEF)}
    }
    /* Logo TANPA background. Satu file logo untuk semua mode & bahasa -> ukuran IDENTIK
       di ID/EN & light/dark. Light mode difilter jadi hitam via applyLogo(). */
    .navside .sbrand{display:inline-flex;align-items:center;margin:2px 4px 20px;border-radius:13px}
    .navside .sbrand img{height:46px;width:auto;display:block}
    .applogo{position:fixed;top:14px;left:16px;z-index:65;height:36px;width:auto;cursor:pointer;border-radius:10px}
    @media(min-width:900px){ .applogo{display:none} }
    .navside .navi{display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:13px;color:var(--muted,#8A8D94);text-decoration:none;
      font-family:${SYS};font-weight:650;font-size:14.5px;transition:.15s}
    .navside .navi:hover{background:var(--inp,#F2F2F5);color:var(--ink,#15171C)}
    .navside .navi.on{background:var(--red,#D4283A);color:#fff;box-shadow:0 8px 20px color-mix(in srgb,var(--red,#D4283A) 26%,transparent)}
    .navside .navi svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto;color:var(--faint,#B7B9BF)}
    .navside .navi.on svg,.navside .navi:hover svg{color:currentColor}
    .navside .sscan{margin-top:14px;display:flex;align-items:center;justify-content:center;gap:9px;border:1px solid transparent;cursor:pointer;
      background:var(--dark,#15171C);color:var(--bg,#F1F1F4);font-family:${SYS};font-weight:750;font-size:14px;padding:13px;border-radius:14px;transition:.15s}
    .navside .sscan:active{transform:scale(.98)}
    .navside .sscan svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    /* Dark mode: --dark & --bg keduanya nyaris hitam -> tombol jadi hitam-di-hitam (tak terlihat).
       Beri permukaan terang + teks terang biar tombol Scan & tulisannya tetap kebaca. */
    html:not(.theme-light) .navside .sscan,
    html[data-theme="dark"] .navside .sscan{
      background:var(--inp,#23262E);color:var(--txt,#F4F5F7);border-color:var(--line,#2A2E37)}
    .navside .sfoot{margin-top:auto;display:flex;align-items:center;gap:11px;padding:12px 10px;border-top:1px solid var(--line,#EBEBEF);min-width:0}
    .navside .sfoot .av{width:38px;height:38px;border-radius:999px;background:var(--red,#D4283A);color:#fff;display:grid;place-items:center;font-weight:800;font-family:${SYS};flex:0 0 auto}
    .navside .sfoot .tx{min-width:0}
    .navside .sfoot .nm{font-family:${SYS};font-size:14px;font-weight:750;color:var(--ink,#15171C);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .navside .sfoot .em{font-family:${SYS};font-size:11.5px;color:var(--muted,#8A8D94);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* ---------- BOTTOM NAV + FAB (mobile <900px) — flat v4 ---------- */
    .bnav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;justify-content:space-around;gap:4px;
      padding:9px 8px calc(9px + env(safe-area-inset-bottom));
      background:color-mix(in srgb,var(--bg,#F1F1F4) 82%,transparent);-webkit-backdrop-filter:saturate(180%) blur(18px);backdrop-filter:saturate(180%) blur(18px);
      border-top:1px solid var(--line,#EBEBEF)}
    .bnav a{flex:1;max-width:90px;text-align:center;text-decoration:none;color:var(--faint,#B7B9BF);
      font-family:${SYS};font-size:10.5px;font-weight:650;
      padding:6px 2px;border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:3px}
    .bnav a.on{color:var(--red,#D4283A)}
    .bnav svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .bnav a.on svg{stroke:var(--red,#D4283A)}
    .scanfab{position:fixed;right:18px;bottom:96px;z-index:41;background:var(--red,#D4283A);color:#fff;border:0;border-radius:50%;
      width:58px;height:58px;font-size:10px;font-weight:750;font-family:${SYS};cursor:pointer;
      box-shadow:0 10px 22px color-mix(in srgb,var(--red,#D4283A) 40%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
    .scanfab svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Scan (di halaman mana pun) -> buka kamera/album, lalu proses di Calorie Tracker
  function doScan() {
    try {
      // DESKTOP + ada webcam -> buka kamera langsung (bukan file picker).
      const isDesktop = window.matchMedia && window.matchMedia("(min-width:900px)").matches;
      if (isDesktop && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (typeof window.openCamera === "function") { window.openCamera(); return; } // sudah di halaman Calorie
        location.href = "calories.html#camera"; return; // halaman lain -> buka kamera di Calorie
      }
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*"; inp.style.display = "none";
      inp.onchange = function () {
        const f = inp.files && inp.files[0];
        if (!f) { location.href = "calories.html#scan"; return; }
        const rd = new FileReader();
        rd.onload = function () { try { sessionStorage.setItem("my20fit_pending_scan", rd.result); } catch (e) {} location.href = "calories.html#scan"; };
        rd.readAsDataURL(f);
      };
      document.body.appendChild(inp);
      inp.click();
    } catch (e) { location.href = "calories.html#scan"; }
  }

  // ---- LOGO sesuai tema (tanpa background/chip) ----
  // Dark mode  -> logo untuk background gelap (Untitled-design-1).
  // Light mode -> logo dengan titik merah / font gelap (Logo-20fit) biar kebaca di bg terang.
  // Dua file berbeda, dipakai tanpa filter.
  const LOGO = "https://media.20fit.id/wp-content/uploads/2026/05/Untitled-design-1.png";
  const LOGO_LIGHT_URL = "https://media.20fit.id/wp-content/uploads/2026/05/Logo-20fit.png";
  // Dua file punya padding internal beda -> di tinggi sama jadi keliatan beda ukuran.
  // Tinggi per-tema biar ukuran VISUAL logonya seimbang (gampang di-tune kalau perlu).
  const H_SIDE = { dark: 34, light: 110 };  // logo sidebar (desktop)
  const H_APP  = { dark: 28, light: 74 };   // logo pojok kiri atas (mobile)
  // Margin vertikal negatif utk logo light: "kolaps" padding gambar -> tinggi EFEKTIF
  // (yang dipakai layout) ~ sama dark, jadi ukuran & posisinya sejajar. Rumus ~ -(H-Hdark)/2.
  const MY_SIDE = { dark: 0, light: -38 };
  const MY_APP  = { dark: 0, light: -23 };
  function themeIsLight() { return document.documentElement.classList.contains("theme-light"); }
  function applyLogo() {
    const light = themeIsLight();
    const src = (light && LOGO_LIGHT_URL) ? LOGO_LIGHT_URL : LOGO;
    const filt = (light && !LOGO_LIGHT_URL) ? "brightness(0)" : "none";
    const si = side.querySelector(".sbrand img");
    if (si) { si.src = src; si.style.filter = filt; si.style.height = (light ? H_SIDE.light : H_SIDE.dark) + "px"; si.style.margin = (light ? MY_SIDE.light : MY_SIDE.dark) + "px 0"; }
    if (applogo) { applogo.src = src; applogo.style.filter = filt; applogo.style.height = (light ? H_APP.light : H_APP.dark) + "px"; applogo.style.margin = (light ? MY_APP.light : MY_APP.dark) + "px 0"; }
  }

  // ---- Sidebar (desktop) ----
  const side = document.createElement("aside");
  side.className = "navside";
  function renderSide() {
    side.innerHTML =
      '<div class="sbrand"><img src="' + LOGO + '" alt="20FIT"></div>' +
      items.map(it => `<a href="${it.href}" class="navi ${cur === it.href ? "on" : ""}">${svg(it.k)}<span>${tr(it.key, it.k)}</span></a>`).join("") +
      `<button class="sscan" type="button">${svg("scan")}<span>${tr("nav_scan", "Scan")}</span></button>` +
      '<div class="sfoot"><div class="av" id="navAv">·</div><div class="tx"><div class="nm" id="navNm">20FIT</div><div class="em" id="navEm">member</div></div></div>';
    side.querySelector(".sscan").onclick = doScan;
  }
  renderSide();
  document.body.appendChild(side);

  // ---- Logo pojok kiri atas (mobile) ----
  const applogo = document.createElement("img");
  applogo.className = "applogo";
  applogo.alt = "20FIT";
  applogo.onclick = function () { location.href = "dashboard.html"; };
  document.body.appendChild(applogo);

  applyLogo(); // set logo sesuai tema saat ini
  // Ganti logo otomatis saat tema light/dark berubah (toggle Dark).
  try {
    new MutationObserver(applyLogo).observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  } catch (e) {}

  // ---- Bottom nav (mobile) ----
  const nav = document.createElement("nav");
  nav.className = "bnav";
  function renderNav() {
    nav.innerHTML = items.map(it =>
      `<a href="${it.href}" class="${cur === it.href ? "on" : ""}">${svg(it.k)}${tr(it.key, it.k)}</a>`
    ).join("");
  }
  renderNav();
  document.body.appendChild(nav);

  const fab = document.createElement("button");
  fab.className = "scanfab";
  function renderFab() { fab.innerHTML = svg("scan") + tr("nav_scan", "Scan"); }
  renderFab();
  fab.onclick = doScan;
  document.body.appendChild(fab);

  // Isi footer sidebar dari akun (best-effort, tidak memblok)
  try {
    if (window.Auth && Auth.getUser) {
      Auth.getUser().then(function (u) {
        if (!u) return;
        const em = u.email || "";
        const nm = (u.user_metadata && u.user_metadata.full_name) || (em ? em.split("@")[0] : "Member");
        const a = document.getElementById("navAv"), n = document.getElementById("navNm"), e = document.getElementById("navEm");
        if (a) {
          a.textContent = (nm[0] || "·").toUpperCase();
          const applyAva = function (src) { if (src) { a.style.backgroundImage = "url('" + src + "')"; a.style.backgroundSize = "cover"; a.style.backgroundPosition = "center"; a.textContent = ""; } };
          try { const av = localStorage.getItem("my20fit_avatar_" + (u.id || "me")); if (av) applyAva(av); } catch (er) {}
          // Ambil foto tersinkron dari akun (lintas device)
          if (Auth.getProfile) Auth.getProfile().then(function (p) { if (p && p.avatar_url) { applyAva(p.avatar_url); try { localStorage.setItem("my20fit_avatar_" + (u.id || "me"), p.avatar_url); } catch (e2) {} } }).catch(function () {});
        }
        if (n) n.textContent = nm;
        if (e) e.textContent = em || "member";
      }).catch(function () {});
    }
  } catch (e) {}

  if (window.I18N) I18N.onChange(() => { renderSide(); applyLogo(); renderNav(); renderFab(); });
})();
