/* playlist.js — Playlist 20FIT (Fase 5).
 * step 1: library gerakan (my20fit_exercise via /api/activity/exercises).
 * step 2: builder (buat/edit/hapus playlist) + estimasi durasi live + "Playlist Saya".
 * Rute: /playlist (library+mine), /playlist/new (builder baru), /playlist/:id (builder edit).
 * Vanilla, mobile-first, i18n EN/ID, dark mode. WAJIB login. Player = step berikutnya.
 */
(function () {
  "use strict";
  var user = null;
  var STATE = { tab: "browse", group: "", muscle: "", q: "" };
  var GROUPS = null, EXS = [], LOADING = false, _qTimer = null;
  var CFG = { detik_per_rep: 3, transisi_antar_gerakan_detik: 15, rest_default_detik: 60 };
  var MINE = null;
  var BUILD = null;                 // {id, name, goal, items:[...]} saat mode builder
  var PICK = { q: "", group: "", list: [], groups: null, _t: null };
  var MODE_TIME_GROUPS = { "Kardio": 1, "Kelincahan": 1, "HYROX": 1 };

  var MUSCLE_LBL = {
    chest: { en: "Chest", id: "Dada" }, front_delts: { en: "Front delts", id: "Deltoid depan" },
    side_delts: { en: "Side delts", id: "Deltoid samping" }, rear_delts: { en: "Rear delts", id: "Deltoid belakang" },
    biceps: { en: "Biceps", id: "Bisep" }, triceps: { en: "Triceps", id: "Trisep" }, forearms: { en: "Forearms", id: "Lengan bawah" },
    abs: { en: "Abs", id: "Perut" }, obliques: { en: "Obliques", id: "Oblik" }, traps: { en: "Traps", id: "Trapezius" },
    lats: { en: "Lats", id: "Latissimus" }, upper_back: { en: "Upper back", id: "Punggung atas" }, lower_back: { en: "Lower back", id: "Punggung bawah" },
    glutes: { en: "Glutes", id: "Bokong" }, quads: { en: "Quads", id: "Paha depan" }, hamstrings: { en: "Hamstrings", id: "Paha belakang" },
    adductors: { en: "Adductors", id: "Paha dalam" }, abductors: { en: "Abductors", id: "Paha luar" }, calves: { en: "Calves", id: "Betis" }
  };
  var MUSCLE_ORDER = ["chest", "front_delts", "side_delts", "rear_delts", "biceps", "triceps", "forearms",
    "abs", "obliques", "traps", "lats", "upper_back", "lower_back", "glutes", "quads", "hamstrings", "adductors", "abductors", "calves"];

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function Lx(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function lang() { return (window.I18N && I18N.lang === "en") ? "en" : "id"; }
  function ic(n, sz) { return window.FIC && FIC.has && FIC.has(n) ? FIC(n, sz || 16) : '<svg viewBox="0 0 24 24" width="' + (sz || 16) + '" height="' + (sz || 16) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5v5M6.5 8v8M17.5 8v8M20.5 9.5v5M6.5 12h11"/></svg>'; }
  function mLabel(k) { return MUSCLE_LBL[k] ? Lx(MUSCLE_LBL[k]) : k; }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec || 0)); var m = Math.round(sec / 60);
    if (m < 60) return "~" + m + " " + Lx({ en: "min", id: "mnt" });
    var h = Math.floor(m / 60), r = m % 60; return "~" + h + "j" + (r ? " " + r + "m" : "");
  }

  async function apiFetch(path, opts) {
    opts = opts || {}; opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var tk = await Auth.token(); if (tk) opts.headers.Authorization = "Bearer " + tk;
    return fetch(path, opts);
  }
  function showErr(m) { var b = el("errBox"); if (b) b.innerHTML = m ? '<div class="err">' + esc(m) + '</div>' : ""; }

  // ===================== VIEW SWITCH =====================
  function showView(v) {
    var tabs = document.querySelector(".ptabs");
    el("viewBrowse").style.display = (v === "browse") ? "" : "none";
    el("viewMine").style.display = (v === "mine") ? "" : "none";
    el("viewBuilder").style.display = (v === "builder") ? "" : "none";
    if (tabs) tabs.style.display = (v === "builder") ? "none" : "";
    var h1 = document.querySelector(".chead h1"), bk = document.querySelector(".chead .bk");
    if (v === "builder") { if (h1) h1.textContent = BUILD && BUILD.id ? Lx({ en: "Edit playlist", id: "Edit playlist" }) : Lx({ en: "New playlist", id: "Buat playlist" }); if (bk) bk.setAttribute("href", "/playlist"); }
    else { if (h1) h1.textContent = "Playlist"; if (bk) bk.setAttribute("href", "/activity"); }
  }
  function setTab(t) {
    STATE.tab = t;
    Array.prototype.forEach.call(document.querySelectorAll(".ptab"), function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === t); });
    showView(t);
    if (t === "mine" && MINE === null) loadMine();
  }

  // ===================== LIBRARY =====================
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
    host.innerHTML = '<button type="button" class="chip' + (STATE.group ? "" : " on") + '" data-g="">' + esc(Lx({ en: "All", id: "Semua" })) + '</button>' +
      GROUPS.map(function (g) { return '<button type="button" class="chip' + (STATE.group === g.group ? " on" : "") + '" data-g="' + esc(g.group) + '">' + esc(g.group) + ' <span class="muted">' + g.n + '</span></button>'; }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-g]"), function (b) { b.onclick = function () { STATE.group = b.getAttribute("data-g"); renderGroupChips(); loadLib(); }; });
  }
  function renderMuscleChips() {
    var host = el("muscleChips"); if (!host) return;
    host.innerHTML = MUSCLE_ORDER.map(function (k) { return '<button type="button" class="chip' + (STATE.muscle === k ? " on" : "") + '" data-m="' + k + '">' + esc(mLabel(k)) + '</button>'; }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-m]"), function (b) { b.onclick = function () { var k = b.getAttribute("data-m"); STATE.muscle = (STATE.muscle === k) ? "" : k; renderMuscleChips(); loadLib(); }; });
  }
  function renderGrid() {
    var box = el("libBox"), cnt = el("count");
    if (cnt) cnt.textContent = EXS.length + " " + Lx({ en: "movements", id: "gerakan" });
    if (!EXS.length) { box.innerHTML = '<div class="empty">' + esc(Lx({ en: "No movements match your filter.", id: "Tidak ada gerakan yang cocok dengan filtermu." })) + '</div>'; return; }
    box.innerHTML = '<div class="grid">' + EXS.map(function (e, i) {
      var muscles = (e.muscle_keys || []).slice(0, 3).map(function (k) { return '<span>' + esc(mLabel(k)) + '</span>'; }).join("");
      var hasVid = !!(e.video_url && String(e.video_url).trim());
      return '<button type="button" class="ex" data-i="' + i + '"><div class="ex-top"><span class="ex-thumb">' + ic("dumbbell", 20) + '</span>' +
        '<span style="flex:1;min-width:0"><span class="ex-n" style="display:block">' + esc(e.name) + '</span><span class="ex-g" style="display:block">' + esc(e.focus_group) + '</span></span>' +
        '<span class="ex-vid' + (hasVid ? ' has' : '') + '">' + ic("play", 12) + (hasVid ? esc(Lx({ en: "video", id: "video" })) : esc(Lx({ en: "soon", id: "menyusul" }))) + '</span></div>' +
        (muscles ? '<span class="ex-m">' + muscles + '</span>' : '') + '</button>';
    }).join("") + '</div>';
    Array.prototype.forEach.call(box.querySelectorAll(".ex[data-i]"), function (b) { b.onclick = function () { openDetail(EXS[+b.getAttribute("data-i")]); }; });
  }

  // ===================== DETAIL MODAL =====================
  function ytId(url) { var s = String(url || "").trim(); if (!s) return ""; if (/^[\w-]{11}$/.test(s)) return s; var m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/); return m ? m[1] : ""; }
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
    var contra = (e.kontraindikasi && String(e.kontraindikasi).trim()) ? '<div class="warnbox">' + ic("warn", 14) + ' ' + esc(e.kontraindikasi) + '</div>' : '';
    el("exSheet").innerHTML =
      '<div class="sheet-h"><h2>' + esc(e.name) + '</h2><button type="button" class="sheet-x" id="exClose" aria-label="Close">×</button></div>' +
      '<div class="sheet-g">' + esc(e.focus_group) + (e.level ? ' · ' + esc(e.level) : '') + '</div>' + videoHtml +
      (muscles ? '<div class="sec-lbl">' + esc(Lx({ en: "Muscles", id: "Otot" })) + '</div><div class="ex-m" style="margin-bottom:4px">' + muscles + '</div>' : '') + cue + contra;
    el("exClose").onclick = function () { el("exModal").classList.remove("on"); };
    el("exModal").classList.add("on");
  }

  // ===================== MY PLAYLISTS =====================
  async function loadMine() {
    var box = el("mineBox"); box.innerHTML = '<div class="skel" style="height:70px"></div>';
    try {
      var r = await apiFetch("/api/activity/playlists");
      if (r.status === 401) { location.href = "/login"; return; }
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "load");
      MINE = (j && j.playlists) || [];
      renderMine();
    } catch (e) {
      box.innerHTML = '<div class="err">' + esc(Lx({ en: "Couldn't load playlists.", id: "Gagal memuat playlist." })) + ' <button type="button" class="retry" id="retryMine">' + esc(Lx({ en: "Retry", id: "Coba lagi" })) + '</button></div>';
      var rb = el("retryMine"); if (rb) rb.onclick = loadMine;
    }
  }
  function renderMine() {
    var box = el("mineBox");
    if (!MINE || !MINE.length) { box.innerHTML = '<div class="empty">' + esc(Lx({ en: "No playlists yet. Tap “Create playlist” to build one.", id: "Belum ada playlist. Ketuk “Buat playlist” untuk mulai." })) + '</div>'; return; }
    box.innerHTML = '<div class="plist">' + MINE.map(function (p) {
      var sub = p.items + " " + Lx({ en: "movements", id: "gerakan" }) + " · " + fmtDur(p.est_duration_sec) + (p.goal ? " · " + esc(p.goal) : "");
      return '<div class="pcard"><span class="pc-i">' + ic("dumbbell", 22) + '</span>' +
        '<span style="flex:1;min-width:0"><span class="pc-n" style="display:block">' + esc(p.name) + '</span><span class="pc-s" style="display:block">' + sub + '</span></span>' +
        '<span class="pc-act"><button type="button" class="pc-btn" data-edit="' + esc(p.id) + '">' + esc(Lx({ en: "Edit", id: "Edit" })) + '</button>' +
        '<button type="button" class="pc-btn del" data-del="' + esc(p.id) + '" data-nm="' + esc(p.name) + '">' + esc(Lx({ en: "Delete", id: "Hapus" })) + '</button></span></div>';
    }).join("") + '</div>';
    Array.prototype.forEach.call(box.querySelectorAll("[data-edit]"), function (b) { b.onclick = function () { location.href = "/playlist/" + b.getAttribute("data-edit"); }; });
    Array.prototype.forEach.call(box.querySelectorAll("[data-del]"), function (b) { b.onclick = function () { delPlaylist(b.getAttribute("data-del"), b.getAttribute("data-nm")); }; });
  }
  async function delPlaylist(id, nm) {
    if (!confirm(Lx({ en: "Delete playlist", id: "Hapus playlist" }) + ' "' + nm + '"?')) return;
    try {
      var r = await apiFetch("/api/activity/playlists/" + encodeURIComponent(id), { method: "DELETE" });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "del");
      MINE = (MINE || []).filter(function (p) { return p.id !== id; }); renderMine();
    } catch (e) { alert(Lx({ en: "Couldn't delete the playlist.", id: "Gagal menghapus playlist." })); }
  }

  // ===================== BUILDER =====================
  function estFromItems(items) {
    var est = 0;
    items.forEach(function (it) {
      var sets = Math.max(1, parseInt(it.sets, 10) || 1);
      var rest = (it.rest_sec == null || it.rest_sec === "") ? CFG.rest_default_detik : (parseInt(it.rest_sec, 10) || 0);
      var per = (it.mode === "time") ? (parseInt(it.duration_sec, 10) || 0) : (parseInt(it.reps, 10) || 0) * CFG.detik_per_rep;
      est += sets * per + Math.max(0, sets - 1) * rest;
    });
    est += CFG.transisi_antar_gerakan_detik * Math.max(0, items.length - 1);
    return est;
  }
  function refreshEst() {
    var c = el("bCount"), e = el("bEst");
    if (c) c.textContent = BUILD.items.length + " " + Lx({ en: "movements", id: "gerakan" });
    if (e) e.textContent = fmtDur(estFromItems(BUILD.items));
  }
  function itemRow(it, i) {
    var muscles = (it.muscle_keys || []).slice(0, 3).map(function (k) { return '<span>' + esc(mLabel(k)) + '</span>'; }).join("");
    var valField = (it.mode === "time")
      ? '<div class="bfield"><label>' + esc(Lx({ en: "Seconds", id: "Detik" })) + '</label><input type="number" inputmode="numeric" min="1" data-f="duration_sec" value="' + esc(it.duration_sec || "") + '"></div>'
      : '<div class="bfield"><label>' + esc(Lx({ en: "Reps", id: "Rep" })) + '</label><input type="number" inputmode="numeric" min="1" data-f="reps" value="' + esc(it.reps || "") + '"></div>';
    return '<div class="bitem" data-i="' + i + '">' +
      '<div class="bitem-h"><span style="flex:1;min-width:0"><span class="bitem-n" style="display:block">' + esc(it.name) + '</span>' +
      '<span class="bitem-g" style="display:block">' + esc(it.focus_group) + '</span>' + (muscles ? '<span class="ex-m" style="margin-top:4px">' + muscles + '</span>' : '') + '</span>' +
      '<span class="bmove"><button type="button" data-mv="up"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-mv="down"' + (i === BUILD.items.length - 1 ? ' disabled' : '') + '>↓</button></span>' +
      '<button type="button" class="bitem-rm" data-rm aria-label="Remove">×</button></div>' +
      '<div class="modetog"><button type="button" data-mode="reps" class="' + (it.mode !== "time" ? "on" : "") + '">' + esc(Lx({ en: "Reps", id: "Rep" })) + '</button>' +
      '<button type="button" data-mode="time" class="' + (it.mode === "time" ? "on" : "") + '">' + esc(Lx({ en: "Time", id: "Waktu" })) + '</button></div>' +
      '<div class="brow"><div class="bfield"><label>' + esc(Lx({ en: "Sets", id: "Set" })) + '</label><input type="number" inputmode="numeric" min="1" data-f="sets" value="' + esc(it.sets) + '"></div>' +
      valField +
      '<div class="bfield"><label>' + esc(Lx({ en: "Rest (s)", id: "Rest (dtk)" })) + '</label><input type="number" inputmode="numeric" min="0" data-f="rest_sec" value="' + esc(it.rest_sec == null ? "" : it.rest_sec) + '" placeholder="' + CFG.rest_default_detik + '"></div></div>' +
      '</div>';
  }
  function renderItems() {
    var box = el("bItems");
    if (!BUILD.items.length) { box.innerHTML = '<div class="empty" style="margin-bottom:8px">' + esc(Lx({ en: "No movements yet — add from the catalog.", id: "Belum ada gerakan — tambah dari katalog." })) + '</div>'; refreshEst(); return; }
    box.innerHTML = BUILD.items.map(itemRow).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".bitem"), function (row) {
      var i = +row.getAttribute("data-i"), it = BUILD.items[i];
      row.querySelector("[data-rm]").onclick = function () { BUILD.items.splice(i, 1); renderItems(); };
      Array.prototype.forEach.call(row.querySelectorAll("[data-mv]"), function (b) {
        b.onclick = function () { var d = b.getAttribute("data-mv") === "up" ? -1 : 1, j = i + d; if (j < 0 || j >= BUILD.items.length) return; var t = BUILD.items[i]; BUILD.items[i] = BUILD.items[j]; BUILD.items[j] = t; renderItems(); };
      });
      Array.prototype.forEach.call(row.querySelectorAll("[data-mode]"), function (b) {
        b.onclick = function () { var m = b.getAttribute("data-mode"); it.mode = m; if (m === "time" && !it.duration_sec) it.duration_sec = 45; if (m === "reps" && !it.reps) it.reps = 10; renderItems(); };
      });
      Array.prototype.forEach.call(row.querySelectorAll("[data-f]"), function (inp) {
        inp.onchange = inp.oninput = function () { var f = inp.getAttribute("data-f"); it[f] = inp.value === "" ? (f === "rest_sec" ? null : it[f]) : parseInt(inp.value, 10); refreshEst(); };
      });
    });
    refreshEst();
  }
  function renderBuilder() {
    showView("builder"); showErr("");
    el("plName").value = BUILD.name || "";
    el("plGoal").value = BUILD.goal || "";
    renderItems();
  }
  async function openBuilder(id) {
    BUILD = { id: null, name: "", goal: "", items: [] };
    if (!id || id === "new") { renderBuilder(); return; }
    showView("builder"); el("bItems").innerHTML = '<div class="skel" style="height:90px"></div>';
    try {
      var r = await apiFetch("/api/activity/playlists/" + encodeURIComponent(id));
      if (r.status === 401) { location.href = "/login"; return; }
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "load");
      BUILD = { id: j.playlist.id, name: j.playlist.name, goal: j.playlist.goal || "", items: (j.items || []).map(function (it) {
        var ex = it.exercise || {};
        return { exercise_id: it.exercise_id, name: ex.name || "(?)", focus_group: ex.focus_group || "", muscle_keys: ex.muscle_keys || [],
          mode: (it.duration_sec != null) ? "time" : "reps", sets: it.sets || 1, reps: it.reps, duration_sec: it.duration_sec, rest_sec: it.rest_sec };
      }) };
      renderBuilder();
    } catch (e) { showView("builder"); el("bItems").innerHTML = '<div class="err">' + esc(Lx({ en: "Couldn't load the playlist.", id: "Gagal memuat playlist." })) + '</div>'; }
  }
  async function savePlaylist() {
    var name = el("plName").value.trim();
    if (!name) { showErr(Lx({ en: "Playlist name is required.", id: "Nama playlist wajib diisi." })); el("plName").focus(); return; }
    if (!BUILD.items.length) { showErr(Lx({ en: "Add at least one movement.", id: "Tambah minimal satu gerakan." })); return; }
    var btn = el("bSave"); btn.disabled = true; var old = btn.textContent; btn.textContent = Lx({ en: "Saving…", id: "Menyimpan…" });
    var payload = { name: name, goal: el("plGoal").value.trim() || null, items: BUILD.items.map(function (it) {
      return { exercise_id: it.exercise_id, sets: it.sets, rest_sec: it.rest_sec,
        reps: it.mode === "time" ? null : it.reps, duration_sec: it.mode === "time" ? (it.duration_sec || 1) : null };
    }) };
    try {
      var url = BUILD.id ? "/api/activity/playlists/" + encodeURIComponent(BUILD.id) : "/api/activity/playlists";
      var r = await apiFetch(url, { method: BUILD.id ? "PUT" : "POST", body: JSON.stringify(payload) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "save");
      location.href = "/playlist";
    } catch (e) { btn.disabled = false; btn.textContent = old; showErr((e && e.message) || Lx({ en: "Couldn't save the playlist.", id: "Gagal menyimpan playlist." })); }
  }

  // ===================== ADD-MOVEMENT PICKER =====================
  function openPicker() { el("pickModal").classList.add("on"); if (!PICK.list.length) loadPicker(); }
  function closePicker() { el("pickModal").classList.remove("on"); }
  async function loadPicker() {
    var box = el("pickList"); box.innerHTML = '<div class="skel" style="height:60px"></div>';
    try {
      var p = new URLSearchParams(); if (PICK.group) p.set("group", PICK.group); if (PICK.q) p.set("q", PICK.q);
      var r = await apiFetch("/api/activity/exercises?" + p.toString());
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "load");
      PICK.list = (j && j.exercises) || [];
      if (!PICK.groups && j.groups) { PICK.groups = j.groups; renderPickChips(); }
      renderPickList();
    } catch (e) { box.innerHTML = '<div class="err">' + esc(Lx({ en: "Couldn't load movements.", id: "Gagal memuat gerakan." })) + '</div>'; }
  }
  function renderPickChips() {
    var host = el("pickChips"); if (!host || !PICK.groups) return;
    host.innerHTML = '<button type="button" class="chip' + (PICK.group ? "" : " on") + '" data-g="">' + esc(Lx({ en: "All", id: "Semua" })) + '</button>' +
      PICK.groups.map(function (g) { return '<button type="button" class="chip' + (PICK.group === g.group ? " on" : "") + '" data-g="' + esc(g.group) + '">' + esc(g.group) + '</button>'; }).join("");
    Array.prototype.forEach.call(host.querySelectorAll("[data-g]"), function (b) { b.onclick = function () { PICK.group = b.getAttribute("data-g"); renderPickChips(); loadPicker(); }; });
  }
  function renderPickList() {
    var box = el("pickList");
    if (!PICK.list.length) { box.innerHTML = '<div class="empty">' + esc(Lx({ en: "No movements found.", id: "Gerakan tidak ditemukan." })) + '</div>'; return; }
    box.innerHTML = PICK.list.map(function (e, i) {
      return '<div class="pick-ex"><span style="flex:1;min-width:0"><span class="pn" style="display:block">' + esc(e.name) + '</span><span class="pg" style="display:block">' + esc(e.focus_group) + '</span></span>' +
        '<button type="button" class="pick-add" data-i="' + i + '">+ ' + esc(Lx({ en: "Add", id: "Tambah" })) + '</button></div>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".pick-add[data-i]"), function (b) {
      b.onclick = function () {
        var e = PICK.list[+b.getAttribute("data-i")];
        var timeMode = !!MODE_TIME_GROUPS[e.focus_group];
        BUILD.items.push({ exercise_id: e.id, name: e.name, focus_group: e.focus_group, muscle_keys: e.muscle_keys || [],
          mode: timeMode ? "time" : "reps", sets: 3, reps: timeMode ? null : 10, duration_sec: timeMode ? 45 : null, rest_sec: null });
        b.textContent = "✓ " + Lx({ en: "Added", id: "Ditambah" }); b.classList.add("added");
        renderItems();
      };
    });
  }

  // ===================== CONFIG + BOOT =====================
  async function loadConfig() {
    try { var r = await apiFetch("/api/activity/config"); var j = await r.json().catch(function () { return {}; }); if (j && j.config) Object.assign(CFG, { detik_per_rep: +j.config.detik_per_rep || CFG.detik_per_rep, transisi_antar_gerakan_detik: +j.config.transisi_antar_gerakan_detik || CFG.transisi_antar_gerakan_detik, rest_default_detik: +j.config.rest_default_detik || CFG.rest_default_detik }); } catch (e) {}
  }
  function applyPlaceholders() { var q = el("q"); if (q) q.placeholder = (lang() === "en") ? "Search movements…" : "Cari gerakan…"; var pq = el("pq"); if (pq) pq.placeholder = (lang() === "en") ? "Search movements…" : "Cari gerakan…"; }

  async function boot() {
    try { user = await Auth.requireAuth(); } catch (e) { location.href = "/login"; return; }
    applyPlaceholders();
    await loadConfig();

    // Tabs + search (library)
    Array.prototype.forEach.call(document.querySelectorAll(".ptab"), function (b) { b.onclick = function () { setTab(b.getAttribute("data-tab")); }; });
    var q = el("q");
    if (q) q.addEventListener("input", function () { clearTimeout(_qTimer); _qTimer = setTimeout(function () { STATE.q = q.value.trim(); loadLib(); }, 280); });
    el("exModal").addEventListener("click", function (ev) { if (ev.target === el("exModal")) el("exModal").classList.remove("on"); });

    // My playlists
    var mk = el("mkNew"); if (mk) mk.onclick = function () { location.href = "/playlist/new"; };

    // Builder controls
    el("bAdd").onclick = openPicker;
    el("bSave").onclick = savePlaylist;
    el("bCancel").onclick = function () { location.href = "/playlist"; };
    el("pickClose").onclick = closePicker;
    el("pickModal").addEventListener("click", function (ev) { if (ev.target === el("pickModal")) closePicker(); });
    var pq = el("pq"); if (pq) pq.addEventListener("input", function () { clearTimeout(PICK._t); PICK._t = setTimeout(function () { PICK.q = pq.value.trim(); loadPicker(); }, 280); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { el("exModal").classList.remove("on"); closePicker(); } });

    if (window.I18N && I18N.onChange) I18N.onChange(function () { applyPlaceholders(); if (GROUPS) { renderGroupChips(); renderMuscleChips(); } if (el("viewBrowse").style.display !== "none") renderGrid(); if (MINE) renderMine(); if (BUILD) renderItems(); });

    // Route
    var m = location.pathname.match(/^\/playlist\/(.+?)\/?$/);
    if (m) { openBuilder(decodeURIComponent(m[1])); return; }
    // default: library + mine
    loadLib();
  }
  boot();
})();
