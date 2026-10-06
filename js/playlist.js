/* playlist.js — Playlist 20FIT (Fase 5 step 1: Library gerakan).
 * Katalog gerakan dari my20fit_exercise lewat /api/activity/exercises (hanya is_published).
 * Filter: grup fokus, otot (muscle_keys), pencarian nama. Detail = tutorial (video + cue + kontraindikasi).
 * Vanilla, mobile-first, i18n EN/ID, dark mode. WAJIB login.
 * Membuat/menjalankan playlist = langkah berikutnya.
 */
(function () {
  "use strict";
  var user = null;
  var STATE = { tab: "browse", group: "", muscle: "", q: "" };
  var GROUPS = null;         // [{group,n}] dari server (dibangun sekali)
  var EXS = [];              // hasil terakhir
  var LOADING = false, _qTimer = null;

  // Label otot (canonical key -> ID/EN) untuk chip & detail.
  var MUSCLE_LBL = {
    chest: { en: "Chest", id: "Dada" }, front_delts: { en: "Front delts", id: "Deltoid depan" },
    side_delts: { en: "Side delts", id: "Deltoid samping" }, rear_delts: { en: "Rear delts", id: "Deltoid belakang" },
    biceps: { en: "Biceps", id: "Bisep" }, triceps: { en: "Triceps", id: "Trisep" }, forearms: { en: "Forearms", id: "Lengan bawah" },
    abs: { en: "Abs", id: "Perut" }, obliques: { en: "Obliques", id: "Oblik" }, traps: { en: "Traps", id: "Trapezius" },
    lats: { en: "Lats", id: "Latissimus" }, upper_back: { en: "Upper back", id: "Punggung atas" }, lower_back: { en: "Lower back", id: "Punggung bawah" },
    glutes: { en: "Glutes", id: "Bokong" }, quads: { en: "Quads", id: "Paha depan" }, hamstrings: { en: "Hamstrings", id: "Paha belakang" },
    adductors: { en: "Adductors", id: "Paha dalam" }, abductors: { en: "Abductors", id: "Paha luar" }, calves: { en: "Calves", id: "Betis" }
  };
  // Urutan otot untuk daftar chip (hanya yang benar-benar dipakai gerakan ditampilkan).
  var MUSCLE_ORDER = ["chest", "front_delts", "side_delts", "rear_delts", "biceps", "triceps", "forearms",
    "abs", "obliques", "traps", "lats", "upper_back", "lower_back", "glutes", "quads", "hamstrings", "adductors", "abductors", "calves"];

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function Lx(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function lang() { return (window.I18N && I18N.lang === "en") ? "en" : "id"; }
  function ic(n, sz) { return window.FIC && FIC.has && FIC.has(n) ? FIC(n, sz || 16) : '<svg viewBox="0 0 24 24" width="' + (sz || 16) + '" height="' + (sz || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5v5M6.5 8v8M17.5 8v8M20.5 9.5v5M6.5 12h11"/></svg>'; }
  function mLabel(k) { return MUSCLE_LBL[k] ? Lx(MUSCLE_LBL[k]) : k; }

  async function apiFetch(path, opts) {
    opts = opts || {}; opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var tk = await Auth.token(); if (tk) opts.headers.Authorization = "Bearer " + tk;
    return fetch(path, opts);
  }

  // ---- Load & render library ----
  async function loadLib() {
    if (LOADING) return; LOADING = true;
    var box = el("libBox");
    box.innerHTML = '<div class="grid">' + Array.from({ length: 6 }).map(function () { return '<div class="skel" style="height:96px"></div>'; }).join("") + '</div>';
    try {
      var p = new URLSearchParams();
      if (STATE.group) p.set("group", STATE.group);
      if (STATE.muscle) p.set("muscle", STATE.muscle);
      if (STATE.q) p.set("q", STATE.q);
      var r = await apiFetch("/api/activity/exercises?" + p.toString());
      if (r.status === 401) { location.href = "/login"; return; }
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "load");
      EXS = (j && j.exercises) || [];
      if (!GROUPS && j.groups) { GROUPS = j.groups; renderGroupChips(); renderMuscleChips(); }
      renderGrid();
    } catch (e) {
      box.innerHTML = '<div class="err">' + esc(Lx({ en: "Couldn't load movements.", id: "Gagal memuat gerakan." })) +
        '<div><button type="button" class="retry" id="retryLib">' + esc(Lx({ en: "Retry", id: "Coba lagi" })) + '</button></div></div>';
      var rb = el("retryLib"); if (rb) rb.onclick = loadLib;
    }
    LOADING = false;
  }

  function renderGroupChips() {
    var host = el("groupChips"); if (!host || !GROUPS) return;
    var all = '<button type="button" class="chip' + (STATE.group ? "" : " on") + '" data-g="">' +
      esc(Lx({ en: "All", id: "Semua" })) + '</button>';
    host.innerHTML = all + GROUPS.map(function (g) {
      return '<button type="button" class="chip' + (STATE.group === g.group ? " on" : "") + '" data-g="' + esc(g.group) + '">' +
        esc(g.group) + ' <span class="muted">' + g.n + '</span></button>';
    }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-g]"), function (b) {
      b.onclick = function () { STATE.group = b.getAttribute("data-g"); renderGroupChips(); loadLib(); };
    });
  }
  function renderMuscleChips() {
    var host = el("muscleChips"); if (!host) return;
    host.innerHTML = MUSCLE_ORDER.map(function (k) {
      return '<button type="button" class="chip' + (STATE.muscle === k ? " on" : "") + '" data-m="' + k + '">' + esc(mLabel(k)) + '</button>';
    }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-m]"), function (b) {
      b.onclick = function () { var k = b.getAttribute("data-m"); STATE.muscle = (STATE.muscle === k) ? "" : k; renderMuscleChips(); loadLib(); };
    });
  }

  function renderGrid() {
    var box = el("libBox"), cnt = el("count");
    if (cnt) cnt.textContent = EXS.length + " " + Lx({ en: "movements", id: "gerakan" });
    if (!EXS.length) {
      box.innerHTML = '<div class="empty">' + esc(Lx({ en: "No movements match your filter.", id: "Tidak ada gerakan yang cocok dengan filtermu." })) + '</div>';
      return;
    }
    box.innerHTML = '<div class="grid">' + EXS.map(function (e, i) {
      var muscles = (e.muscle_keys || []).slice(0, 3).map(function (k) { return '<span>' + esc(mLabel(k)) + '</span>'; }).join("");
      var hasVid = !!(e.video_url && String(e.video_url).trim());
      return '<button type="button" class="ex" data-i="' + i + '">' +
        '<div class="ex-top"><span class="ex-thumb">' + ic("dumbbell", 20) + '</span>' +
        '<span style="flex:1;min-width:0"><span class="ex-n" style="display:block">' + esc(e.name) + '</span>' +
        '<span class="ex-g" style="display:block">' + esc(e.focus_group) + '</span></span>' +
        '<span class="ex-vid' + (hasVid ? ' has' : '') + '">' + ic("play", 12) + (hasVid ? esc(Lx({ en: "video", id: "video" })) : esc(Lx({ en: "soon", id: "menyusul" }))) + '</span></div>' +
        (muscles ? '<span class="ex-m">' + muscles + '</span>' : '') +
        '</button>';
    }).join("") + '</div>';
    Array.prototype.forEach.call(box.querySelectorAll(".ex[data-i]"), function (b) {
      b.onclick = function () { openDetail(EXS[+b.getAttribute("data-i")]); };
    });
  }

  // ---- Detail modal (tutorial) ----
  function ytId(url) {
    var s = String(url || "").trim(); if (!s) return "";
    if (/^[\w-]{11}$/.test(s)) return s;
    var m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    return m ? m[1] : "";
  }
  function openDetail(e) {
    if (!e) return;
    var vid = ytId(e.video_url);
    var videoHtml = vid
      ? '<div class="video-wrap"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/' + esc(vid) + '?rel=0" title="' + esc(e.name) + '" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe></div>'
      : '<div class="video-none">' + ic("play", 22) + '<span>' + esc(Lx({ en: "Tutorial video coming soon", id: "Video tutorial menyusul" })) + '</span></div>';
    var muscles = (e.muscle_keys || []).map(function (k) { return '<span>' + esc(mLabel(k)) + '</span>'; }).join("");
    var cue = (e.cue_teknik && String(e.cue_teknik).trim())
      ? '<div class="sec-lbl">' + esc(Lx({ en: "Technique", id: "Teknik" })) + '</div><p class="body">' + esc(e.cue_teknik).replace(/\n/g, "<br>") + '</p>'
      : '<div class="sec-lbl">' + esc(Lx({ en: "Technique", id: "Teknik" })) + '</div><p class="body muted">' + esc(Lx({ en: "Technique cues coming soon.", id: "Panduan teknik menyusul." })) + '</p>';
    var contra = (e.kontraindikasi && String(e.kontraindikasi).trim())
      ? '<div class="warnbox">' + ic("warn", 14) + ' ' + esc(e.kontraindikasi) + '</div>' : '';
    el("exSheet").innerHTML =
      '<div class="sheet-h"><h2>' + esc(e.name) + '</h2><button type="button" class="sheet-x" id="exClose" aria-label="Close">×</button></div>' +
      '<div class="sheet-g">' + esc(e.focus_group) + (e.level ? ' · ' + esc(e.level) : '') + '</div>' +
      videoHtml +
      (muscles ? '<div class="sec-lbl">' + esc(Lx({ en: "Muscles", id: "Otot" })) + '</div><div class="ex-m" style="margin-bottom:4px">' + muscles + '</div>' : '') +
      cue + contra;
    el("exClose").onclick = closeDetail;
    el("exModal").classList.add("on");
  }
  function closeDetail() { el("exModal").classList.remove("on"); el("exSheet").innerHTML = ""; }

  // ---- Tabs ----
  function setTab(t) {
    STATE.tab = t;
    Array.prototype.forEach.call(document.querySelectorAll(".ptab"), function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === t); });
    el("viewBrowse").style.display = (t === "browse") ? "" : "none";
    el("viewMine").style.display = (t === "mine") ? "" : "none";
  }

  function applyPlaceholders() {
    var q = el("q"); if (q) q.placeholder = (lang() === "en") ? (q.getAttribute("data-en-ph") || "") : (q.getAttribute("data-id-ph") || "");
  }

  async function boot() {
    try { user = await Auth.requireAuth(); } catch (e) { location.href = "/login"; return; }
    applyPlaceholders();
    Array.prototype.forEach.call(document.querySelectorAll(".ptab"), function (b) { b.onclick = function () { setTab(b.getAttribute("data-tab")); }; });
    var q = el("q");
    if (q) q.addEventListener("input", function () { clearTimeout(_qTimer); _qTimer = setTimeout(function () { STATE.q = q.value.trim(); loadLib(); }, 280); });
    el("exModal").addEventListener("click", function (ev) { if (ev.target === el("exModal")) closeDetail(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeDetail(); });
    if (window.I18N && I18N.onChange) I18N.onChange(function () { applyPlaceholders(); if (GROUPS) { renderGroupChips(); renderMuscleChips(); } renderGrid(); });
    loadLib();
  }
  boot();
})();
