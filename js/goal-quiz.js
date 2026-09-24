/* goal-quiz.js — Quiz onboarding "Set Your Goal" untuk halaman Activity.
 *
 * TIGA PENYESUAIAN DARI SPESIFIKASI, SEMUANYA DISENGAJA:
 *
 * 1. BUKAN React/Vite/TypeScript/Tailwind. CLAUDE.md §5 melarang menambah framework atau
 *    bundler — repo ini vanilla HTML/CSS/JS. Pemilik sudah memutuskan hal yang sama untuk
 *    spesifikasi halaman Activity sebelumnya ("Vanilla, ikut aturan repo"). Jadi padanan
 *    "komponen" di sini = satu berkas yang mendaftarkan window.GoalQuiz dengan .mount().
 *    Semua perilaku, struktur, dan token dari spesifikasi tetap dipenuhi.
 *
 * 2. Tabel `my20fit_member_goals`, bukan `member_goals`. Alasan lengkap ada di
 *    db/supabase-migration-018-member-goals.sql (project Supabase dipakai bersama).
 *
 * 3. Palet Glass Bubble dipakai PERSIS nilainya sebagai default (gelap). Tapi halaman
 *    Activity punya tombol Light/Dark yang sudah jalan; kalau warna gelap di-hardcode,
 *    quiz ini jadi kotak hitam di halaman terang — persis cacat yang baru saja diperbaiki
 *    di halaman ini. Jadi ditambahkan blok light yang mengikuti class `theme-light` milik
 *    repo. Mode gelap = nilai spesifikasi apa adanya.
 *
 * Pakai:  GoalQuiz.mount(elemen, { onComplete: function(goal){...} })
 * Komponen ini HANYA menyimpan + memanggil onComplete. Tidak membuat rencana apa pun.
 */
