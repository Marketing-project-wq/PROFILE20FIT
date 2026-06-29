// Navigasi bersama (bottom-nav + Scan FAB) — icon SVG line-style (tanpa emoji)
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
    body{padding-bottom:96px !important}
    .bnav{position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid #E8E2DB;
      display:flex;justify-content:center;gap:4px;padding:8px 8px calc(8px + env(safe-area-inset-bottom));box-shadow:0 -2px 16px rgba(10,9,8,.06)}
    .bnav a{flex:1;max-width:90px;text-align:center;text-decoration:none;color:#9E8E7A;font-size:10px;font-weight:600;
      padding:6px 2px;border-radius:10px;display:flex;flex-direction:column;align-items:center;gap:3px}
    .bnav a.on{color:#0A0908}
    .bnav svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .bnav a.on svg{stroke:#C41101}
    .scanfab{position:fixed;right:18px;bottom:96px;z-index:41;background:#C41101;color:#fff;border:0;border-radius:50%;
      width:62px;height:62px;font-size:10px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(196,17,1,.45);
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
    .scanfab svg{width:22px;height:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    @media(min-width:900px){
      .bnav{max-width:560px;margin:0 auto;border:1px solid #E8E2DB;border-radius:16px;bottom:16px;left:0;right:0}
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const nav = document.createElement("nav");
  nav.className = "bnav";
  function renderNav(){
    nav.innerHTML = items.map(it =>
      `<a href="${it.href}" class="${cur === it.href ? "on" : ""}">${svg(it.k)}${tr(it.key, it.k)}</a>`
    ).join("");
  }
  renderNav();
  document.body.appendChild(nav);

  const fab = document.createElement("button");
  fab.className = "scanfab";
  function renderFab(){ fab.innerHTML = svg("scan") + tr("nav_scan", "Scan"); }
  renderFab();
  fab.onclick = () => { location.href = "calories.html#scan"; };
  document.body.appendChild(fab);

  if (window.I18N) I18N.onChange(() => { renderNav(); renderFab(); });
})();
