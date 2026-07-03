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
    { href: "progress.html", key: "nav_progress", k: "progress" },
    { href: "calories.html", key: "nav_calories", k: "calories" },
    { href: "profile.html", key: "nav_profile", k: "profile" },
  ];
  const cur = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  const tr = (key, fb) => (window.I18N ? I18N.t(key) : fb);

  const css = `
    body{padding-bottom:96px}
    /* ---------- SIDEBAR (desktop >=900px) ---------- */
    .navside{display:none}
    @media(min-width:900px){
      body{padding-bottom:0 !important;padding-left:238px}
      .bnav,.scanfab{display:none !important}
      .navside{position:fixed;left:0;top:0;bottom:0;width:238px;z-index:45;padding:24px 16px;display:flex;flex-direction:column;gap:5px;
        background:var(--fit-glass-strong,rgba(255,255,255,.72));-webkit-backdrop-filter:blur(28px) saturate(140%);backdrop-filter:blur(28px) saturate(140%);
        border-right:1px solid var(--fit-glass-border,rgba(255,255,255,.9))}
    }
    .navside .sbrand{font-family:var(--fit-font-display,'Barlow Condensed'),sans-serif;font-weight:900;font-size:26px;letter-spacing:.01em;padding:2px 10px 16px;text-transform:uppercase;color:var(--fit-ink,#1D1D1F)}
    .navside .sbrand b{color:var(--fit-red,#E4002B)}
    .navside .navi{display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:13px;color:var(--fit-ink-soft,#6E6E73);text-decoration:none;
      font-family:var(--fit-font-display,'Barlow Condensed'),sans-serif;font-weight:700;font-size:14.5px;text-transform:uppercase;letter-spacing:.03em;transition:.15s}
    .navside .navi:hover{background:var(--fit-glass,rgba(255,255,255,.55));color:var(--fit-ink,#1D1D1F)}
    .navside .navi.on{background:var(--fit-red,#E4002B);color:#fff;box-shadow:0 8px 20px rgba(228,0,43,.28)}
    .navside .navi svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
    .navside .sscan{margin-top:14px;display:flex;align-items:center;justify-content:center;gap:9px;border:0;cursor:pointer;
      background:var(--fit-ink,#1D1D1F);color:var(--fit-bg2,#E9EEF3);font-family:var(--fit-font-display,'Barlow Condensed'),sans-serif;font-weight:800;text-transform:uppercase;letter-spacing:.03em;font-size:14px;padding:13px;border-radius:14px;transition:.15s}
    .navside .sscan:active{transform:scale(.98)}
    .navside .sscan svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .navside .sfoot{margin-top:auto;display:flex;align-items:center;gap:11px;padding:12px 8px;border-top:1px solid var(--fit-glass-border,rgba(255,255,255,.9));min-width:0}
    .navside .sfoot .av{width:38px;height:38px;border-radius:999px;background:var(--fit-red,#E4002B);color:#fff;display:grid;place-items:center;font-weight:800;font-family:var(--fit-font-display,'Barlow Condensed'),sans-serif;flex:0 0 auto}
    .navside .sfoot .tx{min-width:0}
    .navside .sfoot .nm{font-family:var(--fit-font-body,'Manrope'),sans-serif;font-size:14px;font-weight:750;color:var(--fit-ink,#1D1D1F);line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .navside .sfoot .em{font-family:var(--fit-font-mono,'JetBrains Mono'),monospace;font-size:11px;color:var(--fit-ink-soft,#6E6E73);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    /* ---------- BOTTOM NAV + FAB (mobile <900px) — glass ---------- */
    .bnav{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;justify-content:center;gap:4px;
      padding:8px 8px calc(8px + env(safe-area-inset-bottom));
      background:var(--fit-glass-strong,rgba(255,255,255,.72));-webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
      border-top:1px solid var(--fit-glass-border,rgba(255,255,255,.9))}
    .bnav a{flex:1;max-width:90px;text-align:center;text-decoration:none;color:var(--fit-ink-soft,#6E6E73);
      font-family:var(--fit-font-display,'Barlow Condensed'),sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;
      padding:6px 2px;border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:3px}
    .bnav a.on{color:var(--fit-ink,#1D1D1F)}
    .bnav svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .bnav a.on svg{stroke:var(--fit-red,#E4002B)}
    .scanfab{position:fixed;right:18px;bottom:96px;z-index:41;background:var(--fit-red,#E4002B);color:#fff;border:0;border-radius:50%;
      width:60px;height:60px;font-size:10px;font-weight:800;font-family:var(--fit-font-display,'Barlow Condensed'),sans-serif;text-transform:uppercase;cursor:pointer;
      box-shadow:0 8px 22px rgba(228,0,43,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
    .scanfab svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Scan (di halaman mana pun) -> buka kamera/album, lalu proses di Calorie Tracker
  function doScan() {
    try {
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

  // ---- Sidebar (desktop) ----
  const side = document.createElement("aside");
  side.className = "navside";
  function renderSide() {
    side.innerHTML =
      '<div class="sbrand">20<b>FIT</b></div>' +
      items.map(it => `<a href="${it.href}" class="navi ${cur === it.href ? "on" : ""}">${svg(it.k)}<span>${tr(it.key, it.k)}</span></a>`).join("") +
      `<button class="sscan" type="button">${svg("scan")}<span>${tr("nav_scan", "Scan")}</span></button>` +
      '<div class="sfoot"><div class="av" id="navAv">·</div><div class="tx"><div class="nm" id="navNm">20FIT</div><div class="em" id="navEm">member</div></div></div>';
    side.querySelector(".sscan").onclick = doScan;
  }
  renderSide();
  document.body.appendChild(side);

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
        if (a) a.textContent = (nm[0] || "·").toUpperCase();
        if (n) n.textContent = nm;
        if (e) e.textContent = em || "member";
      }).catch(function () {});
    }
  } catch (e) {}

  if (window.I18N) I18N.onChange(() => { renderSide(); renderNav(); renderFab(); });
})();
