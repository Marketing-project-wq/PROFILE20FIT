/* =============================================================================
 * tour.js — SATU mesin walkthrough untuk semua tur fitur my.20fit.id.
 *
 * Isi tur (judul, teks ID/EN, target, urutan, kondisi) ada di js/tours-config.js — file ini
 * hanya logika. Menggantikan tour.js lama (3 tur, status di localStorage, halaman dikenali
 * dari "*.html" sehingga tak pernah jalan di URL bersih /dashboard, /calories, /medical).
 *
 *  - Spotlight pada elemen ASLI + tooltip (judul, 1–2 kalimat, Kembali / Lanjut / Lewati tur),
 *    indikator "3 dari 7". Tooltip di atas/bawah target, tidak menutupi target; halaman
 *    di-scroll ke target. Elemen tak ada/tak terlihat -> versi `alt` atau langkah dilewati.
 *  - Status per user DI SERVER (/api/journey/tour, tabel my20fit_tour_state): not_started /
 *    in_progress (+langkah terakhir) / completed / skipped + versi. Tutup di tengah -> lanjut
 *    dari langkah terakhir. Versi naik -> hanya langkah baru yang belum pernah dilihat.
 *  - Tidak tampil selama ada modal lain (dialog persetujuan, pembayaran, dll): ditunggu dulu.
 *  - Keyboard (Esc = lewati, ←/→), fokus pindah ke tooltip & kembali, prefers-reduced-motion.
 *  - Event: tour_started / tour_step_viewed / tour_skipped / tour_completed / tour_replayed /
 *    tour_cta_clicked (+tour, step) -> /api/journey/event.
 *
 * API:  Tour.auto({vars, onCta, state})   -> jalankan tur yang berhak tampil di halaman ini
 *       Tour.start(key, {replay, vars, onCta})
 * Halaman dengan <body data-tour-manual> memanggil Tour.auto sendiri (mis. /activity menunggu
 * banner & skor); halaman lain dijalankan otomatis setelah dimuat. ?tour=<key> = putar ulang.
 * ============================================================================ */
