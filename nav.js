// Navigasi bersama (bottom-nav + Scan FAB) untuk semua halaman 20fit.
(function () {
  const items = [
    { href: "dashboard.html", label: "Home", icon: "🏠" },
    { href: "medical.html", label: "Medical", icon: "🩺" },
    { href: "progress.html", label: "Progress", icon: "📈" },
    { href: "calories.html", label: "Kalori", icon: "🍽️" },
    { href: "profile.html", label: "Profil", icon: "👤" },
  ];
  const cur = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();

  const css = `
    body{padding-bottom:96px !important}
    .bnav{position:fixed;left:0;right:0;bottom:0;z-index:40;background:#141414;border-top:1px solid #262626;
      display:flex;justify-content:center;gap:4px;padding:8px 8px calc(8px + env(safe-area-inset-bottom));}
    .bnav a{flex:1;max-width:90px;text-align:center;text-decoration:none;color:#8a8a8a;font-size:10px;font-weight:600;
      padding:6px 2px;border-radius:10px}
    .bnav a .i{font-size:20px;display:block;line-height:1.1;filter:grayscale(1);opacity:.7}
    .bnav a.on{color:#fff}
    .bnav a.on .i{filter:none;opacity:1}
    .scanfab{position:fixed;right:18px;bottom:96px;z-index:41;background:#C41101;color:#fff;border:0;border-radius:50%;
      width:60px;height:60px;font-size:11px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(196,17,1,.45);
      display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1}
    .scanfab .i{font-size:20px}
    @media(min-width:900px){
      .bnav{max-width:560px;margin:0 auto;border:1px solid #262626;border-radius:16px;bottom:16px;left:0;right:0}
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const nav = document.createElement("nav");
  nav.className = "bnav";
  nav.innerHTML = items.map(it =>
    `<a href="${it.href}" class="${cur === it.href ? "on" : ""}"><span class="i">${it.icon}</span>${it.label}</a>`
  ).join("");
  document.body.appendChild(nav);

  // Tombol Scan Calories (mengarah ke calorie tracker / scan)
  const fab = document.createElement("button");
  fab.className = "scanfab";
  fab.innerHTML = `<span class="i">📷</span>Scan`;
  fab.onclick = () => { location.href = "calories.html#scan"; };
  document.body.appendChild(fab);
})();