(function () {
  "use strict";

  var CSS_ID = "goal-quiz-css";
  var FONT_ID = "goal-quiz-font";

  var CSS = [
    /* ---- Token Glass Bubble (nilai spesifikasi, mode gelap = default) ---- */
    ".gq{--gq-bg:#08080A;--gq-glass:rgba(255,255,255,0.04);--gq-glass-raised:rgba(255,255,255,0.07);",
    "--gq-border:rgba(255,255,255,0.08);--gq-border-strong:rgba(255,255,255,0.22);",
    "--gq-ink:#F4F6F8;--gq-ink-muted:#9BA3AF;--gq-ink-faint:#7C8794;",
    "--gq-accent:#3B82F6;--gq-accent-strong:#2563EB;--gq-accent-soft:rgba(59,130,246,0.15);--gq-on-accent:#FFFFFF;",
    "--gq-r-card:20px;--gq-r-inner:12px;--gq-r-pill:9999px;",
    "--gq-sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;--gq-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,monospace}",

    /* Mode terang: mengikuti class `theme-light` milik repo, bukan palet sendiri. */
    "html.theme-light .gq{--gq-bg:#F1F1F4;--gq-glass:rgba(255,255,255,0.72);--gq-glass-raised:rgba(255,255,255,0.9);",
    "--gq-border:rgba(10,9,8,0.10);--gq-border-strong:rgba(10,9,8,0.22);",
    "--gq-ink:#15171C;--gq-ink-muted:#5C626B;--gq-ink-faint:#8A8D94}",

    /* ---- Kerangka ---- */
    ".gq{font-family:var(--gq-sans);color:var(--gq-ink);max-width:440px;margin:0 auto;padding:16px;",
    "background-image:radial-gradient(120% 80% at 50% -10%,rgba(59,130,246,0.20),transparent 60%);background-color:var(--gq-bg)}",
    ".gq *{box-sizing:border-box}",
    ".gq-card{background:var(--gq-glass);border:1px solid var(--gq-border);border-radius:var(--gq-r-card);",
    "padding:20px;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}",
    ".gq-h{font-size:20px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px}",
    ".gq-sub{font-size:13px;color:var(--gq-ink-muted);margin:0 0 18px}",
    ".gq-q{font-size:13px;font-weight:700;margin:18px 0 9px}",
    ".gq-q:first-of-type{margin-top:0}",

    /* ---- Opsi: grid 2x2 & list vertikal ---- */
    ".gq-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}",
    ".gq-list{display:flex;flex-direction:column;gap:9px}",
    ".gq-opt{display:flex;align-items:center;gap:9px;width:100%;text-align:left;cursor:pointer;",
    "background:var(--gq-glass-raised);border:1px solid var(--gq-border);border-radius:var(--gq-r-inner);",
    "padding:12px;color:var(--gq-ink-muted);font-family:inherit;font-size:13px;font-weight:600}",
    ".gq-opt .gq-em{font-size:17px;line-height:1;flex:0 0 auto}",
    ".gq-opt .gq-lbl{flex:1;min-width:0}",
    /* Terpilih: border accent + background accent-soft + teks ink (spesifikasi) */
    ".gq-opt[aria-checked='true']{border-color:var(--gq-accent);background:var(--gq-accent-soft);color:var(--gq-ink)}",
    /* Radio bulat di KANAN untuk daftar level aktivitas */
    ".gq-dot{width:16px;height:16px;border-radius:var(--gq-r-pill);border:1px solid var(--gq-border-strong);flex:0 0 auto}",
    ".gq-opt[aria-checked='true'] .gq-dot{border-color:var(--gq-accent);background:var(--gq-accent);",
    "box-shadow:inset 0 0 0 3px var(--gq-glass)}",

    /* ---- Jadwal harian: 3 kotak sejajar, angka mono besar ---- */
    ".gq-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}",
    ".gq-box{background:var(--gq-glass-raised);border:1px solid var(--gq-border);border-radius:var(--gq-r-inner);padding:11px 9px}",
    ".gq-box .gq-k{font-size:11px;color:var(--gq-ink-faint);font-weight:700;margin-bottom:6px}",
    ".gq-box input{width:100%;background:transparent;border:0;padding:0;color:var(--gq-ink);",
    "font-family:var(--gq-mono);font-size:17px;font-weight:700;letter-spacing:-.02em;min-width:0}",
    ".gq-box input::-webkit-calendar-picker-indicator{filter:invert(.6);cursor:pointer}",
    "html.theme-light .gq-box input::-webkit-calendar-picker-indicator{filter:none}",

    /* ---- CTA ---- */
    ".gq-cta{width:100%;margin-top:20px;padding:14px;border:0;border-radius:var(--gq-r-inner);",
    "background:var(--gq-accent-strong);color:var(--gq-on-accent);font-family:inherit;font-size:14px;font-weight:800;",
    "cursor:pointer;box-shadow:0 8px 28px rgba(37,99,235,0.45)}",
    ".gq-cta[disabled]{opacity:.45;cursor:not-allowed;box-shadow:none}",
    ".gq-msg{margin-top:10px;font-size:12.5px;color:var(--gq-ink-muted);text-align:center;min-height:16px}",
    ".gq-msg.gq-bad{color:#F87171}",

    /* ---- Fokus keyboard: persis ring dari spesifikasi ---- */
    ".gq :focus-visible{outline:none;box-shadow:0 0 0 2px #08080A,0 0 0 4px #3B82F6}",
    "html.theme-light .gq :focus-visible{box-shadow:0 0 0 2px #F1F1F4,0 0 0 4px #3B82F6}",

    "@media(max-width:430px){.gq-box{padding:10px 7px}.gq-box .gq-k{font-size:10px}",
    ".gq-box input{font-size:15px}.gq-box input::-webkit-calendar-picker-indicator{display:none}",
    "#gqWater{font-size:12px}}"
  ].join("");

  var GOALS = [
    { v: "lose_weight",  e: FIC("fire"),     t: { en: "Lose weight",  id: "Turun berat" } },
    { v: "build_muscle", e: FIC("dumbbell"), t: { en: "Build muscle", id: "Massa otot" } },
    { v: "stamina",      e: FIC("run"),      t: { en: "Stamina",      id: "Stamina" } },
    { v: "race_prep",    e: FIC("medal"),    t: { en: "Race prep",    id: "Race prep" } }
  ];
  var LEVELS = [
    { v: "rare",     e: FIC("rest"),      t: { en: "Rarely",          id: "Jarang" } },
    { v: "light",    e: FIC("walk"),      t: { en: "1-2× a week", id: "1-2x seminggu" } },
    { v: "moderate", e: FIC("run"),       t: { en: "3-4× a week", id: "3-4x seminggu" } },
    { v: "daily",    e: FIC("lightning"), t: { en: "Every day",        id: "Tiap hari" } }
  ];
  var DIETS = [
    { v: "any",        e: FIC("meal"), t: { en: "Anything",   id: "Apa aja" } },
    { v: "halal",      e: FIC("veg"),  t: { en: "Halal",      id: "Halal" } },
    { v: "vegetarian", e: FIC("veg"),  t: { en: "Vegetarian", id: "Vegetarian" } },
    { v: "no_pork",    e: FIC("ban"),  t: { en: "No pork",    id: "No pork" } }
  ];

  function L(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function once(id, make) { if (!document.getElementById(id)) document.head.appendChild(make()); }

  function injectAssets() {
    once(FONT_ID, function () {
      var l = document.createElement("link");
      l.id = FONT_ID; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@700&display=swap";
      return l;
    });
    once(CSS_ID, function () {
      var st = document.createElement("style"); st.id = CSS_ID; st.textContent = CSS; return st;
    });
  }

  // Satu grup opsi. `dot` = tampilkan radio bulat di kanan (dipakai level aktivitas).
  function groupHtml(name, label, items, dot) {
    var opts = items.map(function (it, i) {
      return '<button type="button" class="gq-opt" role="radio" aria-checked="false"' +
        ' tabindex="' + (i === 0 ? "0" : "-1") + '" data-g="' + name + '" data-v="' + esc(it.v) + '">' +
        '<span class="gq-em" aria-hidden="true">' + it.e + '</span>' +
        '<span class="gq-lbl">' + esc(L(it.t)) + '</span>' +
        (dot ? '<span class="gq-dot" aria-hidden="true"></span>' : '') +
        '</button>';
    }).join("");
    return '<div class="gq-q" id="gq-lbl-' + name + '">' + esc(label) + '</div>' +
      '<div class="' + (dot ? "gq-list" : "gq-grid") + '" role="radiogroup" aria-labelledby="gq-lbl-' + name + '" data-group="' + name + '">' +
      opts + '</div>';
  }

  function mount(host, opts) {
    if (!host) throw new Error("GoalQuiz.mount: elemen tujuan wajib diisi");
    opts = opts || {};
    injectAssets();

    var state = {
      fitness_goal: null, activity_level: null, diet_pref: null,
      wake_time: "05:30", sleep_time: "22:30", water_target: "4-6 gelas"
    };

    host.classList.add("gq");
    host.innerHTML =
      '<div class="gq-card">' +
        '<h2 class="gq-h">' + esc(L({ en: "Set your goal", id: "Tentukan targetmu" })) + '</h2>' +
        '<p class="gq-sub">' + esc(L({
          en: "Answer these and the coach builds a plan that fits you.",
          id: "Jawab ini dan coach menyusun rencana yang pas buat kamu."
        })) + '</p>' +
        groupHtml("fitness_goal", L({ en: "Your fitness goal", id: "Goal fitness kamu" }), GOALS, false) +
        groupHtml("activity_level", L({ en: "How active are you now?", id: "Seaktif apa kamu sekarang?" }), LEVELS, true) +
        groupHtml("diet_pref", L({ en: "Eating preference", id: "Preferensi makan" }), DIETS, false) +
        '<div class="gq-q">' + esc(L({ en: "Daily schedule", id: "Jadwal harian" })) + '</div>' +
        '<div class="gq-three">' +
          '<div class="gq-box"><div class="gq-k">' + esc(L({ en: "Wake", id: "Bangun" })) + '</div>' +
            '<input type="time" id="gqWake" value="05:30" aria-label="' + esc(L({ en: "Wake time", id: "Jam bangun" })) + '"></div>' +
          '<div class="gq-box"><div class="gq-k">' + esc(L({ en: "Sleep", id: "Tidur" })) + '</div>' +
            '<input type="time" id="gqSleep" value="22:30" aria-label="' + esc(L({ en: "Sleep time", id: "Jam tidur" })) + '"></div>' +
          '<div class="gq-box"><div class="gq-k">' + esc(L({ en: "Water/day", id: "Air/hari" })) + '</div>' +
            '<input type="text" id="gqWater" value="4-6 gelas" inputmode="text" maxlength="40" aria-label="' +
            esc(L({ en: "Water per day", id: "Air per hari" })) + '"></div>' +
        '</div>' +
        '<button type="button" class="gq-cta" id="gqCta" disabled>' +
          esc(L({ en: "Build my plan →", id: "Buat rencana saya →" })) + '</button>' +
        '<div class="gq-msg" id="gqMsg" role="status" aria-live="polite"></div>' +
      '</div>';

    var cta = host.querySelector("#gqCta"), msg = host.querySelector("#gqMsg");

    function paint() {
      Array.prototype.forEach.call(host.querySelectorAll(".gq-opt"), function (b) {
        var on = state[b.getAttribute("data-g")] === b.getAttribute("data-v");
        b.setAttribute("aria-checked", on ? "true" : "false");
        // tabindex bergulir: hanya opsi terpilih yang masuk urutan Tab, sisanya lewat panah.
        b.tabIndex = on ? 0 : -1;
      });
      Array.prototype.forEach.call(host.querySelectorAll("[data-group]"), function (g) {
        if (!g.querySelector('[aria-checked="true"]')) g.querySelector(".gq-opt").tabIndex = 0;
      });
      cta.disabled = !(state.fitness_goal && state.activity_level && state.diet_pref &&
                       state.wake_time && state.sleep_time && String(state.water_target).trim());
    }

    function pick(btn) {
      state[btn.getAttribute("data-g")] = btn.getAttribute("data-v");
      paint(); btn.focus();
    }

    host.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".gq-opt") : null;
      if (b && host.contains(b)) pick(b);
    });
    // Panah kiri/kanan/atas/bawah berpindah opsi dalam satu grup; Space/Enter memilih.
    host.addEventListener("keydown", function (e) {
      var b = e.target.closest ? e.target.closest(".gq-opt") : null;
      if (!b) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(b); return; }
      var dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      var all = Array.prototype.slice.call(b.parentNode.querySelectorAll(".gq-opt"));
      var next = all[(all.indexOf(b) + dir + all.length) % all.length];
      pick(next);
    });

    ["gqWake", "gqSleep", "gqWater"].forEach(function (id) {
      host.querySelector("#" + id).addEventListener("input", function () {
        state[{ gqWake: "wake_time", gqSleep: "sleep_time", gqWater: "water_target" }[id]] = this.value;
        paint();
      });
    });

    function say(text, bad) { msg.textContent = text || ""; msg.className = "gq-msg" + (bad ? " gq-bad" : ""); }

    // ---- Muat jawaban lama (kalau ada) ----
    (async function prefill() {
      try {
        if (!window.Auth || !Auth.supabase) return;
        await Auth.ready;
        var u = await Auth.requireAuth();
        if (!u) return;
        var q = await Auth.supabase.from("my20fit_member_goals")
          .select("fitness_goal,activity_level,diet_pref,wake_time,sleep_time,water_target")
          .eq("user_id", u.id).limit(1);
        var row = q && q.data && q.data[0];
        if (!row) return;
        ["fitness_goal", "activity_level", "diet_pref"].forEach(function (k) { if (row[k]) state[k] = row[k]; });
        // Postgres `time` balik sebagai "05:30:00"; <input type=time> mau "05:30".
        if (row.wake_time) { state.wake_time = String(row.wake_time).slice(0, 5); host.querySelector("#gqWake").value = state.wake_time; }
        if (row.sleep_time) { state.sleep_time = String(row.sleep_time).slice(0, 5); host.querySelector("#gqSleep").value = state.sleep_time; }
        if (row.water_target) { state.water_target = row.water_target; host.querySelector("#gqWater").value = row.water_target; }
        paint();
      } catch (e) { /* prefill gagal bukan alasan memblokir quiz */ }
    })();

    // ---- Simpan ----
    cta.addEventListener("click", async function () {
      if (cta.disabled) return;
      var label = cta.textContent;
      cta.disabled = true; cta.textContent = L({ en: "Saving…", id: "Menyimpan…" }); say("");
      try {
        if (!window.Auth || !Auth.supabase) throw new Error("auth");
        await Auth.ready;
        var u = await Auth.requireAuth();
        if (!u) throw new Error("auth");
        var row = {
          user_id: u.id,
          fitness_goal: state.fitness_goal, activity_level: state.activity_level, diet_pref: state.diet_pref,
          wake_time: state.wake_time, sleep_time: state.sleep_time,
          water_target: String(state.water_target).trim().slice(0, 40),
          updated_at: new Date().toISOString()
        };
        var r = await Auth.supabase.from("my20fit_member_goals").upsert(row, { onConflict: "user_id" }).select().single();
        if (r.error) throw r.error;
        say(L({ en: "Saved.", id: "Tersimpan." }), false);
        cta.textContent = label; cta.disabled = false;
        if (typeof opts.onComplete === "function") opts.onComplete(r.data || row);
      } catch (e) {
        var m = String((e && e.message) || "");
        // Tabel belum dibuat -> beri tahu langkahnya, jangan error buntu.
        var belum = /my20fit_member_goals/.test(m) && /does not exist|schema cache|relation/i.test(m);
        say(belum
          ? L({ en: "Goals table isn't in the database yet (migration 018). Contact the admin.",
                id: "Tabel goal belum ada di database (migration 018). Hubungi admin." })
          : L({ en: "Couldn't save. Try again.", id: "Gagal menyimpan. Coba lagi." }), true);
        cta.textContent = label; cta.disabled = false;
      }
    });

    paint();
    return { get value() { return JSON.parse(JSON.stringify(state)); } };
  }

  window.GoalQuiz = { mount: mount };
})();
