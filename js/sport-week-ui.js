/* ============================================================================
 * SportWeekUI — tampilan plan mingguan di sekitar jadwal olahraga (Activity multi-sport, Fase 2).
 * SATU sumber render untuk halaman Plan (js/coach.js) dan kartu plan di /activity.
 * Datanya plan.kind === "sport_week" dari lib/sport-week.js (server, deterministik).
 *
 *   SportWeekUI.weekHtml(plan)            -> layout Sen–Min (ketuk hari = detail, tombol Pindah)
 *   SportWeekUI.bindWeek(host, plan, h)   -> h.onDone(dayKey, done) · h.onMove(from, to) · h.onStart(dayKey)
 *   SportWeekUI.todayInfo(plan)           -> {title, sub, kind, href, btn} untuk kartu "Sesi hari ini"
 *   SportWeekUI.countdownHtml(plan)       -> "X hari lagi menuju {event}" (atau "")
 *   SportWeekUI.mountBuilder(host, opts)  -> form susun plan (hari tersedia, durasi, lokasi, event)
 * ========================================================================== */
(function () {
  var DAY = [null, { en: "Mon", id: "Sen" }, { en: "Tue", id: "Sel" }, { en: "Wed", id: "Rab" }, { en: "Thu", id: "Kam" },
    { en: "Fri", id: "Jum" }, { en: "Sat", id: "Sab" }, { en: "Sun", id: "Min" }];
  var KIND = {
    sport: { ic: "target", en: "Your sport", id: "Olahragamu" },
    support: { ic: "dumbbell", en: "Supporting training", id: "Latihan pendukung" },
    recovery: { ic: "breathe", en: "Recovery", id: "Pemulihan" },
    rest: { ic: "moon", en: "Rest", id: "Istirahat" },
  };
  var PHASE = { base: { en: "Base phase", id: "Fase dasar" }, build: { en: "Build phase", id: "Fase meningkat" }, taper: { en: "Taper — event is close", id: "Menjelang event" } };
  function Lx(o) { return window.L ? window.L(o) : (o && (o.id || o.en)) || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function ic(n, sz) { return window.FIC ? window.FIC(n, sz || 18) : ""; }
  function todayDow() { var g = new Date().getDay(); return g === 0 ? 7 : g; }
  function minTxt(m) { return m ? " · " + m + " " + Lx({ en: "min", id: "mnt" }) : ""; }

  var CSS = ".swk{display:flex;flex-direction:column;gap:8px;margin-top:10px}" +
    ".swk-r{border:1px solid var(--a-line,var(--line));border-radius:14px;overflow:hidden;background:var(--a-surface,var(--card))}" +
    ".swk-h{display:flex;align-items:center;gap:10px;padding:11px 12px;cursor:pointer;width:100%;background:none;border:0;font:inherit;color:inherit;text-align:left}" +
    ".swk-d{width:38px;flex:none;font-weight:800;font-size:13px;color:var(--a-mut,var(--muted))}" +
    ".swk-i{width:30px;height:30px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center}" +
    ".swk-t{flex:1;min-width:0;font-size:13.5px;font-weight:700;line-height:1.3}" +
    ".swk-t small{display:block;font-weight:600;font-size:11.5px;color:var(--a-mut,var(--muted));margin-top:1px}" +
    ".swk-r.k-sport .swk-i{background:color-mix(in srgb,var(--fit-red,#E4002B) 14%,transparent);color:var(--fit-red,#E4002B)}" +
    ".swk-r.k-support .swk-i{background:color-mix(in srgb,var(--accent,#2F6BFF) 14%,transparent);color:var(--accent,#2F6BFF)}" +
    ".swk-r.k-recovery .swk-i{background:color-mix(in srgb,#16A34A 14%,transparent);color:#16A34A}" +
    ".swk-r.k-rest .swk-i{background:color-mix(in srgb,var(--a-txt,var(--txt)) 7%,transparent);color:var(--a-mut,var(--muted))}" +
    ".swk-r.k-rest .swk-t{color:var(--a-mut,var(--muted));font-weight:600}" +
    ".swk-r.today{border-color:var(--accent,#2F6BFF);box-shadow:0 0 0 1px var(--accent,#2F6BFF) inset}" +
    ".swk-r.done .swk-t{text-decoration:line-through;opacity:.6}" +
    ".swk-tag{font-size:10.5px;font-weight:800;padding:3px 8px;border-radius:99px;flex:none;background:color-mix(in srgb,var(--a-txt,var(--txt)) 6%,transparent);color:var(--a-mut,var(--muted))}" +
    ".swk-b{padding:0 12px 12px 60px;font-size:12.5px;color:var(--a-mut,var(--muted));line-height:1.5}" +
    ".swk-ex{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px dashed var(--a-line,var(--line));color:var(--a-txt,var(--txt));font-size:13px}" +
    ".swk-ex span:last-child{color:var(--a-mut,var(--muted));font-family:var(--mono,monospace);font-size:12px;white-space:nowrap}" +
    ".swk-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;align-items:center}" +
    ".swk-btn{border:1px solid var(--a-line,var(--line));background:none;color:var(--a-txt,var(--txt));border-radius:10px;padding:8px 12px;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;min-height:38px}" +
    ".swk-btn.pri{background:var(--accent,#2F6BFF);border-color:var(--accent,#2F6BFF);color:#fff}" +
    ".swk-btn:focus-visible,.swk-h:focus-visible{outline:2px solid var(--accent,#2F6BFF);outline-offset:2px}" +
    ".swk-mv{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}" +
    ".swk-cd{display:flex;align-items:center;gap:10px;border-radius:14px;padding:12px;margin-top:10px;background:color-mix(in srgb,var(--fit-red,#E4002B) 9%,transparent);border:1px solid color-mix(in srgb,var(--fit-red,#E4002B) 30%,transparent)}" +
    ".swk-cd b{display:block;font-size:14px}.swk-cd span{font-size:12px;color:var(--a-mut,var(--muted))}" +
    ".swk-note{font-size:12.5px;line-height:1.45;border-radius:12px;padding:10px 12px;margin-top:8px;background:color-mix(in srgb,var(--amber,#F59E0B) 12%,transparent);border:1px solid color-mix(in srgb,var(--amber,#F59E0B) 35%,transparent)}" +
    ".swb-l{font-size:12px;font-weight:800;color:var(--a-mut,var(--muted));text-transform:uppercase;letter-spacing:.5px;margin:14px 0 6px}" +
    ".swb-row{display:flex;flex-wrap:wrap;gap:8px}" +
    ".swb-c{border:1px solid var(--a-line,var(--line));border-radius:11px;padding:9px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;background:none;color:var(--a-txt,var(--txt));min-height:40px}" +
    ".swb-c.on{background:var(--accent,#2F6BFF);border-color:var(--accent,#2F6BFF);color:#fff}" +
    ".swb-c:disabled{opacity:.45;cursor:not-allowed}" +
    ".swb-in{width:100%;padding:11px 12px;border:1px solid var(--a-line,var(--line));border-radius:10px;background:none;color:var(--a-txt,var(--txt));font:inherit;font-size:14px;margin-top:6px}" +
    ".swb-err{color:var(--fit-red,#E4002B);font-size:12.5px;margin-top:8px;min-height:16px}" +
    ".swk-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:10px}" +
    ".swk-cell{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 0;border-radius:10px;font-size:11px;font-weight:800;color:var(--a-mut,var(--muted))}" +
    ".swk-cell .swk-i{width:26px;height:26px;border-radius:8px}" +
    ".swk-cell.today{background:color-mix(in srgb,var(--accent,#2F6BFF) 10%,transparent);color:var(--a-txt,var(--txt))}" +
    ".swk-cell.k-sport .swk-i{background:color-mix(in srgb,var(--fit-red,#E4002B) 14%,transparent);color:var(--fit-red,#E4002B)}" +
    ".swk-cell.k-support .swk-i{background:color-mix(in srgb,var(--accent,#2F6BFF) 14%,transparent);color:var(--accent,#2F6BFF)}" +
    ".swk-cell.k-recovery .swk-i{background:color-mix(in srgb,#16A34A 14%,transparent);color:#16A34A}" +
    ".swk-cell.k-rest .swk-i{background:color-mix(in srgb,var(--a-txt,var(--txt)) 7%,transparent)}" +
    ".swk-today{border-radius:14px;padding:12px;margin-top:10px;border:1px solid var(--a-line,var(--line))}" +
    ".swk-today b{display:block;font-size:14.5px}.swk-today p{margin:3px 0 10px;font-size:12.5px;color:var(--a-mut,var(--muted));line-height:1.45}";
  function injectCss() { if (document.getElementById("swk-css")) return; var st = document.createElement("style"); st.id = "swk-css"; st.textContent = CSS; document.head.appendChild(st); }

  function entryIcon(e, packs) {
    if (e.kind === "sport" && e.sports && e.sports[0] && packs) {
      var p = packs.filter(function (x) { return x.key === e.sports[0].sport_key; })[0];
      if (p) return p.icon;
    }
    return KIND[e.kind].ic;
  }
  function dayOf(plan, key) { return (plan.days || []).filter(function (d) { return d.key === key; })[0] || null; }
  function tagTxt(e) {
    if (e.kind === "rest") return "";
    return Lx(e.intensity === "hard" ? { en: "hard", id: "berat" } : (e.intensity === "easy" ? { en: "light", id: "ringan" } : { en: "moderate", id: "sedang" }));
  }

  function countdownHtml(plan) {
    var ev = plan && plan.event;
    if (!ev || ev.days_left == null || ev.days_left < 0) return "";
    var t = ev.days_left === 0 ? Lx({ en: "Event day: " + ev.name + "!", id: "Hari ini: " + ev.name + "!" })
      : Lx({ en: ev.days_left + " days to " + ev.name, id: ev.days_left + " hari lagi menuju " + ev.name });
    return '<div class="swk-cd">' + ic("medal", 22) + '<div><b>' + esc(t) + '</b><span>' + esc(PHASE[ev.phase] ? Lx(PHASE[ev.phase]) : "") + '</span></div></div>';
  }

  function weekHtml(plan, opts) {
    injectCss(); opts = opts || {};
    var td = todayDow(), packs = opts.packs || null;
    var h = countdownHtml(plan);
    if (plan.next && plan.next.from) h += '<div class="swk-note">' + esc(Lx({ en: "Your sports changed — the adjusted plan starts on " + plan.next.from + ". This week stays as is.", id: "Olahragamu berubah — plan yang disesuaikan berlaku mulai " + plan.next.from + ". Minggu ini tetap." })) + '</div>';
    (plan.warnings || []).forEach(function (w) { h += '<div class="swk-note">' + esc(Lx(w)) + '</div>'; });
    h += '<div class="swk">' + (plan.week || []).map(function (e) {
      var d = e.day_key ? dayOf(plan, e.day_key) : null, done = !!(d && d.done);
      var body = "";
      if (d) {
        body = (e.note ? '<div>' + esc(Lx(e.note)) + '</div>' : "") + (d.exercises || []).map(function (x) {
          return '<div class="swk-ex"><span>' + esc(x.name) + '</span><span>' + esc((x.sets || 1) + " × " + x.reps + (/^\d+(\s*[-–]\s*\d+)?$/.test(String(x.reps)) ? " " + Lx(x.unit === "sec" ? { en: "sec", id: "dtk" } : (x.unit === "min" ? { en: "min", id: "mnt" } : { en: "reps", id: "rep" })) : "")) + '</span></div>';
        }).join("") + '<div class="swk-acts">' +
          (e.dow === td && opts.onStart ? '<button type="button" class="swk-btn pri" data-start="' + esc(d.key) + '">' + esc(Lx({ en: "Start session", id: "Mulai sesi" })) + '</button>' : "") +
          '<button type="button" class="swk-btn" data-done="' + esc(d.key) + '" aria-pressed="' + done + '">' + ic(done ? "boxcheck" : "box", 16) + esc(Lx(done ? { en: "Done", id: "Selesai" } : { en: "Mark done", id: "Tandai selesai" })) + '</button>';
      } else if (e.kind === "sport") {
        body = '<div>' + esc(Lx({ en: "Your main session — upload your tracker after playing for an analysis.", id: "Sesi utamamu — upload data tracker setelah selesai untuk analisa." })) + '</div><div class="swk-acts">' +
          '<a class="swk-btn" href="/activity#upload-workout">' + ic("upload", 16) + esc(Lx({ en: "Upload after", id: "Upload setelahnya" })) + '</a>';
      } else {
        body = '<div>' + esc(e.note ? Lx(e.note) : Lx({ en: "Full rest — sleep well and drink enough.", id: "Istirahat penuh — tidur cukup & minum cukup." })) + '</div><div class="swk-acts">';
      }
      if (opts.movable) body += '<button type="button" class="swk-btn" data-mvopen="' + e.dow + '">' + ic("calendar", 16) + esc(Lx({ en: "Move", id: "Pindah" })) + '</button>';
      body += '</div><div class="swk-mv" data-mvbox="' + e.dow + '" hidden></div>';
      var sub = e.sports && e.sports.length && e.kind === "sport" ? Lx({ en: "Your sport", id: "Jadwal olahragamu" }) : Lx(KIND[e.kind]);
      return '<div class="swk-r k-' + e.kind + (e.dow === td ? " today" : "") + (done ? " done" : "") + '">' +
        '<button type="button" class="swk-h" data-wk="' + e.dow + '" aria-expanded="false"><span class="swk-d">' + esc(Lx(DAY[e.dow])) + '</span>' +
        '<span class="swk-i">' + ic(entryIcon(e, packs), 17) + '</span>' +
        '<span class="swk-t">' + esc(Lx(e.title)) + esc(minTxt(e.minutes)) + '<small>' + esc(sub) + (e.dow === td ? " · " + esc(Lx({ en: "today", id: "hari ini" })) : "") + '</small></span>' +
        (tagTxt(e) ? '<span class="swk-tag">' + esc(tagTxt(e)) + '</span>' : "") + '</button>' +
        '<div class="swk-b" hidden>' + body + '</div></div>';
    }).join("") + '</div>';
    return h;
  }

  function bindWeek(host, plan, h) {
    h = h || {};
    host.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-wk],[data-done],[data-start],[data-mvopen],[data-mvto]"); if (!b || !host.contains(b)) return;
      if (b.hasAttribute("data-wk")) {
        var body = b.nextElementSibling, open = body.hidden;
        body.hidden = !open; b.setAttribute("aria-expanded", String(open)); return;
      }
      if (b.hasAttribute("data-done") && h.onDone) { var k = b.getAttribute("data-done"), d = dayOf(plan, k); h.onDone(k, !(d && d.done)); return; }
      if (b.hasAttribute("data-start") && h.onStart) { h.onStart(b.getAttribute("data-start")); return; }
      if (b.hasAttribute("data-mvopen")) {
        var from = +b.getAttribute("data-mvopen"), box = host.querySelector('[data-mvbox="' + from + '"]');
        box.hidden = !box.hidden;
        box.innerHTML = '<span style="width:100%;font-size:12px">' + esc(Lx({ en: "Swap with:", id: "Tukar dengan:" })) + '</span>' + [1, 2, 3, 4, 5, 6, 7].filter(function (x) { return x !== from; }).map(function (x) {
          return '<button type="button" class="swk-btn" data-mvto="' + from + ':' + x + '">' + esc(Lx(DAY[x])) + '</button>';
        }).join("");
        return;
      }
      if (b.hasAttribute("data-mvto") && h.onMove) { var a = b.getAttribute("data-mvto").split(":"); h.onMove(+a[0], +a[1]); }
    });
  }

  // Strip ringkas Sen–Min (kartu plan di /activity): warna/ikon per jenis hari.
  function stripHtml(plan) {
    injectCss();
    var td = todayDow();
    return '<div class="swk-strip">' + (plan.week || []).map(function (e) {
      return '<div class="swk-cell k-' + e.kind + (e.dow === td ? " today" : "") + '" title="' + esc(Lx(e.title)) + '"><span class="swk-i">' + ic(KIND[e.kind].ic, 15) + '</span>' + esc(Lx(DAY[e.dow])) + '</div>';
    }).join("") + '</div>';
  }
  // Kartu "Sesi hari ini" (satu kartu, satu tombol utama).
  function todayInfo(plan) {
    var e = (plan.week || []).filter(function (x) { return x.dow === todayDow(); })[0];
    if (!e) return null;
    if (e.kind === "sport") return { kind: e.kind, title: Lx({ en: "Today you play " + Lx(e.title), id: "Hari ini kamu main " + Lx(e.title) }) + minTxt(e.minutes),
      sub: Lx({ en: "Upload your tracker after you finish for an analysis.", id: "Upload setelah selesai untuk analisa." }), href: "/activity#upload-workout", btn: Lx({ en: "Upload after playing", id: "Upload setelah main" }) };
    if (e.kind === "support" || e.kind === "recovery") return { kind: e.kind, title: Lx(e.title) + minTxt(e.minutes), sub: e.note ? Lx(e.note) : Lx(KIND[e.kind]),
      href: "/activity/plan", btn: Lx({ en: "Start session", id: "Mulai sesi" }) };
    return { kind: "rest", title: Lx({ en: "Rest day", id: "Hari istirahat" }), sub: e.note ? Lx(e.note) : Lx({ en: "Sleep well and drink enough.", id: "Tidur cukup & minum cukup." }), href: null, btn: null };
  }

  // Form susun plan. opts: {sports:[rows], defaults:{avail_days,minutes,location,event}, onBuilt(planRow), apiFetch}
  function mountBuilder(host, opts) {
    injectCss();
    var sports = opts.sports || [], d = opts.defaults || {};
    var play = {}; sports.forEach(function (s) { (s.play_days || []).forEach(function (x) { play[x] = 1; }); });
    var st = {
      avail: (d.avail_days && d.avail_days.length ? d.avail_days : [1, 2, 3, 4, 5, 6, 7].filter(function (x) { return !play[x]; })).slice(),
      minutes: d.minutes || 30, location: d.location || "home",
      evMode: d.event ? (d.event.source === "ticket" ? "ticket" : "custom") : "none",
      evSlug: d.event && d.event.slug || "", evName: d.event && d.event.source === "custom" ? d.event.name : "", evDate: d.event && d.event.source === "custom" ? d.event.date : "",
      events: null, err: "",
    };
    function chip(attr, val, on, label, dis) { return '<button type="button" class="swb-c' + (on ? " on" : "") + '" data-' + attr + '="' + esc(val) + '" aria-pressed="' + on + '"' + (dis ? " disabled" : "") + '>' + esc(label) + '</button>'; }
    function render() {
      var h = '<div class="swb-l">' + esc(Lx({ en: "Days free for extra training", id: "Hari bisa latihan tambahan" })) + '</div><div class="swb-row">' +
        [1, 2, 3, 4, 5, 6, 7].map(function (x) { return chip("av", x, st.avail.indexOf(x) >= 0, Lx(DAY[x]) + (play[x] ? " ●" : "")); }).join("") + '</div>' +
        '<div class="muted" style="font-size:11.5px;margin-top:4px">● = ' + esc(Lx({ en: "your play/training day (stays as is)", id: "hari main/latihanmu (tidak diganti)" })) + '</div>' +
        '<div class="swb-l">' + esc(Lx({ en: "Minutes per session", id: "Durasi per sesi" })) + '</div><div class="swb-row">' +
        [20, 30, 45, 60].map(function (m) { return chip("min", m, st.minutes === m, m + " " + Lx({ en: "min", id: "mnt" })); }).join("") + '</div>' +
        '<div class="swb-l">' + esc(Lx({ en: "Where", id: "Lokasi" })) + '</div><div class="swb-row">' +
        [["home", { en: "Home, no equipment", id: "Rumah tanpa alat" }], ["gym", { en: "Gym", id: "Gym" }], ["arena", { en: "20FIT Arena", id: "20FIT Arena" }]]
          .map(function (o) { return chip("loc", o[0], st.location === o[0], Lx(o[1])); }).join("") + '</div>' +
        '<div class="swb-l">' + esc(Lx({ en: "Preparing for an event?", id: "Persiapan event?" })) + '</div><div class="swb-row">' +
        chip("ev", "none", st.evMode === "none", Lx({ en: "No", id: "Tidak" })) + chip("ev", "ticket", st.evMode === "ticket", Lx({ en: "20FIT event", id: "Event 20FIT" })) +
        chip("ev", "custom", st.evMode === "custom", Lx({ en: "Other event", id: "Event lain" })) + '</div>';
      if (st.evMode === "ticket") {
        if (st.events === null) h += '<div class="muted" style="font-size:12.5px;margin-top:8px">' + esc(Lx({ en: "Loading events…", id: "Memuat event…" })) + '</div>';
        else if (st.events === false) h += '<div class="muted" style="font-size:12.5px;margin-top:8px">' + esc(Lx({ en: "Couldn't load events.", id: "Gagal memuat event." })) + ' <button type="button" class="swk-btn" data-evretry="1">' + esc(Lx({ en: "Retry", id: "Coba lagi" })) + '</button></div>';
        else if (!st.events.length) h += '<div class="muted" style="font-size:12.5px;margin-top:8px">' + esc(Lx({ en: "No upcoming 20FIT events right now — pick \"Other event\".", id: "Belum ada event 20FIT mendatang — pilih \"Event lain\"." })) + '</div>';
        else h += '<div class="swb-row" style="margin-top:8px">' + st.events.map(function (e) { return chip("evs", e.slug, st.evSlug === e.slug, e.name + " · " + e.date); }).join("") + '</div>';
      }
      if (st.evMode === "custom") h += '<input class="swb-in" data-evname maxlength="80" placeholder="' + esc(Lx({ en: "Event name, e.g. padel tournament", id: "Nama event, mis. turnamen padel" })) + '" value="' + esc(st.evName) + '">' +
        '<input class="swb-in" data-evdate type="date" value="' + esc(st.evDate) + '" aria-label="' + esc(Lx({ en: "Event date", id: "Tanggal event" })) + '">';
      h += '<button type="button" class="swk-btn pri" data-build style="width:100%;justify-content:center;margin-top:16px;min-height:46px;font-size:14px">' + esc(Lx({ en: "Build my weekly plan", id: "Susun plan mingguan" })) + '</button>' +
        '<div class="swb-err" role="alert">' + esc(st.err) + '</div>';
      host.innerHTML = h;
    }
    async function loadEvents() {
      st.events = null; render();
      try { var r = await opts.apiFetch("/api/sport-plan/events"); var j = await r.json(); if (!r.ok) throw 0; st.events = j.events || []; }
      catch (e) { st.events = false; }
      render();
    }
    host.addEventListener("input", function (e) {
      if (e.target.hasAttribute("data-evname")) st.evName = e.target.value;
      if (e.target.hasAttribute("data-evdate")) st.evDate = e.target.value;
    });
    host.addEventListener("click", async function (e) {
      var b = e.target.closest("button"); if (!b || !host.contains(b)) return;
      st.err = "";
      if (b.hasAttribute("data-av")) { var x = +b.getAttribute("data-av"), i = st.avail.indexOf(x); if (i >= 0) st.avail.splice(i, 1); else st.avail.push(x); return render(); }
      if (b.hasAttribute("data-min")) { st.minutes = +b.getAttribute("data-min"); return render(); }
      if (b.hasAttribute("data-loc")) { st.location = b.getAttribute("data-loc"); return render(); }
      if (b.hasAttribute("data-ev")) { st.evMode = b.getAttribute("data-ev"); if (st.evMode === "ticket" && !st.events) return loadEvents(); return render(); }
      if (b.hasAttribute("data-evretry")) return loadEvents();
      if (b.hasAttribute("data-evs")) { st.evSlug = b.getAttribute("data-evs"); return render(); }
      if (!b.hasAttribute("data-build")) return;
      var ev = null;
      if (st.evMode === "ticket") { if (!st.evSlug) { st.err = Lx({ en: "Pick an event.", id: "Pilih event-nya." }); return render(); } ev = { source: "ticket", slug: st.evSlug }; }
      if (st.evMode === "custom") { if (String(st.evName).trim().length < 3 || !st.evDate) { st.err = Lx({ en: "Fill the event name and date.", id: "Isi nama event & tanggalnya." }); return render(); } ev = { source: "custom", name: st.evName, date: st.evDate }; }
      b.disabled = true;
      try {
        var r = await opts.apiFetch("/api/sport-plan", { method: "POST", body: JSON.stringify({ avail_days: st.avail, minutes: st.minutes, location: st.location, event: ev, lang: (window.I18N && I18N.lang) || "id" }) });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok) throw new Error(j.error || Lx({ en: "Couldn't build the plan.", id: "Gagal menyusun plan." }));
        opts.onBuilt(j.plan);
      } catch (err) { st.err = err.message; render(); }
    });
    if (window.I18N && I18N.onChange) I18N.onChange(render);
    if (st.evMode === "ticket") loadEvents(); else render();
  }

  window.SportWeekUI = { weekHtml: weekHtml, bindWeek: bindWeek, todayInfo: todayInfo, countdownHtml: countdownHtml, stripHtml: stripHtml, mountBuilder: mountBuilder };
})();
