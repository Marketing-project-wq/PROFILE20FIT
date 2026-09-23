/* ============================================================================
 * AI Coach (Fase 1) — halaman /coach
 * Alur: intro -> quiz analisa (+consent kesehatan) -> generate workout plan
 * (server: AI edge action=program -> fallback aturan) -> tampil plan + adjust + CTA.
 * WAJIB LOGIN. Data lewat route server /api/coach/* (service key + RLS).
 * Vanilla, glass, mobile-first, Bahasa Indonesia default (ikut i18n EN/ID).
 * ========================================================================== */
(function () {
  var user = null, QUIZ = null, PLAN = null, CFG = null, BUSY = false;

  function T(k) { return (window.I18N && I18N.t) ? I18N.t(k) : k; }
  function Lx(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(id) { return document.getElementById(id); }
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
    render();
  }

  function render() {
    clearErr();
    if (PLAN && PLAN.plan) renderPlan();
    else renderIntro();
  }

  // ---- Intro ----
  function renderIntro() {
    var done = !!QUIZ;
    root().innerHTML =
      '<div class="card hero"><div class="big">' + esc(Lx({ en: "Your AI training coach", id: "Pelatih AI kamu" })) + '</div>' +
      '<p>' + esc(Lx({ en: "Answer a few questions and get a weekly workout plan built around your goal, ability and schedule — no need to work out first.", id: "Jawab beberapa pertanyaan, dan dapat rencana latihan mingguan sesuai goal, kemampuan & jadwalmu — tanpa harus olahraga dulu." })) + '</p>' +
      '<ul><li>' + esc(Lx({ en: "Plan you can adjust anytime", id: "Plan bisa kamu adjust kapan saja" })) + '</li>' +
      '<li>' + esc(Lx({ en: "Safety screening first", id: "Skrining keamanan dulu" })) + '</li>' +
      '<li>' + esc(Lx({ en: "Option to consult a specialist or train with a coach", id: "Opsi konsultasi specialist atau latihan bareng coach" })) + '</li></ul>' +
      '<button class="btn" id="startQuiz">' + esc(done ? Lx({ en: "Retake quiz", id: "Ulang quiz" }) : Lx({ en: "Start quiz", id: "Mulai quiz" })) + '</button></div>';
    el("startQuiz").onclick = function () { if (QUIZ && QUIZ.answers) prefill(QUIZ); renderQuiz(); };
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
    var srcLbl = row.source === "ai" ? "AI COACH" : (row.source === "adjusted" ? Lx({ en: "Adjusted", id: "Disesuaikan" }) : Lx({ en: "Auto plan", id: "Plan otomatis" }));
    var html = '<div class="card"><div class="planhead"><div class="pn">' + esc(p.plan_name || "Workout plan") + '</div>' +
      '<div class="wn">' + esc(p.weekly_note || "") + '</div>' +
      '<span class="badge src">' + esc(srcLbl) + '</span></div>' +
      (p.needs_specialist ? '<div class="needspec">⚠️ ' + esc(Lx({ en: "Because of your safety screening, this is a conservative plan. Please consult a 20FIT specialist before starting.", id: "Karena hasil skrining keamananmu, ini plan versi konservatif. Sebaiknya konsultasi ke specialist 20FIT sebelum mulai." })) + '</div>' : '') +
      days.map(function (d, di) {
        return '<div class="day"><div class="day-h" data-day="' + di + '"><span class="dl">' + esc(d.label || ("Hari " + (di + 1))) + '</span>' +
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
      '<button class="btn ghost" id="adjRedo">' + esc(Lx({ en: "Retake quiz", id: "Ulang quiz" })) + '</button></div>' +
      '<div class="disc">' + esc(p.disclaimer || "") + '</div></div>';

    // CTA
    html += '<div class="sechd">' + esc(Lx({ en: "Next step", id: "Langkah berikutnya" })) + '</div>' +
      '<div class="card"><div class="ctawrap">' +
      ctaBtn("consult_specialist", "🩺", { en: "Consult a specialist first", id: "Konsultasi specialist dulu" }, { en: "20FIT Sports Clinic — recommended if you have pain/injury", id: "20FIT Sports Clinic — disarankan kalau ada nyeri/cedera" }, p.needs_specialist) +
      ctaBtn("membership", "🏋️", { en: "Train with a 20FIT coach", id: "Latihan bareng coach 20FIT" }, { en: "20FIT Arena / Gym membership", id: "Membership 20FIT Arena / Gym" }, false) +
      ctaBtn("start_solo", "🚀", { en: "Start on my own now", id: "Mulai sendiri sekarang" }, { en: "Follow the plan yourself", id: "Ikuti plan ini sendiri" }, false) +
      '</div></div>';
    root().innerHTML = html;

    Array.prototype.forEach.call(root().querySelectorAll(".day-h"), function (h) {
      h.onclick = function () { var b = h.nextElementSibling; if (b) b.style.display = (b.style.display === "none") ? "" : "none"; };
    });
    Array.prototype.forEach.call(root().querySelectorAll("[data-swap]"), function (b) {
      b.onclick = function () { var parts = b.getAttribute("data-swap").split("|"); adjust({ op: "swap", day_key: parts[0], ex_key: parts[1] }); };
    });
    el("adjEasier").onclick = function () { adjust({ op: "level", dir: "easier" }); };
    el("adjHarder").onclick = function () { adjust({ op: "level", dir: "harder" }); };
    el("adjRedo").onclick = function () { if (QUIZ) prefill(QUIZ); renderQuiz(); };
    Array.prototype.forEach.call(root().querySelectorAll("[data-cta]"), function (b) { b.onclick = function () { onCta(b.getAttribute("data-cta")); }; });
  }
  function ctaBtn(type, icon, title, sub, primary) {
    return '<button type="button" class="cta-b' + (primary ? " primary" : "") + '" data-cta="' + type + '">' +
      '<span class="ic" style="background:color-mix(in srgb,var(--accent) 14%,transparent)">' + icon + '</span>' +
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

  if (window.I18N && I18N.onChange) I18N.onChange(function () { if (!BUSY) render(); });
  boot();
})();