(function () {
  "use strict";
  var CFG = window.TOURS_CONFIG || {};
  var REDUCE = false;
  try { REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function Lx(o) { return o ? (window.L ? window.L(o) : (o.id || o.en || "")) : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function pageKey() {
    var p = location.pathname.replace(/\.html$/i, "").replace(/\/+$/, "") || "/";
    if (p === "/dashboard" || p === "/") return "dashboard";
    if (p === "/activity") return "activity";
    if (p === "/calories") return "calories";
    if (p === "/medical") return "medical";
    return null;
  }
  async function authFetch(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    try { var t = window.Auth && Auth.token ? await Auth.token() : null; if (t) opts.headers.Authorization = "Bearer " + t; } catch (e) {}
    return fetch(path, opts);
  }
  function track(ev, props) { authFetch("/api/journey/event", { method: "POST", body: JSON.stringify({ event: ev, props: props || {} }) }).catch(function () {}); }

  // Cache lokal status (kalau server sesaat tak terjangkau, tur yang sudah selesai tetap tak muncul).
  var UID = "";
  function lcKey(k) { return "my20fit_tour_" + (UID || "anon") + "_" + k; }
  function lcGet(k) { try { return JSON.parse(localStorage.getItem(lcKey(k)) || "null"); } catch (e) { return null; } }
  function save(key, version, status, last, seen) {
    try { localStorage.setItem(lcKey(key), JSON.stringify({ version: version, status: status, last_step: last, seen_steps: seen })); } catch (e) {}
    return authFetch("/api/journey/tour", { method: "POST", body: JSON.stringify({ tour_key: key, version: version, status: status, last_step: last, seen_steps: seen }) }).catch(function () {});
  }

  // Elemen target: yang pertama TERLIHAT dari daftar selector (menu bawah di HP / sidebar desktop).
  function visible(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  }
  function pick(sel) {
    var list = Array.isArray(sel) ? sel : [sel];
    for (var i = 0; i < list.length; i++) {
      var els = document.querySelectorAll(list[i]);
      for (var j = 0; j < els.length; j++) if (visible(els[j])) return els[j];
    }
    return null;
  }
  function fill(o, vars) {
    var t = Lx(o), missing = false;
    t = t.replace(/\{(\w+)\}/g, function (m, k) { if (vars[k] == null || vars[k] === "") { missing = true; return ""; } return String(vars[k]); });
    return missing ? null : t;
  }
  // Satu langkah config -> langkah siap tampil, atau null (dilewati).
  function resolve(step, vars) {
    var useAlt = !!(step.alt && ((step.alt.if_not && !vars[step.alt.if_not]) || (step.need && vars[step.need] == null)));
    var s = useAlt ? Object.assign({}, step, step.alt) : step;
    var el = s.sel ? pick(s.sel) : null;
    if (s.sel && !el && !useAlt && step.alt) {   // target utama tak ada -> coba versi alt
      var a = Object.assign({}, step, step.alt); el = a.sel ? pick(a.sel) : null;
      if (!a.sel || el) { s = a; useAlt = true; }
    }
    if (s.sel && !el) return null;
    var title = fill(s.title, vars), body = fill(s.body, vars);
    if (title == null || body == null) return null;
    return { id: step.id, el: el, sel: s.sel, title: title, body: body, featured: !!s.featured, ctas: s.ctas || null };
  }

  // Modal lain terbuka -> tunggu (tur tak boleh bertumpuk dengan persetujuan/pembayaran/claim).
  var MODAL_SEL = "dialog[open], [aria-modal='true']:not(.tr-card), .modal.open, .modal.show, [data-modal-open]";
  function modalOpen() { var m = document.querySelector(MODAL_SEL); return !!(m && visible(m)); }
  function waitNoModal(maxMs) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function tick() { if (!modalOpen()) return res(true); if (Date.now() - t0 > (maxMs || 120000)) return res(false); setTimeout(tick, 600); })();
    });
  }

  function injectCSS() {
    if (document.getElementById("trcss")) return;
    var s = document.createElement("style"); s.id = "trcss";
    s.textContent =
      ".tr-block{position:fixed;inset:0;z-index:9000;background:transparent}" +
      ".tr-block.dim{background:rgba(8,8,10,.62)}" +
      ".tr-spot{position:fixed;z-index:9001;pointer-events:none;border-radius:12px;box-shadow:0 0 0 9999px rgba(8,8,10,.62);outline:2px solid #E4002B;outline-offset:2px;transition:all .25s ease}" +
      ".tr-card{position:fixed;z-index:9002;width:min(340px,calc(100vw - 24px));background:#1b1d22;color:#f4f5f7;border-radius:16px;padding:16px 16px 14px;box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:inherit;outline:none;transition:top .25s ease,left .25s ease}" +
      "html.theme-light .tr-card{background:#fff;color:#16170f}" +
      ".tr-top{display:flex;align-items:center;gap:8px;margin-bottom:6px}" +
      ".tr-step{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;opacity:.65}" +
      ".tr-feat{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;padding:2px 8px;border-radius:99px;background:#E4002B;color:#fff}" +
      ".tr-x{margin-left:auto;width:30px;height:30px;border:0;border-radius:99px;background:transparent;color:inherit;font-size:16px;cursor:pointer;opacity:.7}" +
      ".tr-card h2{font-size:17px;font-weight:800;margin:0 0 6px;line-height:1.3}" +
      ".tr-card p{font-size:13.5px;line-height:1.5;margin:0;opacity:.85}" +
      ".tr-ctas{display:flex;flex-direction:column;gap:8px;margin-top:12px}" +
      ".tr-cta{display:block;text-align:center;padding:11px;border-radius:11px;background:#E4002B;color:#fff;font-weight:800;font-size:13.5px;text-decoration:none;border:0;cursor:pointer;font-family:inherit}" +
      ".tr-cta.sec{background:transparent;color:inherit;border:1px solid rgba(128,128,128,.45)}" +
      ".tr-foot{display:flex;align-items:center;gap:8px;margin-top:14px}" +
      ".tr-skip{border:0;background:transparent;color:inherit;opacity:.7;font-size:12.5px;font-weight:700;cursor:pointer;padding:8px 4px;font-family:inherit;text-decoration:underline}" +
      ".tr-nav{margin-left:auto;display:flex;gap:8px}" +
      ".tr-btn{border:0;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;background:#E4002B;color:#fff}" +
      ".tr-btn.sec{background:transparent;color:inherit;border:1px solid rgba(128,128,128,.45)}" +
      ".tr-card :focus-visible{outline:2px solid #E4002B;outline-offset:2px}" +
      "@media (prefers-reduced-motion: reduce){.tr-spot,.tr-card{transition:none}}";
    document.head.appendChild(s);
  }

  var RUN = null;   // tur yang sedang berjalan
  function build() {
    injectCSS();
    var block = document.createElement("div"); block.className = "tr-block";
    var spot = document.createElement("div"); spot.className = "tr-spot";
    var card = document.createElement("div"); card.className = "tr-card"; card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "trTitle"); card.tabIndex = -1;
    document.body.appendChild(block); document.body.appendChild(spot); document.body.appendChild(card);
    RUN.dom = { block: block, spot: spot, card: card };
    RUN.prevFocus = document.activeElement;
    RUN.onKey = function (e) {
      if (!RUN) return;
      if (e.key === "Escape") { e.preventDefault(); finish("skipped"); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); back(); }
      else if (e.key === "Tab") {   // fokus terkunci di dalam tooltip
        var f = card.querySelectorAll("button,a[href]"); if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    RUN.onMove = function () { if (RUN && !RUN.raf) RUN.raf = requestAnimationFrame(function () { if (RUN) { RUN.raf = 0; place(); } }); };
    document.addEventListener("keydown", RUN.onKey);
    window.addEventListener("resize", RUN.onMove); window.addEventListener("scroll", RUN.onMove, true);
  }
  function place() {
    var st = RUN.steps[RUN.i], d = RUN.dom, vw = window.innerWidth, vh = window.innerHeight;
    var cw = d.card.offsetWidth, ch = d.card.offsetHeight;
    if (!st.el) {   // kartu tengah tanpa sorotan
      d.spot.style.display = "none"; d.block.classList.add("dim");
      d.card.style.left = Math.max(12, (vw - cw) / 2) + "px"; d.card.style.top = Math.max(12, (vh - ch) / 2) + "px"; return;
    }
    var r = st.el.getBoundingClientRect(), pad = 6;
    d.block.classList.remove("dim"); d.spot.style.display = "block";
    var top = Math.max(4, r.top - pad), bottom = Math.min(vh - 4, r.bottom + pad);
    d.spot.style.left = (r.left - pad) + "px"; d.spot.style.top = top + "px";
    d.spot.style.width = (r.width + pad * 2) + "px"; d.spot.style.height = Math.max(0, bottom - top) + "px";
    var y;
    if (vh - bottom >= ch + 16) y = bottom + 10;          // muat di bawah
    else if (top >= ch + 16) y = top - ch - 10;            // muat di atas
    else {                                                 // target lebih tinggi dari ruang: tooltip di bawah layar,
      y = vh - ch - 12;                                    // sorotan dipotong tepat di atasnya -> yang disorot tak tertutup
      d.spot.style.height = Math.max(24, y - 10 - top) + "px";
    }
    var x = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), vw - cw - 12);
    d.card.style.left = x + "px"; d.card.style.top = Math.max(12, y) + "px";
  }
  function render() {
    var st = RUN.steps[RUN.i], n = RUN.steps.length, last = RUN.i === n - 1, d = RUN.dom;
    d.card.innerHTML =
      '<div class="tr-top"><span class="tr-step">' + esc(Lx({ en: (RUN.i + 1) + " of " + n, id: (RUN.i + 1) + " dari " + n })) + '</span>' +
        (st.featured ? '<span class="tr-feat">' + esc(Lx({ en: "Featured", id: "Unggulan" })) + '</span>' : '') +
        '<button type="button" class="tr-x" data-tr="skip" aria-label="' + esc(Lx({ en: "Close tour", id: "Tutup tur" })) + '">✕</button></div>' +
      '<h2 id="trTitle">' + esc(st.title) + '</h2><p>' + esc(st.body) + '</p>' +
      (st.ctas ? '<div class="tr-ctas">' + st.ctas.map(function (c, k) {
        return (c.href ? '<a class="tr-cta' + (k ? ' sec' : '') + '" href="' + esc(c.href) + '" data-cta="' + esc(c.id) + '">' : '<button type="button" class="tr-cta' + (k ? ' sec' : '') + '" data-cta="' + esc(c.id) + '">') +
          esc(Lx(c.label)) + (c.href ? '</a>' : '</button>');
      }).join("") + '</div>' : '') +
      '<div class="tr-foot"><button type="button" class="tr-skip" data-tr="skip">' + esc(Lx({ en: "Skip tour", id: "Lewati tur" })) + '</button>' +
        '<span class="tr-nav">' + (RUN.i ? '<button type="button" class="tr-btn sec" data-tr="back">' + esc(Lx({ en: "Back", id: "Kembali" })) + '</button>' : '') +
        '<button type="button" class="tr-btn" data-tr="next">' + esc(last ? Lx({ en: "Done", id: "Selesai" }) : Lx({ en: "Next", id: "Lanjut" })) + '</button></span></div>';
    Array.prototype.forEach.call(d.card.querySelectorAll("[data-tr]"), function (b) {
      var a = b.getAttribute("data-tr"); b.onclick = a === "skip" ? function () { finish("skipped"); } : a === "back" ? back : next;
    });
    Array.prototype.forEach.call(d.card.querySelectorAll("[data-cta]"), function (b) {
      b.onclick = function (e) {
        var id = b.getAttribute("data-cta"), c = (st.ctas || []).filter(function (x) { return x.id === id; })[0] || {};
        e.preventDefault(); finish("completed", id);
        if (c.href) location.href = c.href; else if (c.action && RUN_OPTS.onCta) RUN_OPTS.onCta(c.action);
      };
    });
    RUN.seen[st.id] = 1;
    track("tour_step_viewed", { tour: RUN.key, step: RUN.i + 1, total: n });
    save(RUN.key, RUN.version, "in_progress", RUN.i, seenList());
    if (st.el) { try { st.el.scrollIntoView({ block: st.el.getBoundingClientRect().height > window.innerHeight * 0.5 ? "start" : "center", behavior: REDUCE ? "auto" : "smooth" }); } catch (e) {} }
    place(); setTimeout(function () { if (RUN) place(); }, REDUCE ? 0 : 380);
    try { d.card.focus({ preventScroll: true }); } catch (e) { d.card.focus(); }
  }
  function seenList() {
    var prev = RUN.prevSeen || [], out = prev.slice();
    Object.keys(RUN.seen).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); });
    return out;
  }
  async function next() {
    if (!RUN) return;
    if (RUN.i >= RUN.steps.length - 1) { finish("completed"); return; }
    RUN.i++;
    if (modalOpen()) { RUN.dom.card.style.visibility = "hidden"; await waitNoModal(); if (!RUN) return; RUN.dom.card.style.visibility = ""; }
    render();
  }
  function back() { if (!RUN || !RUN.i) return; RUN.i--; render(); }
  var RUN_OPTS = {};
  function finish(status, ctaId) {
    if (!RUN) return;
    var r = RUN; RUN = null;
    document.removeEventListener("keydown", r.onKey);
    window.removeEventListener("resize", r.onMove); window.removeEventListener("scroll", r.onMove, true);
    ["block", "spot", "card"].forEach(function (k) { if (r.dom[k] && r.dom[k].parentNode) r.dom[k].parentNode.removeChild(r.dom[k]); });
    // Selesai/dilewati = semua langkah versi ini dianggap sudah (versi baru nanti hanya menampilkan langkah baru).
    var all = (CFG[r.key].steps || []).map(function (s) { return s.id; });
    var seen = (r.prevSeen || []).slice(); all.forEach(function (k) { if (seen.indexOf(k) < 0) seen.push(k); });
    save(r.key, r.version, status, r.i, seen);
    if (status === "completed") track("tour_completed", { tour: r.key, total: r.steps.length });
    else track("tour_skipped", { tour: r.key, step: r.i + 1, total: r.steps.length });
    if (ctaId) track("tour_cta_clicked", { tour: r.key, cta: ctaId });
    try { sessionStorage.setItem("my20fit_tour_ended", r.key); } catch (e) {}
    try { if (r.prevFocus && r.prevFocus.focus) r.prevFocus.focus({ preventScroll: true }); } catch (e) {}
  }

  // opts: {replay, resumeAt, onlyNew:[id...], prevSeen, vars, onCta}
  async function start(key, opts) {
    opts = opts || {};
    var cfg = CFG[key]; if (!cfg || RUN) return false;
    var vars = opts.vars || {};
    var steps = cfg.steps.filter(function (s) { return !opts.onlyNew || opts.onlyNew.indexOf(s.id) < 0; })
      .map(function (s) { return resolve(s, vars); }).filter(Boolean);
    if (!steps.length) { if (opts.onlyNew) save(key, cfg.version, "completed", 0, opts.prevSeen || []); return false; }
    if (!(await waitNoModal())) return false;
    if (RUN) return false;
    RUN_OPTS = opts;
    RUN = { key: key, version: cfg.version, steps: steps, i: Math.min(Math.max(0, opts.resumeAt || 0), steps.length - 1), seen: {}, prevSeen: opts.prevSeen || [] };
    build();
    track(opts.replay ? "tour_replayed" : "tour_started", { tour: key, total: steps.length });
    render();
    return true;
  }

  // Tur yang berhak tampil di halaman ini (satu per kunjungan). state = respons /api/journey/state
  // (halaman boleh mengoper miliknya supaya tidak fetch dua kali).
  async function auto(opts) {
    opts = opts || {};
    var page = pageKey(); if (!page) return;
    try { var u = window.Auth && Auth.getUser ? await Auth.getUser() : null; UID = (u && u.id) || ""; } catch (e) {}
    var st = opts.state;
    if (!st) {
      try { var r = await authFetch("/api/journey/state"); st = r.ok ? await r.json() : null; } catch (e) { st = null; }
    }
    var tours = (st && st.tours) || {}, hasScan = !!(st && st.has_claimed_scan);
    // ?tour=<key> -> putar ulang manual (mis. dari Profil).
    var want = null; try { want = new URLSearchParams(location.search).get("tour"); } catch (e) {}
    if (want && CFG[want] && CFG[want].page === page) {
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {}
      start(want, { replay: true, vars: opts.vars, onCta: opts.onCta }); return;
    }
    var ended = null; try { ended = sessionStorage.getItem("my20fit_tour_ended"); } catch (e) {}
    var keys = Object.keys(CFG).filter(function (k) { return CFG[k].page === page; });
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], c = CFG[k];
      if (c.auto_if === "has_scan" && !hasScan) continue;
      if (c.auto_if === "no_scan" && hasScan) continue;
      var s = tours[k] || (st ? null : lcGet(k));
      if (!st && !s) continue;   // status tak diketahui (server gagal) -> jangan ganggu
      // Tanda tur lama (localStorage per device) dihormati: dianggap sudah selesai versi 1.
      if (!s && c.legacy_flag) {
        var legacy = null; try { legacy = localStorage.getItem(c.legacy_flag + "_" + UID); } catch (e) {}
        if (legacy === "1") { save(k, 1, "completed", 0, c.steps.map(function (x) { return x.id; })); continue; }
      }
      if (c.after) {   // tur halaman (F3) baru muncul setelah tur utamanya beres, dan tidak di kunjungan yang sama
        var a = tours[c.after];
        if (!a || (a.status !== "completed" && a.status !== "skipped") || ended === c.after) continue;
      }
      var base = { vars: opts.vars, onCta: opts.onCta };
      if (!s || s.status === "not_started") { if (await start(k, base)) return; continue; }
      if (s.status === "in_progress" && s.version === c.version) { if (await start(k, Object.assign(base, { resumeAt: s.last_step, prevSeen: s.seen_steps }))) return; continue; }
      if ((s.status === "completed" || s.status === "skipped") && s.version < c.version) {
        if (await start(k, Object.assign(base, { onlyNew: s.seen_steps || [], prevSeen: s.seen_steps || [] }))) return;
      }
    }
  }

  window.Tour = { auto: auto, start: function (key, opts) { return start(key, Object.assign({ replay: true }, opts || {})); } };
  function boot() {
    if (!pageKey() || document.body.hasAttribute("data-tour-manual")) return;
    setTimeout(function () { auto({}); }, 1000);   // beri waktu nav & data halaman termuat
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
