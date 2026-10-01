/* ============================================================================
 * AI Coach (Fase 1) — halaman /coach
 * Alur: intro -> quiz analisa (+consent kesehatan) -> generate workout plan
 * (server: AI edge action=program -> fallback aturan) -> tampil plan + adjust + CTA.
 * WAJIB LOGIN. Data lewat route server /api/coach/* (service key + RLS).
 * Vanilla, glass, mobile-first, Bahasa Indonesia default (ikut i18n EN/ID).
 * ========================================================================== */
(function () {
  var user = null, QUIZ = null, PLAN = null, CFG = null, BUSY = false;
  // Fase 2 — sesi latihan harian
  var TODAY = null, SESSION = null, SETS = [], SESSBUSY = false;
  // Chip jam tidur -> jam representatif (dikirim ke server; server yg tentukan penyesuaian).
  var SLEEP_OPTS = [["4", { en: "< 5 h", id: "< 5 jam" }], ["5.5", { en: "5–6 h", id: "5–6 jam" }],
    ["6.5", { en: "6–7 h", id: "6–7 jam" }], ["7.5", { en: "7–8 h", id: "7–8 jam" }], ["8.5", { en: "8+ h", id: "8+ jam" }]];

  function T(k) { return (window.I18N && I18N.t) ? I18N.t(k) : k; }
  function Lx(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(id) { return document.getElementById(id); }
  // Ikon minimalis (inline SVG, 1 warna currentColor) — pengganti emoji, gaya glass-minimalist.
  function svgIcon(n, sz) {
    sz = sz || 20;
    var P = {
      clinic: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
      coach: '<path d="M3 12h3l2 5 4-11 2 6h4"/>',
      solo: '<path d="M5 12h13M12 6l6 6-6 6"/>',
      warn: '<path d="M12 3.5l8.5 15H3.5z"/><path d="M12 10v4M12 16.8h.01"/>',
      cal: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
      run: '<path d="M3 12h3l2 5 4-11 2 6h4"/>',
      check: '<circle cx="12" cy="12" r="9"/><path d="M8.3 12.4l2.5 2.6 4.9-5.4"/>',
      moon: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
      target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
      spark: '<path d="M12 3.5l1.7 4.8L18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
      send: '<path d="M21 3L3 10.5l7 2.5 2.5 7z"/><path d="M21 3l-9 9"/>',
      dumbbell: '<path d="M3.5 9.5v5M6.5 8v8M17.5 8v8M20.5 9.5v5M6.5 12h11"/>',
      heart: '<path d="M12 20s-6.8-4.4-6.8-9.3A3.6 3.6 0 0 1 12 8.2a3.6 3.6 0 0 1 6.8 2.5C18.8 15.6 12 20 12 20z"/>',
      food: '<path d="M6 3v6.5a2 2 0 0 0 4 0V3M8 9.5V21M16.5 3c-1.4 0-2.3 1.6-2.3 4s.9 4 2.3 4 2.3-1.6 2.3-4-.9-4-2.3-4zM16.5 11v10"/>',
      scan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16"/>'
    };
    if (!P[n] && window.FIC && FIC.has(n)) return FIC(n, sz);   // ikon lain dari set bersama js/fiticons.js
    return '<svg viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle" aria-hidden="true">' + (P[n] || "") + '</svg>';
  }
  async function apiFetch(path, opts) {
    opts = opts || {}; opts.headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    var tk = await Auth.token(); if (tk) opts.headers.Authorization = "Bearer " + tk;
    return fetch(path, opts);
  }
  function showErr(msg) { el("errBox").innerHTML = '<div class="card" style="border-color:var(--red)"><div class="err">' + esc(msg) + '</div></div>'; }
  function clearErr() { el("errBox").innerHTML = ""; }
  function root() { return el("coachRoot"); }

  // ---- Model quiz ----
  var GOALS = [
    ["lose_weight", { en: "Fat loss", id: "Turun berat badan" }], ["build_muscle", { en: "Build muscle", id: "Naik massa otot" }],
    ["stamina", { en: "Stamina / endurance", id: "Stamina / endurance" }], ["hyrox", { en: "HYROX / race prep", id: "Persiapan HYROX / race" }],
    ["general", { en: "General fitness", id: "Kebugaran umum" }], ["return_injury", { en: "Return after injury", id: "Kembali setelah cedera" }],
  ];
  var IMPROVE = [
    ["pushup", { en: "More push-ups", id: "Push-up lebih banyak" }], ["run5k", { en: "Run 5K nonstop", id: "Lari 5K tanpa henti" }],
    ["leg", { en: "Leg strength", id: "Kekuatan kaki" }], ["core", { en: "Core / abs", id: "Core / perut" }],
    ["flex", { en: "Flexibility", id: "Kelenturan" }], ["consistency", { en: "Consistency", id: "Konsistensi" }],
  ];
  var DIFF = [
    ["consistency", { en: "Staying consistent", id: "Konsisten" }], ["time", { en: "Finding time", id: "Cari waktu" }],
    ["technique", { en: "Technique", id: "Teknik" }], ["fatigue", { en: "Getting tired fast", id: "Cepat lelah" }],
    ["pain", { en: "Pain / injury", id: "Nyeri / cedera" }], ["motivation", { en: "Motivation", id: "Motivasi" }],
  ];
  var LEVELS = [
    ["rare", { en: "Rarely (<1×/week)", id: "Jarang (<1×/minggu)" }], ["light", { en: "1–2×/week", id: "1–2×/minggu" }],
    ["moderate", { en: "3–4×/week", id: "3–4×/minggu" }], ["daily", { en: "5+×/week", id: "5+×/minggu" }],
  ];
  var LOCS = [["home", { en: "Home, no equipment", id: "Rumah tanpa alat" }], ["gym", { en: "Gym", id: "Gym" }], ["arena", { en: "20FIT Arena", id: "20FIT Arena" }]];
  var YN = [["1", { en: "Yes", id: "Ya" }], ["0", { en: "No", id: "Tidak" }]];

  function newState() {
    return { goal: null, improve: [], difficulty: [], level: null, location: null, days_per_week: "3", minutes_per_session: "30",
      self: { max_pushup: "", max_squat: "", plank_sec: "" }, safety: { injury: "0", pain_now: "0", medical: "0", note: "" }, consent: false };
  }
  var S = newState();

  // ---- Chatbot state (tampilan UTAMA /coach; program terstruktur lama tetap ada) ----
  var MODE = "chat";                 // 'chat' | 'program'
  var CHAT_COACH = null, CHAT_INIT = false, CHAT_MSGS = [], CHAT_BUSY = false;
  // Data persona (nama, warna, profil, roster/foto) = js/coach-profiles.js (satu sumber, dipakai /activity juga).
  var CP = window.CoachProfiles;
  var COACH_NAME = CP.NAME;
  var HEALTH = null;                 // skor kesehatan asli (0-100) dari /api/activity/health-score
  var HS_DATA = null;                // respons health-score lengkap (chip data di sapaan chat)
  var MEAL_CARDS = [];               // meal plan per kartu di chat (indeks = data-meal-i)
  var MEAL_APPLIED = "";             // signature meal plan yang sedang diterapkan (/api/coach/meal-plan)
  var GAME = null;                   // {xp, level, current_streak, ...} dari /api/coach/achievements
  // ?ask=<teks> (link dari Calories / Medical) -> HANYA mengisi kotak pesan, tidak dikirim otomatis
  // (link dari luar tak boleh mengirim chat atas nama user tanpa ia menekan Kirim).
  var PREFILL = "";
  var VIEW_PLAN_ID = null;           // /activity/plan/<id> -> lihat plan tertentu (bisa plan lama)
  var USER_NAME = "";                // nama depan user (buat sapaan personal)
  // [label, pesan, ikon] — label & ikon utk kartu prompt; pesan = yang benar-benar dikirim ke coach.
  var QUICKS = [
    [{ en: "Make a plan", id: "Buat plan" }, { en: "Buatkan workout plan untuk minggu ini", id: "Buatkan workout plan untuk minggu ini" }, "dumbbell"],
    [{ en: "My health score", id: "Health score-ku" }, { en: "Berapa health score aku sekarang dan gimana cara naikinnya?", id: "Berapa health score aku sekarang dan gimana cara naikinnya?" }, "heart"],
    [{ en: "Meal ideas", id: "Ide makan" }, { en: "Suggest meal plan hari ini sesuai target kalori aku", id: "Suggest meal plan hari ini sesuai target kalori aku" }, "food"],
    [{ en: "Book a class", id: "Book kelas" }, { en: "Ada kelas apa yang cocok buat aku minggu ini?", id: "Ada kelas apa yang cocok buat aku minggu ini?" }, "cal"],
    [{ en: "Read my Visbody", id: "Baca Visbody" }, { en: "Analisa hasil Visbody terakhir aku", id: "Analisa hasil Visbody terakhir aku" }, "scan"],
  ];

  // ---- Muat awal ----
  async function boot() {
    try { user = await Auth.requireAuth(); } catch (e) { location.href = "/login"; return; }
    try {
      var r = await apiFetch("/api/coach/plan"); var j = await r.json().catch(function () { return {}; });
      if (r.status === 401) { location.href = "/login"; return; }
      PLAN = j && j.plan ? j.plan : null;
    } catch (e) {}
    try { var qr = await apiFetch("/api/coach/quiz"); var qj = await qr.json().catch(function () { return {}; }); QUIZ = qj && qj.quiz ? qj.quiz : null; } catch (e) {}
    try { var cr = await fetch("/api/coach/config"); CFG = await cr.json().catch(function () { return {}; }); } catch (e) { CFG = {}; }
    if (PLAN && PLAN.plan) { await loadToday(); }
    // Foto persona = foto coach asli dari roster CMS (lewat js/coach-profiles.js); gagal -> inisial.
    await CP.loadRoster();
    // Nama depan user buat sapaan (best-effort; kalau tak ada, sapaan tanpa nama).
    try {
      var nm = (user && (user.name || (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)))) || "";
      USER_NAME = String(nm).trim().split(/\s+/)[0] || "";
      if (USER_NAME) USER_NAME = USER_NAME.charAt(0).toUpperCase() + USER_NAME.slice(1);
    } catch (e) {}
    // Health score ASLI user buat chip data di empty state (bukan mock).
    try {
      var hr = await apiFetch("/api/activity/health-score");
      var hj = await hr.json().catch(function () { return {}; });
      if (hj && hj.ok && typeof hj.total === "number") HEALTH = hj.total;   // terkunci -> total null -> chip tak tampil
      if (hj && hj.ok) HS_DATA = hj;
    } catch (e) {}
    try { var cpk = localStorage.getItem("my20fit_coach_pick"); if (cpk && COACH_NAME[cpk]) CHAT_COACH = cpk; } catch (e) {}
    // /activity/chat/<slug> (dan /coach?coach=<slug> lama) -> langsung buka chat coach itu.
    // /activity/plan[/<id>] -> tampilan plan (plan aktif).
    try {
      var pm = location.pathname.match(/^\/activity\/chat\/([a-z]+)\/?$/i);
      var qp = pm ? pm[1] : (new URLSearchParams(location.search)).get("coach");
      if (qp) { qp = String(qp).toLowerCase(); if (COACH_NAME[qp]) { CHAT_COACH = qp; try { localStorage.setItem("my20fit_coach_pick", qp); } catch (e) {} } }
      if (/^\/activity\/plan(\/|$)/i.test(location.pathname)) MODE = "program";
      var pid = location.pathname.match(/^\/activity\/plan\/([0-9a-f-]{8,})\/?$/i);
      if (pid) VIEW_PLAN_ID = pid[1];
      var ask = (new URLSearchParams(location.search)).get("ask");
      if (ask) { PREFILL = String(ask).slice(0, 300); history.replaceState(null, "", location.pathname); }
    } catch (e) {}
    render();
  }
  // Status sesi latihan HARI INI (Fase 2) — untuk kartu "Latihan hari ini" di halaman plan.
  async function loadToday() {
    try { var r = await apiFetch("/api/coach/session"); var j = await r.json().catch(function () { return {}; }); TODAY = (j && j.session) || null; }
    catch (e) { TODAY = null; }
  }

  function render() {
    clearErr();
    if (MODE === "chat") { renderChat(); return; }
    var sub = el("coachSub"); if (sub) sub.textContent = Lx({ en: "Personal workout plan", id: "Rencana latihan personal" });
    if (VIEW_PLAN_ID && !(PLAN && PLAN.id === VIEW_PLAN_ID)) { renderPlanById(VIEW_PLAN_ID); return; }
    if (PLAN && PLAN.plan) renderPlan();
    else renderIntro();
  }

  // ---- Intro ----
  function renderIntro() {
    var done = !!QUIZ;
    root().innerHTML = backBar() +
      '<div class="card hero"><div class="big">' + esc(Lx({ en: "Your AI training coach", id: "Pelatih AI kamu" })) + '</div>' +
      '<p>' + esc(Lx({ en: "Answer a few questions and get a weekly workout plan built around your goal, ability and schedule — no need to work out first.", id: "Jawab beberapa pertanyaan, dan dapat rencana latihan mingguan sesuai goal, kemampuan & jadwalmu — tanpa harus olahraga dulu." })) + '</p>' +
      '<ul><li>' + esc(Lx({ en: "Plan you can adjust anytime", id: "Plan bisa kamu adjust kapan saja" })) + '</li>' +
      '<li>' + esc(Lx({ en: "Safety screening first", id: "Skrining keamanan dulu" })) + '</li>' +
      '<li>' + esc(Lx({ en: "Option to consult a specialist or train with a coach", id: "Opsi konsultasi specialist atau latihan bareng coach" })) + '</li></ul>' +
      '<button class="btn" id="startQuiz">' + esc(done ? Lx({ en: "Retake quiz", id: "Ulang quiz" }) : Lx({ en: "Start quiz", id: "Mulai quiz" })) + '</button>' +
      '<a class="btn ghost" href="' + esc(chatPlanHref()) + '" style="margin-top:8px">' + svgIcon("chat", 16) + ' ' + esc(Lx({ en: "Or ask a coach to build it in chat", id: "Atau minta coach buatkan lewat chat" })) + '</a></div>' +
      planListShell();
    el("startQuiz").onclick = function () { if (QUIZ && QUIZ.answers) prefill(QUIZ); renderQuiz(); };
    loadPlanList();
    wireBackToChat();
  }

  function prefill(q) {
    var a = q.answers || {}, sf = q.safety_flags || {};
    S = newState();
    if (a.goal) S.goal = a.goal;
    if (Array.isArray(a.improve)) S.improve = a.improve.slice();
    if (Array.isArray(a.difficulty)) S.difficulty = a.difficulty.slice();
    if (a.level) S.level = a.level;
    if (a.location) S.location = a.location;
    if (a.days_per_week) S.days_per_week = String(a.days_per_week);
    if (a.minutes_per_session) S.minutes_per_session = String(a.minutes_per_session);
    if (a.self_test) S.self = { max_pushup: a.self_test.max_pushup || "", max_squat: a.self_test.max_squat || "", plank_sec: a.self_test.plank_sec || "" };
    S.safety = { injury: sf.injury ? "1" : "0", pain_now: sf.pain_now ? "1" : "0", medical: sf.medical ? "1" : "0", note: sf.note || "" };
  }

  // ---- Quiz ----
  function chips(groupKey, opts, multi) {
    return '<div class="qopts">' + opts.map(function (o) {
      var on = multi ? (S[groupKey].indexOf(o[0]) >= 0) : (S[groupKey] === o[0]);
      return '<button type="button" class="qopt' + (on ? " on" : "") + '" data-g="' + groupKey + '" data-v="' + esc(o[0]) + '">' + esc(Lx(o[1])) + '</button>';
    }).join("") + '</div>';
  }
  function ynChips(safetyKey) {
    return '<div class="qopts">' + YN.map(function (o) {
      var on = S.safety[safetyKey] === o[0];
      return '<button type="button" class="qopt' + (on ? " on" : "") + '" data-sf="' + safetyKey + '" data-v="' + o[0] + '">' + esc(Lx(o[1])) + '</button>';
    }).join("") + '</div>';
  }
  function sec(label, hint, body) {
    return '<div class="qsec"><div class="qlabel">' + esc(Lx(label)) + '</div>' + (hint ? '<div class="qhint">' + esc(Lx(hint)) + '</div>' : '') + body + '</div>';
  }
  function renderQuiz() {
    clearErr();
    var daysOpts = ["2", "3", "4", "5", "6"].map(function (d) { return '<option value="' + d + '"' + (S.days_per_week === d ? " selected" : "") + '>' + d + '</option>'; }).join("");
    var minOpts = ["20", "30", "45", "60"].map(function (m) { return '<option value="' + m + '"' + (S.minutes_per_session === m ? " selected" : "") + '>' + m + ' ' + Lx({ en: "min", id: "menit" }) + '</option>'; }).join("");
    root().innerHTML = '<div class="card">' +
      sec({ en: "Your main goal", id: "Goal utama kamu" }, null, chips("goal", GOALS, false)) +
      sec({ en: "What do you want to improve?", id: "Mau improve apa?" }, { en: "Optional, pick any", id: "Opsional, boleh pilih beberapa" }, chips("improve", IMPROVE, true)) +
      sec({ en: "Your biggest challenge?", id: "Kesulitan terbesar kamu?" }, { en: "Optional", id: "Opsional" }, chips("difficulty", DIFF, true)) +
      sec({ en: "How active are you now?", id: "Seaktif apa kamu sekarang?" }, null, chips("level", LEVELS, false)) +
      sec({ en: "Optional self-test", id: "Self-test opsional" }, { en: "Leave blank if unsure", id: "Kosongkan kalau tidak yakin" },
        '<div class="qnums">' +
        '<div class="qnum"><label>' + esc(Lx({ en: "Max push-ups", id: "Push-up maks" })) + '</label><input id="sfPush" type="number" inputmode="numeric" min="0" value="' + esc(S.self.max_pushup) + '"></div>' +
        '<div class="qnum"><label>' + esc(Lx({ en: "Squats in 1 min", id: "Squat dalam 1 menit" })) + '</label><input id="sfSquat" type="number" inputmode="numeric" min="0" value="' + esc(S.self.max_squat) + '"></div>' +
        '<div class="qnum"><label>' + esc(Lx({ en: "Plank (sec)", id: "Plank (detik)" })) + '</label><input id="sfPlank" type="number" inputmode="numeric" min="0" value="' + esc(S.self.plank_sec) + '"></div></div>') +
      sec({ en: "Availability", id: "Ketersediaan" }, null,
        '<div class="qnums"><div class="qnum"><label>' + esc(Lx({ en: "Days / week", id: "Hari / minggu" })) + '</label><select id="qDays">' + daysOpts + '</select></div>' +
        '<div class="qnum"><label>' + esc(Lx({ en: "Minutes / session", id: "Menit / sesi" })) + '</label><select id="qMin">' + minOpts + '</select></div></div>' +
        '<div style="margin-top:9px">' + chips("location", LOCS, false) + '</div>') +
      '</div>' +
      '<div class="card"><div class="sechd" style="margin-top:0">' + esc(Lx({ en: "Safety screening", id: "Skrining keamanan" })) + '</div>' +
      sec({ en: "Any injury history?", id: "Ada riwayat cedera?" }, null, ynChips("injury")) +
      sec({ en: "Any pain right now?", id: "Ada nyeri saat ini?" }, null, ynChips("pain_now")) +
      sec({ en: "Medical condition that limits activity?", id: "Kondisi medis yang membatasi aktivitas?" }, null, ynChips("medical")) +
      '<textarea class="qnote" id="sfNote" rows="2" placeholder="' + esc(Lx({ en: "Short note (optional)", id: "Keterangan singkat (opsional)" })) + '">' + esc(S.safety.note) + '</textarea>' +
      '<div class="qchk"><input type="checkbox" id="qConsent"' + (S.consent ? " checked" : "") + '><div class="t">' +
      esc(Lx({ en: "I agree that 20FIT may process my health-related answers (injury/medical screening) to generate my plan (Law PDP 27/2022). This is not medical advice.", id: "Saya setuju 20FIT memproses jawaban terkait kesehatan saya (skrining cedera/medis) untuk menyusun plan (UU PDP 27/2022). Ini bukan nasihat medis." })) +
      '</div></div>' +
      '<div id="qErr" class="err" style="margin-top:10px"></div>' +
      '<button class="btn" id="qSubmit" style="margin-top:12px">' + esc(Lx({ en: "Generate my plan", id: "Buat plan saya" })) + '</button>' +
      '<button class="btn ghost" id="qBack" style="margin-top:8px">' + esc(Lx({ en: "Cancel", id: "Batal" })) + '</button></div>';

    // wire chips (single/multi) + safety yes-no
    Array.prototype.forEach.call(root().querySelectorAll(".qopt[data-g]"), function (b) {
      b.onclick = function () {
        var g = b.getAttribute("data-g"), v = b.getAttribute("data-v"), multi = (g === "improve" || g === "difficulty");
        if (multi) { var i = S[g].indexOf(v); if (i >= 0) S[g].splice(i, 1); else S[g].push(v); b.classList.toggle("on"); }
        else { S[g] = v; Array.prototype.forEach.call(root().querySelectorAll('.qopt[data-g="' + g + '"]'), function (x) { x.classList.remove("on"); }); b.classList.add("on"); }
      };
    });
    Array.prototype.forEach.call(root().querySelectorAll(".qopt[data-sf]"), function (b) {
      b.onclick = function () { var k = b.getAttribute("data-sf"); S.safety[k] = b.getAttribute("data-v"); Array.prototype.forEach.call(root().querySelectorAll('.qopt[data-sf="' + k + '"]'), function (x) { x.classList.remove("on"); }); b.classList.add("on"); };
    });
    el("qBack").onclick = function () { render(); };
    el("qSubmit").onclick = submitQuiz;
  }

  async function submitQuiz() {
    if (BUSY) return;
    S.days_per_week = el("qDays").value; S.minutes_per_session = el("qMin").value;
    S.self = { max_pushup: el("sfPush").value, max_squat: el("sfSquat").value, plank_sec: el("sfPlank").value };
    S.safety.note = el("sfNote").value; S.consent = el("qConsent").checked;
    var qe = el("qErr");
    if (!S.goal) { qe.textContent = Lx({ en: "Pick your main goal.", id: "Pilih goal utama dulu." }); return; }
    if (!S.level) { qe.textContent = Lx({ en: "Pick how active you are.", id: "Pilih seaktif apa kamu." }); return; }
    if (!S.location) { qe.textContent = Lx({ en: "Pick where you'll train.", id: "Pilih lokasi latihan." }); return; }
    if (!S.consent) { qe.textContent = Lx({ en: "Please agree to the data consent to continue.", id: "Centang persetujuan data untuk lanjut." }); return; }
    qe.textContent = "";
    var body = {
      consent_health: true,
      answers: { goal: S.goal, improve: S.improve, difficulty: S.difficulty, level: S.level, location: S.location,
        days_per_week: parseInt(S.days_per_week, 10), minutes_per_session: parseInt(S.minutes_per_session, 10),
        self_test: { max_pushup: numOrNull(S.self.max_pushup), max_squat: numOrNull(S.self.max_squat), plank_sec: numOrNull(S.self.plank_sec) },
        lang: (window.I18N && I18N.lang) || "id" },
      safety_flags: { injury: S.safety.injury === "1", pain_now: S.safety.pain_now === "1", medical: S.safety.medical === "1", note: (S.safety.note || "").slice(0, 300) },
    };
    BUSY = true; var btn = el("qSubmit"); btn.disabled = true;
    renderGenerating();
    try {
      var r = await apiFetch("/api/coach/quiz", { method: "POST", body: JSON.stringify(body) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "save");
      QUIZ = j.quiz || null;
      var pr = await apiFetch("/api/coach/plan", { method: "POST", body: JSON.stringify({ lang: body.answers.lang }) });
      var pj = await pr.json().catch(function () { return {}; });
      if (!pr.ok) throw new Error(pj.error || "plan");
      PLAN = pj.plan || null;
      BUSY = false; render();
    } catch (e) {
      BUSY = false; showErr((e && e.message) || Lx({ en: "Couldn't build your plan. Try again.", id: "Gagal membuat plan. Coba lagi." }));
      renderQuiz(); el("qErr").textContent = (e && e.message) || "";
    }
  }
  function numOrNull(v) { var n = parseInt(v, 10); return isFinite(n) && n >= 0 ? n : null; }

  function renderGenerating() {
    root().innerHTML = '<div class="card" style="text-align:center;padding:34px 16px">' +
      '<div class="skel" style="height:14px;width:60%;margin:0 auto 12px"></div>' +
      '<div class="muted" style="font-size:13.5px">' + esc(Lx({ en: "Building your plan…", id: "Menyusun plan kamu…" })) + '</div></div>';
  }

  // ---- Plan ----
  function renderPlan() {
    var row = PLAN, p = row.plan || {};
    var days = Array.isArray(p.days) ? p.days : [];
    var srcLbl = planSrcLabel(row);
    var html = todayCardHtml() +
      '<div class="card"><div class="planhead"><div class="pn">' + esc(p.plan_name || "Workout plan") + '</div>' +
      '<div class="wn">' + esc(p.weekly_note || "") + '</div>' +
      '<span class="badge src">' + esc(srcLbl) + '</span></div>' +
      (p.needs_specialist ? '<div class="needspec"><span style="color:var(--amber)">' + svgIcon("warn", 16) + '</span> ' + esc(Lx({ en: "Because of your safety screening, this is a conservative plan. Please consult a 20FIT specialist before starting.", id: "Karena hasil skrining keamananmu, ini plan versi konservatif. Sebaiknya konsultasi ke specialist 20FIT sebelum mulai." })) + '</div>' : '') +
      days.map(function (d, di) {
        return '<div class="day' + (d.done ? ' done' : '') + '"><div class="day-h" data-day="' + di + '">' +
          '<button type="button" class="dchk" data-done="' + esc(d.key) + '" aria-pressed="' + (d.done ? 'true' : 'false') + '" title="' + esc(Lx({ en: "Mark day done", id: "Tandai hari selesai" })) + '">' + svgIcon(d.done ? "boxcheck" : "box", 18) + '</button>' +
          '<span class="dl">' + esc(d.label || ("Hari " + (di + 1))) + '</span>' +
          '<span class="df">' + esc(d.focus || "") + '</span></div>' +
          '<div class="day-b"' + (di === 0 ? '' : ' style="display:none"') + '>' +
          (Array.isArray(d.exercises) ? d.exercises : []).map(function (e) {
            var unit = e.unit === "sec" ? Lx({ en: "sec", id: "detik" }) : (e.unit === "min" ? Lx({ en: "min", id: "menit" }) : Lx({ en: "reps", id: "rep" }));
            return '<div class="ex"><div style="flex:1;min-width:0"><div class="en">' + esc(e.name || "") + '</div>' +
              (e.progression ? '<div class="prog">↗ ' + esc(e.progression) + '</div>' : '') + '</div>' +
              '<span class="em">' + (e.sets || 1) + ' × ' + esc(String(e.reps || "")) + ' ' + esc(unit) + '</span>' +
              '<button class="sw" data-swap="' + esc(d.key) + '|' + esc(e.key) + '">' + esc(Lx({ en: "swap", id: "ganti" })) + '</button></div>';
          }).join("") + '</div></div>';
      }).join("") +
      '<div class="adjrow"><button class="btn ghost" id="adjEasier">– ' + esc(Lx({ en: "Easier", id: "Ringankan" })) + '</button>' +
      '<button class="btn ghost" id="adjHarder">+ ' + esc(Lx({ en: "Harder", id: "Beratkan" })) + '</button>' +
      '<button class="btn ghost" id="adjRedo">' + esc(Lx({ en: "Retake quiz", id: "Ulang quiz" })) + '</button>' +
      '<a class="btn ghost" href="' + esc(chatPlanHref()) + '">' + svgIcon("chat", 16) + ' ' + esc(Lx({ en: "New plan via coach", id: "Plan baru via coach" })) + '</a></div>' +
      '<div class="disc">' + esc(p.disclaimer || "") + '</div></div>';

    // CTA
    html += '<div class="sechd">' + esc(Lx({ en: "Next step", id: "Langkah berikutnya" })) + '</div>' +
      '<div class="card"><div class="ctawrap">' +
      ctaBtn("consult_specialist", svgIcon("clinic"), { en: "Consult a specialist first", id: "Konsultasi specialist dulu" }, { en: "20FIT Sports Clinic — recommended if you have pain/injury", id: "20FIT Sports Clinic — disarankan kalau ada nyeri/cedera" }, p.needs_specialist) +
      ctaBtn("membership", svgIcon("coach"), { en: "Train with a 20FIT coach", id: "Latihan bareng coach 20FIT" }, { en: "20FIT Arena / Gym membership", id: "Membership 20FIT Arena / Gym" }, false) +
      ctaBtn("start_solo", svgIcon("solo"), { en: "Start on my own now", id: "Mulai sendiri sekarang" }, { en: "Follow the plan yourself", id: "Ikuti plan ini sendiri" }, false) +
      '</div></div>';
    html += '<div class="sechd">' + esc(Lx({ en: "Progress", id: "Progress" })) + '</div>' +
      '<div class="card" id="progBox"><div class="skel" style="height:90px"></div></div>' +
      '<div class="sechd">' + esc(Lx({ en: "History", id: "Riwayat" })) + '</div>' +
      '<div class="card"><div id="histBox" class="hist"><div class="muted" style="font-size:12.5px">' + esc(Lx({ en: "Loading…", id: "Memuat…" })) + '</div></div></div>' +
      planListShell();
    root().innerHTML = backBar() + html;
    loadPlanList();

    var tgo = el("todayGo"); if (tgo) tgo.onclick = openSession;
    loadHistory(); loadProgress();

    Array.prototype.forEach.call(root().querySelectorAll(".day-h"), function (h) {
      h.onclick = function () { var b = h.nextElementSibling; if (b) b.style.display = (b.style.display === "none") ? "" : "none"; };
    });
    Array.prototype.forEach.call(root().querySelectorAll("[data-done]"), function (b) {
      b.onclick = function (ev) {
        ev.stopPropagation();
        var k = b.getAttribute("data-done"), d = days.filter(function (x) { return x.key === k; })[0];
        adjust({ op: "done", day_key: k, done: !(d && d.done) });
      };
    });
    Array.prototype.forEach.call(root().querySelectorAll("[data-swap]"), function (b) {
      b.onclick = function () { var parts = b.getAttribute("data-swap").split("|"); adjust({ op: "swap", day_key: parts[0], ex_key: parts[1] }); };
    });
    el("adjEasier").onclick = function () { adjust({ op: "level", dir: "easier" }); };
    el("adjHarder").onclick = function () { adjust({ op: "level", dir: "harder" }); };
    el("adjRedo").onclick = function () { if (QUIZ) prefill(QUIZ); renderQuiz(); };
    Array.prototype.forEach.call(root().querySelectorAll("[data-cta]"), function (b) { b.onclick = function () { onCta(b.getAttribute("data-cta")); }; });
    wireBackToChat();
  }
  function planSrcLabel(row) {
    var p = (row && row.plan) || {};
    if (row && row.source === "ai") return "AI COACH" + (p.origin === "chat" && p.coach && COACH_NAME[p.coach] ? " · " + COACH_NAME[p.coach] : "");
    if (row && row.source === "adjusted") return Lx({ en: "Adjusted", id: "Disesuaikan" });
    return Lx({ en: "Auto plan", id: "Plan otomatis" });
  }
  function chatPlanHref() {
    return "/activity/chat" + (CHAT_COACH ? "/" + CHAT_COACH : "") + "?ask=" + encodeURIComponent(Lx({ en: "Build me a new workout plan for this week", id: "Buatkan workout plan baru untuk minggu ini" }));
  }
  // Semua plan user (/api/coach/plans) — link ke /activity/plan/<id>.
  function planListShell() {
    return '<div class="sechd">' + esc(Lx({ en: "All plans", id: "Semua plan" })) + '</div><div class="card" id="planListBox"><div class="skel" style="height:60px"></div></div>';
  }
  async function loadPlanList() {
    var box = el("planListBox"); if (!box) return;
    try {
      var r = await apiFetch("/api/coach/plans"); var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "plans");
      var list = (j && j.plans) || [];
      if (!list.length) { box.innerHTML = '<div class="muted" style="font-size:12.5px">' + esc(Lx({ en: "No plans yet.", id: "Belum ada plan." })) + '</div>'; return; }
      box.innerHTML = '<div class="plist">' + list.map(function (pl) {
        var dt = ""; try { dt = new Date(pl.created_at).toLocaleDateString((window.I18N && I18N.lang === "en") ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric" }); } catch (e) {}
        return '<a class="pli' + (pl.is_active ? ' on' : '') + '" href="/activity/plan/' + encodeURIComponent(pl.id) + '">' +
          '<span class="pln">' + esc(pl.name) + (pl.is_active ? ' <span class="badge src">' + esc(Lx({ en: "Active", id: "Aktif" })) + '</span>' : '') + '</span>' +
          '<span class="pls">' + esc(dt) + (pl.coach && COACH_NAME[pl.coach] ? " · Coach " + esc(COACH_NAME[pl.coach]) : "") + " · " + pl.days_done + "/" + pl.days_total + " " + esc(Lx({ en: "done", id: "selesai" })) + '</span></a>';
      }).join("") + '</div>';
    } catch (e) {
      box.innerHTML = '<div class="muted" style="font-size:12.5px">' + esc(Lx({ en: "Couldn't load plans.", id: "Gagal memuat daftar plan." })) + ' <button type="button" class="btn ghost" id="plRetry" style="width:auto;padding:6px 12px">' + esc(Lx({ en: "Retry", id: "Coba lagi" })) + '</button></div>';
      var rt = el("plRetry"); if (rt) rt.onclick = loadPlanList;
    }
  }
  // Detail plan lama (bukan plan aktif): baca saja + tombol jadikan aktif.
  async function renderPlanById(id) {
    root().innerHTML = '<div class="card"><div class="skel" style="height:140px"></div></div>';
    var row = null;
    try { var r = await apiFetch("/api/coach/plans/" + encodeURIComponent(id)); var j = await r.json().catch(function () { return {}; }); row = r.ok ? j.plan : null; } catch (e) { row = null; }
    if (!row) {
      root().innerHTML = '<div class="card"><div class="muted">' + esc(Lx({ en: "Plan not found.", id: "Plan tidak ditemukan." })) + '</div><a class="btn ghost" href="/activity/plan" style="margin-top:10px">' + esc(Lx({ en: "All plans", id: "Semua plan" })) + '</a></div>';
      return;
    }
    var p = row.plan || {}, days = Array.isArray(p.days) ? p.days : [];
    root().innerHTML = '<div class="card"><div class="planhead"><div class="pn">' + esc(p.plan_name || "Workout plan") + '</div>' +
      '<div class="wn">' + esc(p.weekly_note || "") + '</div><span class="badge src">' + esc(planSrcLabel(row)) + '</span></div>' +
      days.map(function (d, di) {
        return '<div class="day' + (d.done ? ' done' : '') + '"><div class="day-h"><span class="dchk">' + svgIcon(d.done ? "boxcheck" : "box", 18) + '</span><span class="dl">' + esc(d.label || ("Hari " + (di + 1))) + '</span><span class="df">' + esc(d.focus || "") + '</span></div>' +
          '<div class="day-b">' + (Array.isArray(d.exercises) ? d.exercises : []).map(function (e) {
            return '<div class="ex"><div style="flex:1;min-width:0"><div class="en">' + esc(e.name || "") + '</div></div><span class="em">' + (e.sets || 1) + ' × ' + esc(String(e.reps || "")) + '</span></div>';
          }).join("") + '</div></div>';
      }).join("") +
      '<div class="adjrow"><button class="btn" id="plActivate">' + esc(Lx({ en: "Make this my active plan", id: "Jadikan plan aktif" })) + '</button>' +
      '<a class="btn ghost" href="/activity/plan">' + esc(Lx({ en: "All plans", id: "Semua plan" })) + '</a></div>' +
      '<div class="disc">' + esc(p.disclaimer || "") + '</div></div>';
    el("plActivate").onclick = async function () {
      if (BUSY) return; BUSY = true; clearErr();
      try {
        var r2 = await apiFetch("/api/coach/plan/activate", { method: "POST", body: JSON.stringify({ id: row.id }) });
        var j2 = await r2.json().catch(function () { return {}; });
        if (!r2.ok) throw new Error(j2.error || "activate");
        PLAN = j2.plan; VIEW_PLAN_ID = null;
        try { history.replaceState(null, "", "/activity/plan"); } catch (e) {}
        BUSY = false; render(); return;
      } catch (e) { showErr((e && e.message) || Lx({ en: "Couldn't activate the plan.", id: "Gagal mengaktifkan plan." })); }
      BUSY = false;
    };
  }
  function ctaBtn(type, icon, title, sub, primary) {
    return '<button type="button" class="cta-b' + (primary ? " primary" : "") + '" data-cta="' + type + '">' +
      '<span class="ic" style="background:color-mix(in srgb,var(--accent) 14%,transparent);color:var(--accent)">' + icon + '</span>' +
      '<span style="flex:1;min-width:0"><span class="ct">' + esc(Lx(title)) + '</span><span class="cs">' + esc(Lx(sub)) + '</span></span></button>';
  }

  async function adjust(payload) {
    if (BUSY) return; BUSY = true; clearErr();
    try {
      var r = await apiFetch("/api/coach/plan/adjust", { method: "POST", body: JSON.stringify(payload) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "adjust");
      PLAN = j.plan || PLAN; renderPlan();
    } catch (e) { showErr((e && e.message) || Lx({ en: "Couldn't adjust the plan.", id: "Gagal menyesuaikan plan." })); }
    BUSY = false;
  }

  async function onCta(type) {
    try {
      var r = await apiFetch("/api/coach/cta", { method: "POST", body: JSON.stringify({ cta_type: type, plan_id: PLAN && PLAN.id }) });
      var j = await r.json().catch(function () { return {}; });
      if (type === "start_solo") { location.href = "/activity"; return; }
      var url = (j && j.url) || (type === "consult_specialist" ? (CFG && CFG.clinic_url) : (CFG && CFG.membership_url)) || "/activity";
      location.href = url;   // same-tab (CLAUDE.md §G: no target=_blank / window.open)
    } catch (e) { location.href = "/activity"; }
  }

  // ============================ SESI HARIAN (Fase 2) ============================
  var INSESSION = false;
  function unitLbl(u) { return u === "sec" ? Lx({ en: "sec", id: "detik" }) : (u === "min" ? Lx({ en: "min", id: "menit" }) : Lx({ en: "reps", id: "rep" })); }
  function fmtDate(d) { try { var dt = new Date(d + "T00:00:00"); return dt.getDate() + " " + ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][dt.getMonth()]; } catch (e) { return d; } }
  function sessionProgress() { var done = 0; SETS.forEach(function (s) { if (s.done) done++; }); return { done: done, total: SETS.length }; }

  // Kartu "Latihan hari ini" di atas plan (status dari TODAY yang di-load saat boot).
  function todayCardHtml() {
    var st = TODAY && TODAY.status, ic = svgIcon("cal"), tt, ts, btn;
    if (TODAY && st === "active") { ic = svgIcon("run"); tt = Lx({ en: "Continue today's workout", id: "Lanjutkan latihan hari ini" }); ts = (TODAY.day_label || "") + (TODAY.focus ? " · " + TODAY.focus : ""); btn = Lx({ en: "Continue", id: "Lanjut" }); }
    else if (TODAY && st === "done") { ic = svgIcon("check"); tt = Lx({ en: "Workout done today", id: "Latihan hari ini selesai" }); ts = TODAY.day_label || ""; btn = Lx({ en: "View", id: "Lihat" }); }
    else if (TODAY && st === "skipped") { ic = svgIcon("moon"); tt = Lx({ en: "Today skipped", id: "Hari ini dilewati" }); ts = TODAY.day_label || ""; btn = Lx({ en: "Open", id: "Buka" }); }
    else { tt = Lx({ en: "Today's workout", id: "Latihan hari ini" }); ts = Lx({ en: "Start from your plan", id: "Mulai dari plan kamu" }); btn = Lx({ en: "Start", id: "Mulai" }); }
    return '<div class="card today"><span class="ic">' + ic + '</span><span style="flex:1;min-width:0">' +
      '<span class="tt" style="display:block">' + esc(tt) + '</span><span class="ts" style="display:block">' + esc(ts) + '</span></span>' +
      '<button class="go" id="todayGo">' + esc(btn) + '</button></div>';
  }

  async function openSession() {
    clearErr(); INSESSION = true;
    root().innerHTML = '<div class="card"><div class="skel" style="height:110px"></div></div>';
    try {
      var r = await apiFetch("/api/coach/session"); var j = await r.json().catch(function () { return {}; });
      if (r.status === 401) { location.href = "/login"; return; }
      if (j && j.setup_required) { INSESSION = false; showErr(Lx({ en: "Session feature needs DB migration 022. Contact admin.", id: "Fitur sesi butuh migration 022 dijalankan dulu. Hubungi admin." })); render(); return; }
      SESSION = (j && j.session) || null; SETS = (j && j.sets) || [];
      if (SESSION) renderSessionView(); else renderSessionStart(j || {});
    } catch (e) { INSESSION = false; showErr(Lx({ en: "Couldn't open the session.", id: "Gagal membuka sesi." })); render(); }
  }

  function renderSessionStart(data) {
    INSESSION = true;
    var p = (PLAN && PLAN.plan) || {}, days = Array.isArray(p.days) ? p.days : [];
    var knownSleep = (data && data.sleep_hours != null) ? data.sleep_hours : null;
    var S2 = { day: (days[0] && days[0].key) || null, sleep: (knownSleep != null ? String(knownSleep) : null) };
    function draw() {
      root().innerHTML = '<div class="card">' +
        '<div class="planhead"><div class="pn">' + esc(Lx({ en: "Today's workout", id: "Latihan hari ini" })) + '</div>' +
        '<div class="wn">' + esc(Lx({ en: "Pick the day, then check your sleep.", id: "Pilih hari, lalu cek tidur." })) + '</div></div>' +
        '<div class="qsec"><div class="qlabel">' + esc(Lx({ en: "Which day?", id: "Hari mana?" })) + '</div><div class="qopts">' +
        days.map(function (d) { return '<button type="button" class="qopt' + (S2.day === d.key ? " on" : "") + '" data-day="' + esc(d.key) + '">' + esc(d.label || d.key) + (d.focus ? ' · ' + esc(d.focus) : '') + '</button>'; }).join("") + '</div></div>' +
        '<div class="qsec"><div class="qlabel">' + esc(Lx({ en: "How long did you sleep last night?", id: "Semalam tidur berapa jam?" })) + '</div>' +
        '<div class="qhint">' + esc(knownSleep != null ? (Lx({ en: "Recorded: ", id: "Tercatat: " }) + knownSleep + Lx({ en: " h — tap to change", id: " jam — ketuk untuk ubah" })) : Lx({ en: "Adjusts today's load. General guideline, not medical advice.", id: "Menyesuaikan beban hari ini. Panduan umum, bukan nasihat medis." })) + '</div>' +
        '<div class="sleepgrid">' + SLEEP_OPTS.map(function (o) { return '<button type="button" class="qopt' + (S2.sleep === o[0] ? " on" : "") + '" data-sleep="' + o[0] + '">' + esc(Lx(o[1])) + '</button>'; }).join("") + '</div></div>' +
        '<button class="btn" id="startBtn" style="margin-top:14px">' + esc(Lx({ en: "Start workout", id: "Mulai latihan" })) + '</button>' +
        '<button class="btn ghost" id="startBack" style="margin-top:8px">' + esc(Lx({ en: "Back to plan", id: "Kembali ke plan" })) + '</button></div>';
      Array.prototype.forEach.call(root().querySelectorAll("[data-day]"), function (b) { b.onclick = function () { S2.day = b.getAttribute("data-day"); draw(); }; });
      Array.prototype.forEach.call(root().querySelectorAll("[data-sleep]"), function (b) { b.onclick = function () { var v = b.getAttribute("data-sleep"); S2.sleep = (S2.sleep === v) ? null : v; draw(); }; });
      el("startBack").onclick = function () { render(); };
      el("startBtn").onclick = function () { startSession(S2.day, S2.sleep); };
    }
    draw();
  }

  async function startSession(dayKey, sleepVal) {
    if (SESSBUSY) return; SESSBUSY = true; clearErr();
    var body = { day_key: dayKey };
    if (sleepVal != null) body.sleep_hours = parseFloat(sleepVal);
    var btn = el("startBtn"); if (btn) { btn.disabled = true; btn.textContent = Lx({ en: "Starting…", id: "Memulai…" }); }
    try {
      var r = await apiFetch("/api/coach/session/start", { method: "POST", body: JSON.stringify(body) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "start");
      SESSION = j.session || null; SETS = j.sets || []; TODAY = SESSION;
      SESSBUSY = false; renderSessionView();
    } catch (e) { SESSBUSY = false; if (btn) { btn.disabled = false; btn.textContent = Lx({ en: "Start workout", id: "Mulai latihan" }); } showErr((e && e.message) || Lx({ en: "Couldn't start.", id: "Gagal memulai." })); }
  }

  function adjustBannerHtml(adjust, sleep) {
    var map = {
      none: { en: "Sleep looks fine — normal plan today.", id: "Tidur cukup — plan normal hari ini." },
      lighter: { en: "Short on sleep — today's load is trimmed a bit.", id: "Tidur kurang — beban hari ini diringankan sedikit." },
      rest: { en: "Very little sleep — consider a lighter/recovery day.", id: "Tidur sangat kurang — pertimbangkan hari ringan/recovery." },
      unknown: { en: "Sleep not set — using the normal plan.", id: "Jam tidur belum diisi — pakai plan normal." }
    };
    var cls = ["none", "lighter", "rest", "unknown"].indexOf(adjust) >= 0 ? adjust : "unknown";
    var s = (sleep != null) ? (sleep + " " + Lx({ en: "h", id: "jam" }) + " · ") : "";
    return '<div class="adjbanner ' + cls + '">' + esc(s) + esc(Lx(map[cls])) + '</div>';
  }

  function updateProgressBar() {
    var pr = sessionProgress(), pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
    var bar = root().querySelector(".pbar>i"); if (bar) bar.style.width = pct + "%";
    var lbl = root().querySelector(".pbar + .muted"); if (lbl) lbl.textContent = pr.done + " / " + pr.total + " " + Lx({ en: "sets done", id: "set selesai" });
  }

  function renderSessionView() {
    clearErr(); INSESSION = true;
    var pl = (SESSION && SESSION.planned) || {}, exs = Array.isArray(pl.exercises) ? pl.exercises : [];
    var byEx = {}; SETS.forEach(function (s) { (byEx[s.ex_key] = byEx[s.ex_key] || []).push(s); });
    Object.keys(byEx).forEach(function (k) { byEx[k].sort(function (a, b) { return a.set_index - b.set_index; }); });
    var pr = sessionProgress(), pct = pr.total ? Math.round(pr.done / pr.total * 100) : 0;
    var done = SESSION.status === "done", skipped = SESSION.status === "skipped", locked = done || skipped;
    var html = '<div class="card"><div class="planhead"><div class="pn">' + esc(SESSION.day_label || Lx({ en: "Today's workout", id: "Latihan hari ini" })) + '</div>' +
      '<div class="wn">' + esc(SESSION.focus || "") + '</div></div>' +
      adjustBannerHtml(SESSION.sleep_adjust, SESSION.sleep_hours) +
      '<div class="pbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="muted" style="font-size:12px">' + pr.done + ' / ' + pr.total + ' ' + esc(Lx({ en: "sets done", id: "set selesai" })) + '</div>';
    exs.forEach(function (e) {
      var rows = byEx[e.key] || [];
      html += '<div class="exblk"><div class="eh"><div class="n">' + esc(e.name) + '</div>' +
        '<div class="s">' + esc(Lx({ en: "Target", id: "Target" })) + ': ' + rows.length + ' × ' + esc(String(e.reps || "")) + ' ' + esc(unitLbl(e.unit)) +
        (e.orig_sets && e.orig_sets !== rows.length ? ' <span style="opacity:.7">(' + esc(Lx({ en: "was", id: "asalnya" })) + ' ' + e.orig_sets + ')</span>' : '') + '</div></div>';
      rows.forEach(function (s) {
        html += '<div class="setrow' + (s.done ? " done" : "") + '" data-ex="' + esc(s.ex_key) + '" data-i="' + s.set_index + '">' +
          '<span class="sx">' + esc(Lx({ en: "Set", id: "Set" })) + ' ' + s.set_index + '</span>' +
          '<input class="rin" type="number" inputmode="numeric" min="0" value="' + esc(s.done_reps != null ? s.done_reps : (s.target_reps || "")) + '"' + (locked ? " disabled" : "") + '>' +
          '<span class="un">' + esc(unitLbl(s.unit)) + '</span>' +
          '<button class="ck' + (s.done ? " on" : "") + '"' + (locked ? " disabled" : "") + '>' + (s.done ? "✓" : "") + '</button></div>';
      });
      html += '</div>';
    });
    if (!locked) {
      html += '<div class="adjrow"><button class="btn" id="finishBtn">' + esc(Lx({ en: "Finish workout", id: "Selesai latihan" })) + '</button>' +
        '<button class="btn ghost" id="skipBtn">' + esc(Lx({ en: "Skip today", id: "Lewati hari ini" })) + '</button></div>';
    } else {
      html += '<div class="adjbanner none" style="margin-top:14px">' + (done ? '<span style="color:var(--green)">' + svgIcon("check", 16) + '</span> ' : '') + esc(done ? Lx({ en: "Session completed. Nice work!", id: "Sesi selesai. Keren!" }) : Lx({ en: "Session marked as skipped.", id: "Sesi ditandai dilewati." })) + '</div>';
    }
    html += '<button class="btn ghost" id="sessBack" style="margin-top:8px">' + esc(Lx({ en: "Back to plan", id: "Kembali ke plan" })) + '</button></div>';
    root().innerHTML = html;
    if (!locked) {
      Array.prototype.forEach.call(root().querySelectorAll(".setrow"), function (row) {
        var ck = row.querySelector(".ck"), inp = row.querySelector(".rin");
        if (!ck) return;
        ck.onclick = function () { toggleSet(row, row.getAttribute("data-ex"), +row.getAttribute("data-i"), inp); };
      });
      var fb = el("finishBtn"); if (fb) fb.onclick = function () { finishSession("done"); };
      var sb = el("skipBtn"); if (sb) sb.onclick = function () { finishSession("skipped"); };
    }
    el("sessBack").onclick = function () { render(); };
  }

  async function toggleSet(row, exKey, idx, inp) {
    if (SESSBUSY) return; SESSBUSY = true;
    var wantDone = !row.classList.contains("done");
    var body = { session_id: SESSION.id, ex_key: exKey, set_index: idx, done: wantDone };
    if (inp && inp.value !== "") body.done_reps = parseInt(inp.value, 10);
    var ck = row.querySelector(".ck");
    try {
      var r = await apiFetch("/api/coach/session/set", { method: "POST", body: JSON.stringify(body) });
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.set) {
        for (var i = 0; i < SETS.length; i++) { if (SETS[i].ex_key === exKey && SETS[i].set_index === idx) { SETS[i] = j.set; break; } }
        row.classList.toggle("done", wantDone); if (ck) { ck.classList.toggle("on", wantDone); ck.textContent = wantDone ? "✓" : ""; }
        updateProgressBar();
      }
    } catch (e) {}
    SESSBUSY = false;
  }

  async function finishSession(status) {
    if (SESSBUSY) return; SESSBUSY = true; clearErr();
    var fb = el("finishBtn"); if (fb) fb.disabled = true;
    try {
      var r = await apiFetch("/api/coach/session/finish", { method: "POST", body: JSON.stringify({ session_id: SESSION.id, status: status }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok) throw new Error(j.error || "finish");
      SESSION = j.session || SESSION; TODAY = SESSION;
      SESSBUSY = false; renderSessionView();
    } catch (e) { SESSBUSY = false; if (fb) fb.disabled = false; showErr((e && e.message) || Lx({ en: "Couldn't finish.", id: "Gagal menyelesaikan." })); }
  }

  async function loadHistory() {
    var box = el("histBox"); if (!box) return;
    try {
      var r = await apiFetch("/api/coach/sessions?limit=10"); var j = await r.json().catch(function () { return {}; });
      var list = (j && j.sessions) || [];
      if (!list.length) { box.innerHTML = '<div class="muted" style="font-size:12.5px">' + esc(Lx({ en: "No sessions yet.", id: "Belum ada sesi." })) + '</div>'; return; }
      box.innerHTML = list.map(function (s) {
        var cls = ["done", "active", "skipped"].indexOf(s.status) >= 0 ? s.status : "active";
        var lbl = cls === "done" ? Lx({ en: "done", id: "selesai" }) : (cls === "active" ? Lx({ en: "active", id: "aktif" }) : Lx({ en: "skipped", id: "lewat" }));
        return '<div class="hrow"><span class="hd">' + esc(fmtDate(s.session_date)) + '</span>' +
          '<span class="hf">' + esc((s.day_label || "") + (s.focus ? " · " + s.focus : "")) + '</span>' +
          '<span class="hs ' + cls + '">' + esc(lbl) + '</span></div>';
      }).join("");
    } catch (e) { box.innerHTML = ""; }
  }

  // ---- Progress + achievement (Fase 3) ----
  function icoOf(n) { return window.FIC ? FIC(n, 18) : ""; }
  async function loadProgress() {
    var box = el("progBox"); if (!box) return;
    try {
      var pr = await apiFetch("/api/coach/progress"); var pj = await pr.json().catch(function () { return {}; });
      var ar = await apiFetch("/api/coach/achievements"); var aj = await ar.json().catch(function () { return {}; });
      renderProgress(box, pj || {}, aj || {});
    } catch (e) { box.innerHTML = '<div class="muted" style="font-size:12.5px">' + esc(Lx({ en: "Couldn't load progress.", id: "Gagal memuat progress." })) + '</div>'; }
  }
  function renderProgress(box, pj, aj) {
    var st = pj.stats || {}, exs = pj.exercises || [], badges = aj.badges || [];
    var earned = badges.filter(function (b) { return b.earned; }).length;
    var html = '<div class="pstat">' +
      '<div class="s"><b>' + (st.sessions_done || 0) + '</b><span>' + esc(Lx({ en: "Sessions", id: "Sesi" })) + '</span></div>' +
      '<div class="s"><b>' + (st.streak || 0) + '</b><span>' + esc(Lx({ en: "Day streak", id: "Streak hari" })) + '</span></div>' +
      '<div class="s"><b>' + (st.this_month || 0) + '</b><span>' + esc(Lx({ en: "This month", id: "Bulan ini" })) + '</span></div></div>';
    if (exs.length) {
      html += exs.map(function (e) {
        var mx = Math.max.apply(null, e.points.map(function (p) { return p.reps; }).concat([1]));
        var last = e.points[e.points.length - 1];
        var bars = e.points.map(function (p, i) { var h = Math.max(3, Math.round(p.reps / mx * 56)); return '<div class="b' + (i === e.points.length - 1 ? ' last' : '') + '" style="height:' + h + 'px" title="' + esc(p.date) + ': ' + p.reps + '"></div>'; }).join("");
        return '<div class="exchart"><div class="h">' + esc(e.name) + '<span class="v">' + (last ? last.reps : 0) + ' ' + esc(Lx({ en: "reps", id: "rep" })) + '</span></div><div class="bars2">' + bars + '</div></div>';
      }).join("");
    } else {
      html += '<div class="muted" style="font-size:12.5px;margin-top:8px">' + esc(Lx({ en: "Finish a workout to see progress per exercise.", id: "Selesaikan latihan untuk lihat progress per gerakan." })) + '</div>';
    }
    html += '<div class="sechd" style="margin:16px 2px 6px">' + esc(Lx({ en: "Achievements", id: "Pencapaian" })) + (badges.length ? ' <span class="muted" style="font-weight:600">' + earned + '/' + badges.length + '</span>' : '') + '</div>';
    if (badges.length) {
      html += '<div class="badges">' + badges.map(function (b) {
        return '<div class="badge2 ' + (b.earned ? 'on' : 'off') + '"><span class="bic">' + icoOf(b.icon) + '</span>' +
          '<span style="flex:1;min-width:0"><span class="bt" style="display:block">' + esc(Lx(b.name)) + '</span><span class="bd" style="display:block">' + esc(Lx(b.desc)) + '</span></span></div>';
      }).join("") + '</div>';
    } else {
      html += '<div class="muted" style="font-size:12.5px">' + esc(Lx({ en: "Badges unlock as you train.", id: "Badge terbuka seiring kamu latihan." })) + '</div>';
    }
    box.innerHTML = html;
  }

  // ============================ CHATBOT AI COACH ============================
  // Tampilan UTAMA /coach: pilih persona -> chat room. Balasan & riwayat lewat
  // /api/coach/chat (+ /history). Program terstruktur lama tetap ada (MODE 'program').
  function backBar() {
    if (MODE !== "program") return "";
    return '<button type="button" class="btn ghost" id="backToChat" style="width:auto;padding:9px 14px;margin-bottom:10px">‹ ' +
      esc(Lx({ en: "Back to coach chat", id: "Kembali ke chat coach" })) + '</button>';
  }
  function wireBackToChat() { var b = el("backToChat"); if (b) b.onclick = function () { MODE = "chat"; render(); }; }

  function coachColor(slug) { return CP.color(slug); }
  function coachInitial(slug) { return (COACH_NAME[slug] || "?").charAt(0).toUpperCase(); }
  function coachAvatar(slug, size) {
    size = size || 40;
    var fs = Math.round(size * 0.4), photo = CP.photo(slug), color = coachColor(slug);
    var ini = '<span class="cav-i" style="font-size:' + fs + 'px;background:' + color + (photo ? ';display:none' : '') + '">' + esc(coachInitial(slug)) + '</span>';
    var img = photo ? '<img src="' + esc(photo) + '" alt="' + esc(COACH_NAME[slug] || "") + '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' : '';
    return '<span class="cav ring" style="width:' + size + 'px;height:' + size + 'px;--cc:' + color + '"><span class="cav-in">' + img + ini + '</span></span>';
  }
  function greetOf(slug) {
    var n = USER_NAME ? (" " + USER_NAME) : "";
    var g = {
      nando: { en: "Yo" + n + "! Coach Nando here. What's the target today?", id: "Yo" + n + "! Coach Nando di sini. Apa target kamu hari ini?" },
      calysta: { en: "Hii" + n + "! I'm Coach Calysta! What are we working on today?", id: "Hai" + n + "! Aku Coach Calysta! Mau kita kerjain apa hari ini?" },
      rheza: { en: "Hey" + n + "! Coach Rheza here. Ready for a challenge?", id: "Hey" + n + "! Coach Rheza di sini. Siap ditantang?" },
      elsen: { en: "Hi" + n + ", I'm Coach Elsen. Let's look at your numbers — what would you like to review?", id: "Hai" + n + ", aku Coach Elsen. Kita lihat angka kamu — mau bahas apa?" },
    };
    return g[slug] || { en: "Hi" + n + "! How can I help with your training today?", id: "Hai" + n + "! Ada yang bisa dibantu soal latihanmu hari ini?" };
  }

  function renderChat() {
    var sub = el("coachSub"); if (sub) sub.textContent = Lx({ en: "Chat with your coach", id: "Chat sama coach kamu" });
    if (!CHAT_COACH) { renderCoachPicker(); return; }
    renderChatRoom();
    if (!CHAT_INIT) initChatConversation(); else paintMsgs();
  }

  function renderCoachPicker() {
    root().innerHTML =
      '<div class="card" style="padding:8px 12px 18px">' +
        '<div class="cq-hero"><div class="cq-orb">' + svgIcon("spark", 36) + '</div>' +
        '<h2 class="cq-h">' + esc(Lx({ en: "Consultation", id: "Konsultasi" })) + '</h2>' +
        '<p class="cq-s">' + esc(Lx({ en: "Pick a coach to consult — each has their own style, and they answer using your real 20FIT data.", id: "Pilih coach untuk konsultasi — tiap coach punya gaya sendiri, dan menjawab pakai data 20FIT kamu yang asli." })) + '</p></div>' +
        CP.box({ active: null }) + '</div>' +
      '<div class="card"><button type="button" class="cta-b" id="toProgram">' +
      '<span class="ic" style="background:color-mix(in srgb,var(--ai) 14%,transparent);color:var(--ai)">' + svgIcon("dumbbell") + '</span>' +
      '<span style="flex:1;min-width:0"><span class="ct">' + esc(Lx({ en: "Structured workout program", id: "Program latihan terstruktur" })) + '</span>' +
      '<span class="cs">' + esc(Lx({ en: "A weekly plan from a quick quiz", id: "Rencana mingguan dari quiz singkat" })) + '</span></span></button></div>';
    var tp = el("toProgram"); if (tp) tp.onclick = function () { MODE = "program"; render(); };
    CP.wire(root(), pickCoach);
    CP.loadNext();
  }
  // Di bawah /activity/chat, URL mengikuti coach yang aktif (reload/bagikan link = coach sama).
  function syncChatUrl() {
    try {
      if (!/^\/activity\/chat(\/|$)/i.test(location.pathname)) return;
      history.replaceState(null, "", "/activity/chat" + (CHAT_COACH ? "/" + CHAT_COACH : ""));
    } catch (e) {}
  }
  function pickCoach(slug) {
    if (!COACH_NAME[slug]) return;
    CHAT_COACH = slug; CHAT_INIT = false; CHAT_MSGS = [];
    try { localStorage.setItem("my20fit_coach_pick", slug); } catch (e) {}
    syncChatUrl();
    renderChat();
  }

  function renderChatRoom() {
    var color = coachColor(CHAT_COACH);
    root().innerHTML = '<div class="croom" style="--cc:' + color + '">' +
      '<div class="croom-h">' + coachAvatar(CHAT_COACH, 42) +
      '<div class="crn">' + esc(COACH_NAME[CHAT_COACH] || "Coach") +
      '<small class="crgame" id="crGame">' + gameLine() + '</small></div>' +
      '<button type="button" class="crsw" id="crSwitch">' + esc(Lx({ en: "Switch", id: "Ganti" })) + '</button></div>' +
      '<div class="cmsgs" id="cMsgs"></div>' +
      '<div class="cquick" id="cQuick" style="display:none">' + QUICKS.map(function (q, i) { return '<button type="button" class="cqbtn" data-q="' + i + '">' + esc(Lx(q[0])) + '</button>'; }).join("") + '</div>' +
      '<div class="cinput"><span class="spark">' + svgIcon("spark", 18) + '</span>' +
      '<textarea id="cText" rows="1" placeholder="' + esc(Lx({ en: "Message your coach…", id: "Tulis pesan ke coach…" })) + '"></textarea>' +
      '<button type="button" class="csend" id="cSend" aria-label="Send">' + svgIcon("send", 20) + '</button></div></div>';
    el("crSwitch").onclick = function () { CHAT_COACH = null; CHAT_INIT = false; CHAT_MSGS = []; try { localStorage.removeItem("my20fit_coach_pick"); } catch (e) {} syncChatUrl(); renderChat(); };
    Array.prototype.forEach.call(root().querySelectorAll("#cQuick [data-q]"), function (b) { b.onclick = function () { var q = QUICKS[+b.getAttribute("data-q")]; if (q) sendChat(Lx(q[1])); }; });
    var ta = el("cText"), send = el("cSend");
    function autin() { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px"; }
    function doSend() { var v = ta.value.trim(); if (!v) return; ta.value = ""; autin(); sendChat(v); }
    ta.addEventListener("input", autin);
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } });
    send.onclick = doSend;
    if (PREFILL) { ta.value = PREFILL; PREFILL = ""; autin(); try { ta.focus(); } catch (e) {} }
    loadGame();
  }
  // Streak & level (gamifikasi) — dihitung server dari data asli; gagal = baris kosong.
  function gameLine() {
    if (!GAME) return "";
    return svgIcon("fire", 13) + " " + esc((GAME.current_streak || 0) + Lx({ en: "-day streak", id: " hari streak" })) + " · " + svgIcon("star", 13) + " " + esc("Lv." + (GAME.level || 1));
  }
  async function loadGame() {
    try {
      var r = await apiFetch("/api/coach/achievements"); var j = await r.json().catch(function () { return {}; });
      if (j && j.ok && j.game) { GAME = j.game; var g = el("crGame"); if (g) g.innerHTML = gameLine(); }
    } catch (e) {}
  }
  // Token aksi dari balasan coach -> tombol (URL ditentukan di sini, bukan oleh AI). [url, label, ikon]
  // Navigasi same-tab (CLAUDE.md: tanpa target=_blank).
  var ACTIONS = {
    BOOK_CLASS: ["/book-class", { en: "Book Class →", id: "Book Class →" }, "cal"],
    BOOK_DOCTOR: ["/book-doctor", { en: "Book Doctor →", id: "Book Doctor →" }, "clinic"],
    ARENA_MAPS: ["https://www.google.com/maps/search/?api=1&query=20FIT+Arena+Menteng+Prada", { en: "20FIT Arena — Google Maps", id: "20FIT Arena — Google Maps" }, "pin"],
    VISBODY: ["/activity/visbody", { en: "My Visbody results", id: "Hasil Visbody aku" }, "chart"],
    TRACK_MEAL: ["/calories", { en: "Track meals in Calorie Tracker →", id: "Catat makan di Calorie Tracker →" }, "meal"],
  };
  var SLOT_LBL = { breakfast: { en: "Breakfast", id: "Sarapan" }, lunch: { en: "Lunch", id: "Makan siang" }, dinner: { en: "Dinner", id: "Makan malam" }, snack: { en: "Snack", id: "Snack" } };
  // Signature isi plan (jsonb di DB bisa mengubah urutan key -> jangan bandingkan JSON mentah).
  function mealSig(p) {
    return p ? [p.title, p.calorie_target].concat((p.meals || []).map(function (m) { return m.slot + ":" + m.menu; })).join("|") : "";
  }
  function mealApplyBtn(p) {
    return MEAL_APPLIED && MEAL_APPLIED === mealSig(p)
      ? svgIcon("check", 15) + ' ' + esc(Lx({ en: "Applied", id: "Sudah diterapkan" }))
      : svgIcon("meal", 15) + ' ' + esc(Lx({ en: "Apply meal plan", id: "Terapkan meal plan" }));
  }
  // Kartu meal plan: [[MEAL_PLAN]]{json}[[/MEAL_PLAN]] (json dinormalisasi server).
  function mealCard(js) {
    var p; try { p = JSON.parse(js); } catch (e) { return ""; }
    if (!p || !Array.isArray(p.meals) || !p.meals.length) return "";
    var i = MEAL_CARDS.push(p) - 1;
    return '<div class="cmeal"><b class="cmeal-t">' + svgIcon("clipboard", 15) + ' ' + esc(p.title || "Meal plan") + '</b>' +
      (p.calorie_target ? '<span class="cmeal-k">± ' + esc(p.calorie_target) + ' ' + esc(Lx({ en: "kcal/day", id: "kkal/hari" })) + '</span>' : '') +
      '<ul class="cmeal-l">' + p.meals.map(function (m) {
        return '<li><span class="cmeal-s">' + esc(Lx(SLOT_LBL[m.slot] || SLOT_LBL.snack)) + '</span><span class="cmeal-m">' + esc(m.menu) + '</span>' +
          '<span class="cmeal-n">' + (m.kcal ? esc(m.kcal) + ' ' + esc(Lx({ en: "kcal", id: "kkal" })) : '') + (m.protein_g ? ' · ' + esc(m.protein_g) + 'g P' : '') + '</span></li>';
      }).join("") + '</ul>' +
      (p.notes ? '<span class="cmeal-x">' + esc(p.notes) + '</span>' : '') +
      '<span class="cmeal-a"><button type="button" class="cmeal-go" data-meal-i="' + i + '">' + mealApplyBtn(p) + '</button>' +
      '<a class="cact" href="' + esc(ACTIONS.TRACK_MEAL[0]) + '">' + svgIcon("meal", 14) + ' ' + esc(Lx(ACTIONS.TRACK_MEAL[1])) + '</a></span></div>';
  }
  async function applyMeal(btn) {
    var p = MEAL_CARDS[+btn.getAttribute("data-meal-i")]; if (!p || btn.disabled) return;
    btn.disabled = true;
    try {
      var r = await apiFetch("/api/coach/meal-plan/apply", { method: "POST", body: JSON.stringify({ coach_id: CHAT_COACH, plan: p }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.ok) throw new Error((j && j.error) || "fail");
      MEAL_APPLIED = mealSig(j.meal_plan && j.meal_plan.plan);
    } catch (e) {
      btn.disabled = false;
      btn.innerHTML = svgIcon("warn", 15) + ' ' + esc(Lx({ en: "Failed — tap to retry", id: "Gagal — ketuk untuk coba lagi" }));
      return;
    }
    btn.disabled = false;
    Array.prototype.forEach.call(document.querySelectorAll(".cmeal-go[data-meal-i]"), function (b) { b.innerHTML = mealApplyBtn(MEAL_CARDS[+b.getAttribute("data-meal-i")]); });
  }
  async function loadAppliedMeal() {
    try {
      var r = await apiFetch("/api/coach/meal-plan"); var j = await r.json().catch(function () { return {}; });
      MEAL_APPLIED = (j && j.meal_plan) ? mealSig(j.meal_plan.plan) : "";
    } catch (e) {}
  }
  // Workout plan dari chat = TABEL (hari · fokus · latihan · menit). Plan aslinya tersimpan di DB
  // (plan aktif) dan bisa diubah user di /activity — tombol "Ubah" membuka editor di sana.
  function workoutCard(js) {
    var p; try { p = JSON.parse(js); } catch (e) { return ""; }
    if (!p || !Array.isArray(p.days) || !p.days.length) return "";
    var unitLbl = { sec: Lx({ en: "sec", id: "dtk" }), min: Lx({ en: "min", id: "mnt" }) };
    var rows = p.days.map(function (d) {
      var ex = (d.exercises || []).map(function (e) {
        return '<li>' + esc(e.name) + ' <span>' + esc((e.sets || 1) + '×' + (e.reps || "") + (unitLbl[e.unit] ? " " + unitLbl[e.unit] : "")) + '</span></li>';
      }).join("");
      return '<tr><th scope="row">' + esc(d.label || "") + (d.focus ? '<small>' + esc(d.focus) + '</small>' : '') + '</th>' +
        '<td><ul>' + ex + '</ul></td><td class="cwp-m">' + (d.duration_min ? esc(d.duration_min) + "'" : "—") + '</td></tr>';
    }).join("");
    return '<div class="cwp"><div class="cwp-h"><b>' + svgIcon("dumbbell", 15) + ' ' + esc(p.title || "Workout plan") + '</b>' +
      (p.saved ? '<span class="cwp-ok">' + svgIcon("check", 13) + ' ' + esc(Lx({ en: "Saved to Activity", id: "Tersimpan di Activity" })) + '</span>'
               : '<span class="cwp-no">' + esc(Lx({ en: "Not saved yet — ask me again", id: "Belum tersimpan — minta ulang ya" })) + '</span>') + '</div>' +
      '<div class="cwp-t"><table><thead><tr><th>' + esc(Lx({ en: "Day", id: "Hari" })) + '</th><th>' + esc(Lx({ en: "Exercises", id: "Latihan" })) +
      '</th><th>' + esc(Lx({ en: "Min", id: "Mnt" })) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (p.note ? '<span class="cwp-x">' + esc(p.note) + '</span>' : '') +
      (p.saved ? '<span class="cwp-a"><a href="/activity#edit-plan">' + svgIcon("clipboard", 14) + ' ' + esc(Lx({ en: "Edit in Activity", id: "Ubah di Activity" })) + '</a>' +
        '<a href="/activity/plan">' + esc(Lx({ en: "Plan detail →", id: "Detail plan →" })) + '</a></span>' : '') + '</div>';
  }
  // Blok kartu (meal plan / workout plan) dipisah dulu — JSON-nya tak boleh ikut di-escape/diformat.
  function renderReply(text) {
    return String(text || "").split(/\[\[(MEAL_PLAN|WORKOUT_PLAN)\]\]([\s\S]*?)\[\[\/\1\]\]/).map(function (part, k, arr) {
      if (k % 3 === 1) return "";                       // nama token (ditangani di elemen berikutnya)
      if (k % 3 === 2) return arr[k - 1] === "MEAL_PLAN" ? mealCard(part) : workoutCard(part);
      return renderText(part);
    }).join("");
  }
  function renderText(text) {
    var h = esc(text).replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|\n)[ \t]*[*-][ \t]+/g, "$1• ");   // daftar markdown "* " / "- " -> bullet
    h = h.replace(/\[\[([A-Z_]+)\]\]/g, function (m, k) {
      var a = ACTIONS[k]; if (!a) return "";
      return '<a class="cact" href="' + esc(a[0]) + '">' + svgIcon(a[2], 14) + ' ' + esc(Lx(a[1])) + '</a>';
    });
    return h.replace(/\n/g, "<br>");
  }

  function paintMsgs() {
    var box = el("cMsgs"); if (!box) return;
    var quick = el("cQuick");
    if (!CHAT_MSGS.length && !CHAT_BUSY) {          // belum ada percakapan -> empty state
      if (quick) quick.style.display = "none";
      box.innerHTML = emptyStateHTML();
      wireQuickCards();
      return;
    }
    if (quick) quick.style.display = "";
    MEAL_CARDS = [];
    var html = CHAT_MSGS.map(function (m, i) {
      // Gagal kirim = catatan sistem (bukan jawaban coach) + tombol kirim ulang.
      if (m.role === "error") return '<div class="cmsg err">' + svgIcon("warn", 14) + ' <span>' + esc(m.content) + '</span>' +
        '<button type="button" class="cretry" data-retry-i="' + i + '">' + esc(Lx({ en: "Try again", id: "Coba lagi" })) + '</button></div>';
      return '<div class="cmsg ' + (m.role === "user" ? "me" : "ai") + '">' + (m.role === "user" ? esc(m.content).replace(/\n/g, "<br>") : renderReply(m.content)) + '</div>';
    }).join("");
    if (CHAT_BUSY) html += '<div class="cmsg ai typing"><span></span><span></span><span></span></div>';
    box.innerHTML = html; box.scrollTop = box.scrollHeight;
    Array.prototype.forEach.call(box.querySelectorAll(".cmeal-go[data-meal-i]"), function (b) { b.onclick = function () { applyMeal(b); }; });
    Array.prototype.forEach.call(box.querySelectorAll(".cretry[data-retry-i]"), function (b) {
      b.onclick = function () {
        var i = +b.getAttribute("data-retry-i"), m = CHAT_MSGS[i]; if (!m || CHAT_BUSY) return;
        CHAT_MSGS.splice(i - 1, 2);   // pesan user yang gagal + catatan errornya; sendChat menambahkan ulang
        sendChat(m.retry);
      };
    });
  }
  // Empty state ala referensi: sapaan personal + chip data ASLI (health score) + kartu prompt.
  function emptyStateHTML() {
    var chips = [];
    if (HEALTH != null) chips.push(svgIcon("heart", 13) + ' ' + esc(Lx({ en: "Health score", id: "Health score" })) + ' ' + HEALTH + '/100');
    var bd = (HS_DATA && HS_DATA.breakdown) || {};
    if (HS_DATA && HS_DATA.week) chips.push(svgIcon("dumbbell", 13) + ' ' + esc(Lx({ en: "This week: ", id: "Minggu ini: " }) + HS_DATA.week.sessions + "x workout"));
    if (bd.body && bd.body.detail) chips.push(svgIcon("chart", 13) + ' Visbody: ' + esc(bd.body.detail));
    if (bd.nutrition && bd.nutrition.detail) chips.push(svgIcon("meal", 13) + ' ' + esc(bd.nutrition.detail));
    var chip = chips.length ? '<span class="cchips">' + chips.map(function (c) { return '<span class="cchip-data">' + c + '</span>'; }).join("") + '</span>' : '';
    var cards = QUICKS.slice(0, 4).map(function (q, i) {
      return '<button type="button" class="qcard" data-q="' + i + '"><span class="qi">' + svgIcon(q[2] || "spark", 18) + '</span><span class="ql">' + esc(Lx(q[0])) + '</span></button>';
    }).join("");
    return '<div class="cintro">' + coachAvatar(CHAT_COACH, 74) +
      '<div class="cintro-h">' + esc(Lx(greetOf(CHAT_COACH))) + '</div>' + chip +
      '<div class="cintro-s">' + esc(Lx({ en: "Ask anything about workouts, nutrition or recovery — I use your real 20FIT data.", id: "Tanya apa aja soal latihan, nutrisi, atau recovery — aku pakai data 20FIT kamu yang asli." })) + '</div>' +
      '<div class="qcards">' + cards + '</div></div>';
  }
  function wireQuickCards() {
    Array.prototype.forEach.call(root().querySelectorAll(".qcard[data-q]"), function (b) {
      b.onclick = function () { var q = QUICKS[+b.getAttribute("data-q")]; if (q) sendChat(Lx(q[1])); };
    });
  }

  async function initChatConversation() {
    CHAT_INIT = true;
    var auto = null;
    try {
      var raw = sessionStorage.getItem("chat_context");
      if (raw) { sessionStorage.removeItem("chat_context"); var cx = JSON.parse(raw); if (cx && cx.auto_message) auto = String(cx.auto_message); }
    } catch (e) {}
    await Promise.all([loadChatHistory(), loadAppliedMeal()]);
    if (auto) { sendChat(auto); return; }
    paintMsgs();   // kosong -> empty state (sapaan + kartu prompt); ada riwayat -> bubble
  }

  async function loadChatHistory() {
    try {
      var r = await apiFetch("/api/coach/chat/history?coach_id=" + encodeURIComponent(CHAT_COACH));
      if (r.status === 401) { location.href = "/login"; return; }
      var j = await r.json().catch(function () { return {}; });
      CHAT_MSGS = ((j && j.messages) || []).map(function (m) { return { role: m.role === "user" ? "user" : "assistant", content: m.content }; });
    } catch (e) { if (!Array.isArray(CHAT_MSGS)) CHAT_MSGS = []; }
  }

  // Pesan gagal kirim. 429 = batas permintaan server: sebut kapan bisa dicoba lagi (header Retry-After).
  function chatErrText(r, j) {
    if (r.status === 429) {
      var sec = parseInt(r.headers.get("Retry-After"), 10), min = isFinite(sec) && sec > 0 ? Math.max(1, Math.ceil(sec / 60)) : null;
      return min ? Lx({ en: "Too many requests right now — try again in about " + min + " min.", id: "Lagi terlalu banyak permintaan — coba lagi sekitar " + min + " menit lagi." })
                 : Lx({ en: "Too many requests right now — try again in a moment.", id: "Lagi terlalu banyak permintaan — coba lagi sebentar lagi." });
    }
    return (j && j.error) || Lx({ en: "Sorry, I couldn't reply right now.", id: "Maaf, aku lagi nggak bisa jawab." });
  }

  async function sendChat(text) {
    text = String(text || "").trim();
    if (!text || CHAT_BUSY) return;
    CHAT_MSGS.push({ role: "user", content: text });
    CHAT_BUSY = true; paintMsgs();
    try {
      var r = await apiFetch("/api/coach/chat", { method: "POST", body: JSON.stringify({ coach_id: CHAT_COACH, message: text, lang: (window.I18N && I18N.lang) || "id" }) });
      if (r.status === 401) { location.href = "/login"; return; }
      var j = await r.json().catch(function () { return {}; });
      CHAT_BUSY = false;
      if (r.ok && j && j.reply) CHAT_MSGS.push({ role: "assistant", content: j.reply });
      else CHAT_MSGS.push({ role: "error", retry: text, content: chatErrText(r, j) });
      if (r.ok && j && j.plan) PLAN = j.plan;
      paintMsgs();
      if (r.ok) loadGame();
    } catch (e) {
      CHAT_BUSY = false;
      CHAT_MSGS.push({ role: "error", retry: text, content: Lx({ en: "Network error — your message wasn't sent.", id: "Koneksi bermasalah — pesanmu belum terkirim." }) });
      paintMsgs();
    }
  }

  if (window.I18N && I18N.onChange) I18N.onChange(function () { if (!BUSY && !INSESSION && !CHAT_BUSY) render(); });
  boot();
})();
