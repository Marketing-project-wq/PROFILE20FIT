/* ============================================================================
 * SportPicker — pemilih olahraga user (maks 2), SATU komponen untuk onboarding & profil.
 * Data paket dari GET /api/sports (lib/sport-packs, DRAFT), simpan lewat PUT /api/me/sports.
 *
 *   var sp = SportPicker.mount(el, { detail: true });   // detail: tanya hari/level/tujuan
 *   await sp.ready;  sp.set(rows);  sp.validate() -> pesan | null;  await sp.save("profile")
 *
 * Batas 2 olahraga: ditegakkan di sini (hanya 2 slot + validate), di server, dan di DB.
 * Pakai variabel warna halaman (--red/--inp/--line/--txt/--muted) supaya ikut tema terang/gelap.
 * ========================================================================== */
(function () {
  var DAYS = [{ en: "Mon", id: "Sen" }, { en: "Tue", id: "Sel" }, { en: "Wed", id: "Rab" }, { en: "Thu", id: "Kam" },
    { en: "Fri", id: "Jum" }, { en: "Sat", id: "Sab" }, { en: "Sun", id: "Min" }];
  var packsP = null;
  function packs() {
    if (!packsP) packsP = fetch("/api/sports").then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .catch(function (e) { packsP = null; throw e; });
    return packsP;
  }
  function Lx(o) { return window.L ? window.L(o) : (o && (o.id || o.en)) || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function ic(name) { return window.FIC ? window.FIC(name, 18) : ""; }

  var CSS = ".spk{display:flex;flex-direction:column;gap:6px}" +
    ".spk-lbl{font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:12px 0 6px}" +
    ".spk-lbl small{text-transform:none;letter-spacing:0;font-weight:600}" +
    ".spk-row{display:flex;flex-wrap:wrap;gap:8px}" +
    ".spk-chip{display:inline-flex;align-items:center;gap:6px;padding:10px 13px;border:1px solid var(--line);border-radius:11px;background:var(--inp);color:var(--txt);font:inherit;font-size:14px;font-weight:700;cursor:pointer;min-height:44px}" +
    ".spk-chip.sm{padding:8px 11px;font-size:13px;min-height:40px}" +
    ".spk-chip.on{border-color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent);color:var(--red)}" +
    ".spk-chip:focus-visible{outline:2px solid var(--red);outline-offset:2px}" +
    ".spk-other{margin-top:8px}" +
    ".spk-other input{width:100%;padding:12px 13px;background:var(--inp);border:1px solid var(--line);border-radius:10px;color:var(--txt);font-size:15px}" +
    ".spk-det{border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:10px}" +
    ".spk-det h4{margin:0;font-size:14px;display:flex;align-items:center;gap:7px;color:var(--txt)}" +
    ".spk-note{font-size:12px;color:var(--muted);margin-top:8px;line-height:1.45}" +
    ".spk-err{font-size:12.5px;color:var(--red);margin-top:6px;min-height:16px}";
  function injectCss() {
    if (document.getElementById("spk-css")) return;
    var st = document.createElement("style"); st.id = "spk-css"; st.textContent = CSS; document.head.appendChild(st);
  }

  function mount(host, opts) {
    opts = opts || {};
    injectCss();
    var P = null;                       // {max, levels, sports}
    var slots = [null, null];           // [{sport_key, other_label, play_days, level, goal}] — utama, kedua
    var memo = {};                      // detail per olahraga, supaya tidak hilang saat pilihan diganti-ganti
    var err = "";

    function packOf(k) { return P && P.sports.filter(function (s) { return s.key === k; })[0]; }
    function blank(k) { return memo[k] ? Object.assign({}, memo[k]) : { sport_key: k, other_label: "", play_days: [], level: null, goal: null }; }
    function remember(s) { if (s) memo[s.sport_key] = Object.assign({}, s); }

    function chooseSlot(i, key) {
      remember(slots[i]);
      if (i === 1 && key === "") { slots[1] = null; render(); return; }
      if (slots[i] && slots[i].sport_key === key && !packOf(key).other) { if (i === 1) slots[1] = null; render(); return; }
      slots[i] = blank(key);
      // Olahraga kedua tidak boleh sama dengan utama ("Lainnya" dibedakan dari namanya).
      if (i === 0 && slots[1] && slots[1].sport_key === key && !packOf(key).other) slots[1] = null;
      render();
    }

    function sportChips(i) {
      var cur = slots[i] && slots[i].sport_key;
      var h = i === 1 ? '<button type="button" class="spk-chip' + (cur ? "" : " on") + '" data-slot="1" data-k="">' + esc(Lx({ en: "None", id: "Tidak ada" })) + "</button>" : "";
      P.sports.forEach(function (s) {
        if (i === 1 && slots[0] && slots[0].sport_key === s.key && !s.other) return;
        h += '<button type="button" class="spk-chip' + (cur === s.key ? " on" : "") + '" data-slot="' + i + '" data-k="' + s.key + '" aria-pressed="' + (cur === s.key) + '">' +
          ic(s.icon) + esc(Lx(s.label)) + "</button>";
      });
      return h;
    }
    function otherInput(i) {
      var s = slots[i]; if (!s || !packOf(s.sport_key).other) return "";
      return '<div class="spk-other"><input type="text" maxlength="40" data-other="' + i + '" value="' + esc(s.other_label || "") + '" placeholder="' +
        esc(Lx({ en: "Name of your sport, e.g. Tennis", id: "Nama olahraganya, mis. Tennis" })) + '" aria-label="' + esc(Lx({ en: "Sport name", id: "Nama olahraga" })) + '"></div>';
    }
    function detailBlock(i) {
      var s = slots[i]; if (!s) return "";
      var p = packOf(s.sport_key), name = p.other && s.other_label ? s.other_label : Lx(p.label);
      var days = DAYS.map(function (d, j) { var n = j + 1, on = s.play_days.indexOf(n) >= 0;
        return '<button type="button" class="spk-chip sm' + (on ? " on" : "") + '" data-day="' + i + ":" + n + '" aria-pressed="' + on + '">' + esc(Lx(d)) + "</button>"; }).join("");
      var lv = P.levels.map(function (l) { var on = s.level === l.key;
        return '<button type="button" class="spk-chip sm' + (on ? " on" : "") + '" data-lv="' + i + ":" + l.key + '" aria-pressed="' + on + '">' + esc(Lx(l)) + "</button>"; }).join("");
      var gl = p.goals.map(function (g) { var on = s.goal === g.key;
        return '<button type="button" class="spk-chip sm' + (on ? " on" : "") + '" data-goal="' + i + ":" + g.key + '" aria-pressed="' + on + '">' + esc(Lx(g)) + "</button>"; }).join("");
      return '<div class="spk-det"><h4>' + ic(p.icon) + esc(name) + "</h4>" +
        '<div class="spk-lbl">' + esc(Lx({ en: "Days you usually play / train", id: "Hari biasa main / latihan" })) + "</div><div class=\"spk-row\">" + days + "</div>" +
        '<div class="spk-lbl">' + esc(Lx({ en: "Level", id: "Level" })) + "</div><div class=\"spk-row\">" + lv + "</div>" +
        '<div class="spk-lbl">' + esc(Lx({ en: "Goal", id: "Tujuan" })) + "</div><div class=\"spk-row\">" + gl + "</div></div>";
    }

    function render() {
      if (!P) return;
      var h = '<div class="spk">' +
        '<div class="spk-lbl">' + esc(Lx({ en: "Your main sport", id: "Olahraga utamamu" })) + "</div>" +
        '<div class="spk-row">' + sportChips(0) + "</div>" + otherInput(0) +
        '<div class="spk-lbl">' + esc(Lx({ en: "Second sport", id: "Olahraga kedua" })) + " <small>(" + esc(Lx({ en: "optional", id: "opsional" })) + ")</small></div>" +
        '<div class="spk-row">' + sportChips(1) + "</div>" + otherInput(1);
      if (opts.detail) h += detailBlock(0) + detailBlock(1);
      h += '<div class="spk-note">' + esc(Lx({ en: "Max " + P.max + " sports. You can change this anytime — your history stays.", id: "Maksimal " + P.max + " olahraga. Bisa diubah kapan saja — riwayatmu tetap." })) + "</div>" +
        '<div class="spk-err" role="alert">' + esc(err) + "</div></div>";
      host.innerHTML = h;
    }

    host.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || !host.contains(b)) return;
      err = "";
      if (b.hasAttribute("data-slot")) return chooseSlot(+b.getAttribute("data-slot"), b.getAttribute("data-k"));
      var a = (b.getAttribute("data-day") || b.getAttribute("data-lv") || b.getAttribute("data-goal") || "").split(":");
      var s = slots[+a[0]]; if (!s) return;
      if (b.hasAttribute("data-day")) { var n = +a[1], at = s.play_days.indexOf(n); if (at >= 0) s.play_days.splice(at, 1); else s.play_days.push(n); s.play_days.sort(); }
      else if (b.hasAttribute("data-lv")) s.level = s.level === a[1] ? null : a[1];
      else if (b.hasAttribute("data-goal")) s.goal = s.goal === a[1] ? null : a[1];
      render();
    });
    host.addEventListener("input", function (e) {
      var i = e.target.getAttribute && e.target.getAttribute("data-other");
      if (i != null && slots[+i]) slots[+i].other_label = e.target.value;
    });
    // Nama "Lainnya" muncul di judul blok detail -> render ulang saat input selesai diketik.
    host.addEventListener("change", function (e) { if (e.target.getAttribute && e.target.getAttribute("data-other") != null && opts.detail) render(); });
    if (window.I18N && I18N.onChange) I18N.onChange(render);

    var api = {
      ready: packs().then(function (j) { P = j; render(); }),
      set: function (rows) {
        slots = [null, null];
        (rows || []).forEach(function (r) {
          var i = (+r.rank || 1) - 1; if (i < 0 || i > 1) return;
          slots[i] = { sport_key: r.sport_key, other_label: r.other_label || "", play_days: (r.play_days || []).map(Number), level: r.level || null, goal: r.goal || null };
          remember(slots[i]);
        });
        render();
      },
      value: function () { return slots.filter(Boolean).map(function (s) { return Object.assign({}, s); }); },
      validate: function () {
        var v = api.value(), m = null;
        if (!v.length) m = { en: "Choose your main sport.", id: "Pilih olahraga utamamu." };
        else if (v.length > (P ? P.max : 2)) m = { en: "Pick at most 2 sports.", id: "Maksimal 2 olahraga." };
        else if (v.some(function (s) { return packOf(s.sport_key).other && String(s.other_label || "").trim().length < 2; })) m = { en: "Type the name of your sport.", id: "Tulis nama olahragamu." };
        err = m ? Lx(m) : ""; render();
        return err || null;
      },
      save: async function (from) {
        if (api.validate()) { var ve = new Error(err); ve.status = 400; throw ve; }
        var tk = window.Auth ? await Auth.token() : "";
        var r = await fetch("/api/me/sports", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (tk || "") },
          body: JSON.stringify({ sports: api.value(), from: from || "profile" }) });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok) {
          err = j.error_i18n ? Lx(j.error_i18n) : (j.error || Lx({ en: "Couldn't save.", id: "Gagal menyimpan." })); render();
          var e = new Error(err); e.status = r.status; throw e;
        }
        api.set(j.sports || []);
        return j.sports || [];
      },
    };
    return api;
  }

  // Ambil pilihan user (untuk ringkasan di profil). Mengembalikan [] kalau belum ada.
  async function mine() {
    var tk = window.Auth ? await Auth.token() : "";
    var r = await fetch("/api/me/sports", { headers: { Authorization: "Bearer " + (tk || "") } });
    if (!r.ok) throw new Error("http " + r.status);
    return (await r.json()).sports || [];
  }
  // Label satu baris pilihan, mis. "Padel" atau "Lainnya: Tennis".
  async function label(row) {
    var j = await packs(), p = j.sports.filter(function (s) { return s.key === row.sport_key; })[0];
    if (!p) return row.sport_key;
    return p.other && row.other_label ? row.other_label : Lx(p.label);
  }
  window.SportPicker = { mount: mount, mine: mine, label: label, packs: packs, DAYS: DAYS };
})();
