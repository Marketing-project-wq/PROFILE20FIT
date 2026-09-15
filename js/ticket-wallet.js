/* ============================================================
   Ticket Wallet — KOMPONEN BERSAMA (widget dashboard + halaman /event).
   SATU sumber kebenaran, TIDAK ada copy-paste antar halaman.

   Sumber data:
     - GET /api/tickets/mine   → tiket yang DIBELI user. Sumbernya ticket.20fit.id (embed);
       kalau kosong, jatuh ke arsip event_transaction (impor historis, tanpa QR gerbang).
       Saat daftarnya kosong, respons membawa `reason` — WAJIB dipakai untuk membedakan
       "memang belum beli" dari "gagal mengambil". Jangan samakan keduanya.
     - GET /api/events/upcoming→ katalog event on_sale (my20fit_ticket_events, publik).
   Waktu SELALU dirender Asia/Jakarta (WIB).

   Cara pakai (host tak terikat markup internal):
     TicketWallet.onRender(fn)          // daftarkan callback; dipanggil tiap state berubah
     TicketWallet.init()               // muat data (tiket + katalog event, dua-duanya)
     host tempel: el.innerHTML = TicketWallet.renderInner({layout:"caro"|"grid"})
   Global onclick diekspos (tktSetTab / loadUpcoming / loadTickets / twkCaroScroll /
   twkOpenEticket / twkCloseEticket / twkCopy / twkQrFull) supaya markup inline jalan.

   Default tab BERDASARKAN kondisi user setelah data dimuat: punya tiket → "Tiket Saya",
   belum → "Mendatang". Berhenti auto-memilih begitu user menyentuh tab sendiri.
   ============================================================ */
(function () {
  "use strict";

  // PENGAMAN UMUM anti-"[object Object]": kalau yang mau dirender ternyata objek/array,
  // ekstrak properti teks yang wajar; kalau tak ada, kosongkan — JANGAN pernah keluarkan
  // "[object Object]". Server sudah menyaring, ini lapisan kedua supaya aman di mana pun.
  function txt(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) { var s = txt(v[i]); if (s) return s; } return ""; }
    if (typeof v === "object") {
      var keys = ["name", "fullName", "full_name", "displayName", "title", "label", "en", "id", "text", "value"];
      for (var k = 0; k < keys.length; k++) { if (v[keys[k]] != null) return txt(v[keys[k]]); }
      return "";
    }
    return "";
  }
  function esc(s) { return txt(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function Lx(o) { try { if (window.L) return window.L(o); } catch (e) {} return (o && (o.id || o.en)) || ""; }

  // ---- STATE ----
  var TICKETS = null;   // null=loading | [] kosong | [..] daftar (flat, satu baris = satu tiket)
  var GROUPS = null;    // tiket dikelompokkan per event (1 kartu/event di daftar; buka → halaman E-Ticket)
  var SOURCE = null;    // "embed" (tiket asli+QR) | "archive" (arsip, tanpa QR) | "none"
  // REASON dipakai HANYA saat TICKETS kosong: membedakan "memang belum beli" (no_tickets)
  // dari "email belum dikenal penerbit" (no_account) dan "gagal ambil"
  // (upstream_unavailable / tickets_unreadable / server_error). TANPA OTP — reason hanya
  // memilih pesan yang tepat, tidak pernah memunculkan langkah verifikasi.
  var REASON = null;
  var UPCOMING = null;  // null=loading | "error" gagal | [] sukses-kosong | [..] daftar
  var TAB = null;       // null=belum diputuskan | "mine" | "upcoming"
  var tabTouched = false;
  var cbs = [];

  function notify() { for (var i = 0; i < cbs.length; i++) { try { cbs[i](); } catch (e) {} } }
  function effTab() { return TAB || "mine"; }

  // ---- LOADERS ----
  // Single-flight: init() memuat tiket & katalog BERSAMAAN, dan loadTickets juga
  // memanggil loadUpcoming kalau UPCOMING masih null. Tanpa penjaga ini keduanya
  // menembak /api/events/upcoming dua kali dan skeleton berkedip dua kali —
  // persis yang seharusnya dihindari. Penjaga ini juga menahan klik tab beruntun.
  var upcomingJalan = false;
  window.loadUpcoming = async function loadUpcoming() {
    if (upcomingJalan) return;
    upcomingJalan = true;
    UPCOMING = null; notify(); // skeleton saat memuat / mencoba lagi
    try {
      var r = await fetch("/api/events/upcoming");
      var j = await r.json().catch(function () { return null; });
      UPCOMING = (r.ok && j && j.ok && Array.isArray(j.events)) ? j.events : "error"; // bedakan gagal vs kosong
    } catch (e) { UPCOMING = "error"; }
    finally { upcomingJalan = false; }
    notify();
  };
  window.loadTickets = async function loadTickets() {
    try {
      var t = (window.Auth && Auth.token) ? await Auth.token() : null;
      if (!t) { TICKETS = []; }
      else {
        var r = await fetch("/api/tickets/mine", { headers: { Authorization: "Bearer " + t } });
        var j = await r.json().catch(function () { return null; });
        if (r.ok && j && j.ok && Array.isArray(j.tickets)) {
          TICKETS = j.tickets; REASON = j.reason || null; SOURCE = j.source || null;
          // QR (kalau penerbit mengirimnya) dirender jadi HTML sekali di sini supaya halaman
          // E-Ticket bisa menampilkannya langsung tanpa request tambahan. Payload string
          // perlu di-encode → async.
          try {
            await Promise.all(TICKETS.map(async function (t) { t._qrHtml = await twkQrHtml(t.qr); }));
          } catch (e) { /* satu gagal → tiketnya tetap ada, QR-nya menyusul */ }
          GROUPS = groupByEvent(TICKETS);
        } else { TICKETS = []; GROUPS = []; REASON = "upstream_unavailable"; }
      }
    } catch (e) { TICKETS = []; GROUPS = []; REASON = "upstream_unavailable"; }
    // Tentukan tab default sekali, setelah tahu apakah user punya tiket.
    // PUNYA tiket  -> "Tiket Saya". TIDAK punya -> "Mendatang" (apa pun sebabnya) supaya user
    // yang belum beli melihat event yang bisa dibeli, bukan halaman kosong. Sebab kegagalan
    // tidak hilang: tab "Tiket Saya" tetap memuat pesannya + tombol tabnya diberi tanda "!".
    if (!tabTouched) {
      if (TICKETS && TICKETS.length) { TAB = "mine"; }
      else { TAB = "upcoming"; if (UPCOMING === null || UPCOMING === "error") window.loadUpcoming(); }
    }
    notify();
  };
  // Kelompokkan tiket per event: satu order berisi banyak tiket → satu kartu event di daftar,
  // dan di halaman E-Ticket tampil sebagai "Ticket 1..N", masing-masing QR sendiri.
  function groupByEvent(tickets) {
    var map = {}, order = [];
    (tickets || []).forEach(function (t) {
      var key = String(t.event_slug || t.event_name || "Event 20FIT");
      if (!map[key]) { map[key] = { key: key, event_name: t.event_name || "Event 20FIT", cover_url: t.cover_url || null, event_date: t.event_date || t.paid_at || null, tickets: [], _st: {} }; order.push(key); }
      var g = map[key];
      if (!g.cover_url && t.cover_url) g.cover_url = t.cover_url;
      if (!g.event_date && (t.event_date || t.paid_at)) g.event_date = t.event_date || t.paid_at;
      g.tickets.push(t);
      var st = t.status || (t.paid ? "paid" : "valid");
      g._st[st] = (g._st[st] || 0) + 1;
    });
    return order.map(function (k) {
      var g = map[k]; var keys = Object.keys(g._st);
      g.status = (keys.length === 1) ? keys[0] : "mixed";  // event-level badge hanya kalau seragam
      delete g._st; return g;
    });
  }
  window.tktSetTab = function (tab) {
    tabTouched = true;
    TAB = (tab === "upcoming" ? "upcoming" : "mine");
    if (TAB === "upcoming" && (UPCOMING === null || UPCOMING === "error")) window.loadUpcoming();
    notify();
  };

  // ---- DATE (Asia/Jakarta / WIB) ----
  // Nilai date-only (≤10 char) dianggap tanggal kalender WIB; timestamptz penuh dikonversi via Intl.
  function tktDate(s) {
    if (!s) return "";
    var dateOnly = String(s).length <= 10;
    var d = new Date(dateOnly ? (s + "T00:00:00+07:00") : s);
    if (isNaN(d)) return String(s);
    var loc = Lx({ en: "en-GB", id: "id-ID" });
    try { return new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(d); }
    catch (e) {
      var mId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      return d.getDate() + " " + mId[d.getMonth()] + " " + d.getFullYear();
    }
  }
  function tktWhen(s) {
    if (!s) return "";
    if (String(s).length <= 10) return tktDate(s);
    var d = new Date(s); if (isNaN(d)) return String(s);
    var loc = Lx({ en: "en-GB", id: "id-ID" });
    try {
      var dp = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(d);
      var tp = new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" }).format(d);
      return dp + " · " + tp + " WIB";
    } catch (e) { return tktDate(s); }
  }

  // Tanggal singkat gaya acuan: "Fri, Sep 11" (WIB). Dipakai di daftar & halaman E-Ticket.
  function tktDayLabel(s) {
    if (!s) return "";
    var dateOnly = String(s).length <= 10;
    var d = new Date(dateOnly ? (s + "T00:00:00+07:00") : s);
    if (isNaN(d)) return String(s);
    var loc = Lx({ en: "en-US", id: "id-ID" });
    try { return new Intl.DateTimeFormat(loc, { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Jakarta" }).format(d); }
    catch (e) { return tktDate(s); }
  }
  // Ikon kalender kecil (inline SVG, ikut warna teks).
  function calIcon() { return '<svg class="etk-cal" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2.5" x2="8" y2="6"/><line x1="16" y1="2.5" x2="16" y2="6"/></svg>'; }
  // Badge status GERBANG (warna acuan): VALID hijau · USED/EXPIRED abu · CANCELLED merah.
  // PAID (arsip) biru — itu status BAYAR, bukan gerbang, jadi TIDAK hijau. "mixed"/kosong → null
  // (badge event-level disembunyikan; tiap tiket menampilkan status sendiri).
  function statusPill(st) {
    st = String(st || "").toLowerCase();
    if (st === "used") return { label: Lx({ en: "USED", id: "TERPAKAI" }), cls: "etk-b-grey" };
    if (st === "expired") return { label: Lx({ en: "EXPIRED", id: "KEDALUWARSA" }), cls: "etk-b-grey" };
    if (st === "cancelled") return { label: Lx({ en: "CANCELLED", id: "DIBATALKAN" }), cls: "etk-b-red" };
    if (st === "paid") return { label: Lx({ en: "PAID", id: "LUNAS" }), cls: "etk-b-blue" };
    if (st === "valid") return { label: "VALID", cls: "etk-b-green" };
    if (!st || st === "mixed") return null;
    return { label: st.toUpperCase(), cls: "etk-b-grey" };
  }
  function badgeHtml(st) { var p = statusPill(st); return p ? '<span class="etk-badge ' + p.cls + '">' + esc(p.label) + '</span>' : ''; }

  // ---- CARDS ----
  // Daftar "Tiket Saya": SATU kartu per EVENT (bukan per tiket). Badge "N tiket" kalau >1.
  // Ditekan → buka halaman E-Ticket (semua tiket event itu; tiap tiket QR sendiri).
  // idx = indeks di GROUPS (dilewatkan sebagai angka → aman dari injeksi nama event).
  function twkGroupCard(g, idx) {
    var nm = g.event_name || "Event 20FIT";
    var when = g.event_date ? tktDayLabel(g.event_date) : Lx({ en: "Date TBA", id: "Jadwal menyusul" });
    var n = g.tickets.length;
    var cover = g.cover_url
      ? '<div class="twk-pcover"><img src="' + esc(g.cover_url) + '" alt="' + esc(nm) + '" loading="lazy" onerror="this.closest(\'.twk-pcover\').classList.add(\'noimg\')"></div>'
      : '<div class="twk-pcover noimg"></div>';
    var topline = '<div class="twk-topline">' + badgeHtml(g.status) +
      (n > 1 ? '<span class="twk-nbadge">' + n + ' ' + Lx({ en: "tickets", id: "tiket" }) + '</span>' : '') + '</div>';
    var meta = '<div class="twk-pmeta"><span class="etk-daterow">' + calIcon() + '<span>' + esc(when) + '</span></span></div>';
    return '<article class="twk-pcard twk-tap" role="button" tabindex="0" aria-label="' + esc(nm) + '"' +
      ' onclick="twkOpenEticket(' + idx + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();twkOpenEticket(' + idx + ')}">' +
      cover + '<div class="twk-pbody">' + topline +
      '<div class="twk-pname">' + esc(nm) + '</div>' + meta +
      '<div class="twk-open">' + Lx({ en: "View e-ticket", id: "Lihat e-tiket" }) + ' <span aria-hidden="true">→</span></div>' +
      '</div></article>';
  }
  // Nominal "Rp X" dari price_from (integer rupiah). null → "".
  function twkAmount(e) {
    if (!e || e.price_from == null) return "";
    var cur = (e.currency || "IDR");
    var n = Number(e.price_from) || 0;
    return (cur === "IDR" ? ("Rp " + n.toLocaleString("id-ID")) : (cur + " " + n.toLocaleString()));
  }
  // Event bisa-dibeli (Mendatang): katalog admin (my20fit_ticket_events). Beli → buy_url (server, +UTM).
  function twkEventCard(e) {
    var nm = (e && e.name) || "Event 20FIT";
    var when = (e && e.starts_at) ? tktWhen(e.starts_at) : Lx({ en: "Date TBA", id: "Jadwal menyusul" });
    var place = [(e && e.venue) || "", (e && e.city) || ""].filter(Boolean).join(", ");
    var org = (e && e.organizer) || "";
    var cover = (e && e.cover_url)
      ? '<div class="twk-pcover"><img src="' + esc(e.cover_url) + '" alt="' + esc(nm) + '" loading="lazy" onerror="this.closest(\'.twk-pcover\').classList.add(\'noimg\')">' + ((e && e.category) ? '<span class="twk-pcat">' + esc(e.category) + '</span>' : '') + '</div>'
      : '<div class="twk-pcover noimg">' + ((e && e.category) ? '<span class="twk-pcat">' + esc(e.category) + '</span>' : '') + '</div>';
    var meta = '<div class="twk-pmeta">' +
      '<span>' + esc(when) + '</span>' +
      (place ? '<span>' + esc(place) + '</span>' : '') +
      (org ? '<span>' + esc(org) + '</span>' : '') + '</div>';
    var sub = (e && e.subtitle) ? ('<div class="twk-pmeta" style="margin-top:2px"><span>' + esc(e.subtitle) + '</span></div>') : "";
    var amt = twkAmount(e);
    var price = amt ? ('<div class="twk-pprice"><small>' + Lx({ en: "From", id: "Mulai" }) + '</small><b>' + esc(amt) + '</b></div>') : '';
    var buyBtn = (e && e.buy_url)
      ? '<a class="twk-pbuy" href="' + esc(e.buy_url) + '">' + Lx({ en: "Buy", id: "Beli" }) + ' <span aria-hidden="true">↗</span></a>'
      : '';
    return '<article class="twk-pcard">' + cover + '<div class="twk-pbody">' +
      '<div class="twk-pname">' + esc(nm) + '</div>' + sub + meta + price + buyBtn +
      '</div></article>';
  }

  // ---- LIST WRAPPERS ----
  function twkCaro(cardsHtml, count) {
    var arrows = (count > 1)
      ? '<div class="twk-arrows show"><button type="button" class="twk-arrow" aria-label="Previous" onclick="twkCaroScroll(this,-1)"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>' +
        '<button type="button" class="twk-arrow" aria-label="Next" onclick="twkCaroScroll(this,1)"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button></div>'
      : '';
    return '<div class="twk-caro-wrap"><div class="twk-caro" tabindex="0">' + cardsHtml + '</div>' + arrows + '</div>';
  }
  function listWrap(cardsHtml, count, layout) {
    return layout === "grid" ? '<div class="twk-grid">' + cardsHtml + '</div>' : twkCaro(cardsHtml, count);
  }
  window.twkCaroScroll = function (btn, dir) {
    var wrap = btn.closest(".twk-caro-wrap"); if (!wrap) return;
    var caro = wrap.querySelector(".twk-caro"); if (!caro) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    caro.scrollBy({ left: dir * Math.round(caro.clientWidth * 0.85), behavior: reduce ? "auto" : "smooth" });
  };

  // ---- QR lib (lazy; hanya dipakai kalau embed mengirim payload string, bukan gambar) ----
  var _qrP = null;
  function twkQrLib() {
    if (window.qrcode) return Promise.resolve(true);
    if (_qrP) return _qrP;
    _qrP = new Promise(function (res) { var s = document.createElement("script"); s.src = "js/qrcode-generator.js"; s.async = true; s.onload = function () { res(!!window.qrcode); }; s.onerror = function () { res(false); }; document.head.appendChild(s); });
    return _qrP;
  }
  async function twkEncodeQr(text) {
    var ok = await twkQrLib(); if (!ok || !window.qrcode) return "";
    try { var q = window.qrcode(0, "M"); q.addData(String(text)); q.make(); return q.createSvgTag({ cellSize: 5, margin: 1, scalable: true }); } catch (e) { return ""; }
  }
  // Ubah QR dari penerbit ({img|svg|payload}) jadi HTML. SATU sumber kebenaran, dipakai
  // kartu tiket (QR sudah ikut di /api/tickets/mine) maupun twkFetchQr (jalur satuan).
  async function twkQrHtml(q) {
    if (!q || !q.ok) return "";
    if (q.img) return '<img src="' + esc(q.img) + '" alt="QR" style="width:100%;height:100%;display:block;image-rendering:pixelated">';
    if (q.svg) return q.svg;
    if (q.payload) { var svg = await twkEncodeQr(q.payload); return svg || ('<div class="twk-code">' + esc(q.payload) + '</div>'); }
    return "";
  }
  // Ambil QR e-tiket ASLI by code dari server (/api/tickets/qr → embed ticket.20fit.id).
  // Cadangan: normalnya QR sudah ikut di /api/tickets/mine, jadi ini hanya dipakai kalau
  // tiket itu belum membawa QR (mis. pengambilan borongannya gagal untuk satu tiket).
  async function twkFetchQr(code) {
    if (!code) return "";
    var tok = (window.Auth && Auth.token) ? await Auth.token() : null;
    if (!tok) return "";
    var r = await fetch("/api/tickets/qr?code=" + encodeURIComponent(code), { headers: { Authorization: "Bearer " + tok } });
    var j = await r.json().catch(function () { return null; });
    return await twkQrHtml(j);
  }

  // ---- Halaman E-Ticket (layar penuh) — dibuka saat user menekan kartu event ----
  // Tata letak mengikuti e-ticket ticket.20fit.id: Kartu 1 = info event (cover + nama +
  // badge status + tanggal "Fri, Sep 11" WIB). Kartu 2..N = SATU per tiket (label "Ticket N",
  // QR besar di kotak putih, kode tiket monospace + salin, baris Holder & jenis tiket).
  // TANPA OTP: hanya menampilkan data yang SUDAH ada dari /api/tickets/mine.
  var _wake = null;
  async function etkWake() { try { if (navigator.wakeLock && !_wake) _wake = await navigator.wakeLock.request("screen"); } catch (e) {} }
  function etkWakeRelease() { try { if (_wake) { _wake.release(); _wake = null; } } catch (e) {} }
  // Catatan: web TAK PUNYA API standar untuk menaikkan kecerahan layar secara paksa.
  // Wake Lock mencegah layar meredup/terkunci saat QR tampil — sedekat mungkin ke tujuan itu.
  function backIcon() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>'; }
  function copyIcon() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>'; }
  function checkIcon() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>'; }
  function etkRow(k, v) { return '<div class="etk-row"><span class="etk-k">' + esc(k) + '</span><span class="etk-v">' + esc(v) + '</span></div>'; }
  function etkTicketCard(t, i, g) {
    var label = Lx({ en: "Ticket ", id: "Tiket " }) + (i + 1);
    var tst = t.status || (t.paid ? "paid" : "valid");
    // Status per-tiket ditampilkan bila event campur-status ATAU tiket ini bukan "valid"
    // (jujur soal used/expired/cancelled — tiket dipakai TAK BOLEH terbaca seolah valid).
    var showBadge = (g && g.status === "mixed") || (tst !== "valid");
    var head = '<div class="etk-tlabel">' + esc(label) + (showBadge ? badgeHtml(tst) : '') + '</div>';
    // QR: kalau ada dari penerbit → tampil di kotak putih; tap → layar penuh utk scan.
    // Kalau belum ada (mis. arsip) → keadaan rapi, arahkan ke penerbit. TIDAK dikarang.
    var qr = t._qrHtml
      ? '<div class="etk-qr" role="img" aria-label="' + esc(Lx({ en: "Ticket QR", id: "QR tiket" })) + '"' + ((t.code || t.ref) ? ' onclick="twkQrFull(\'' + esc(String(t.code || t.ref)) + '\')" title="' + esc(Lx({ en: "Tap to enlarge", id: "Ketuk untuk perbesar" })) + '"' : '') + '>' + t._qrHtml + '</div>'
      : '<div class="etk-qr etk-qr-none"><div class="etk-qrmsg">' + Lx({ en: "QR available at ticket.20fit.id", id: "QR tersedia di ticket.20fit.id" }) + '</div><a class="etk-linkbtn" href="https://ticket.20fit.id"><span aria-hidden="true">→</span> ticket.20fit.id</a></div>';
    var code = (t.code || t.ref)
      ? '<div class="etk-coderow"><span class="etk-code" id="etkc' + i + '">' + esc(String(t.code || t.ref)) + '</span>' +
        '<button type="button" class="etk-copy" aria-label="' + esc(Lx({ en: "Copy code", id: "Salin kode" })) + '" onclick="twkCopy(\'etkc' + i + '\',this)">' + copyIcon() + '</button></div>'
      : '';
    var rows = '';
    if (t.holder) rows += etkRow(Lx({ en: "Holder", id: "Pemegang" }), t.holder);
    if (t.product_name) rows += etkRow(Lx({ en: "Ticket type", id: "Jenis tiket" }), t.product_name);
    return '<section class="etk-card etk-tcard">' + head + qr + code +
      (rows ? '<div class="etk-rows">' + rows + '</div>' : '') + '</section>';
  }
  window.twkOpenEticket = function (idx) {
    var g = (GROUPS || [])[idx]; if (!g) return;
    window.twkCloseEticket();
    var when = g.event_date ? tktDayLabel(g.event_date) : Lx({ en: "Date TBA", id: "Jadwal menyusul" });
    var cover = g.cover_url
      ? '<div class="etk-cover"><img src="' + esc(g.cover_url) + '" alt="' + esc(g.event_name) + '" onerror="this.closest(\'.etk-cover\').classList.add(\'noimg\')"></div>'
      : '<div class="etk-cover noimg"></div>';
    var ev = '<section class="etk-card etk-evcard">' + cover +
      '<div class="etk-evbody"><div class="etk-evtop"><h2 class="etk-evname">' + esc(g.event_name) + '</h2>' + badgeHtml(g.status) + '</div>' +
      '<div class="etk-daterow">' + calIcon() + '<span>' + esc(when) + '</span></div></div></section>';
    var cards = g.tickets.map(function (t, i) { return etkTicketCard(t, i, g); }).join("");
    var ov = document.createElement("div"); ov.className = "etk-ov"; ov.id = "etkOv";
    ov.innerHTML = '<div class="etk-head"><button type="button" class="etk-back" aria-label="' + esc(Lx({ en: "Back", id: "Kembali" })) + '" onclick="twkCloseEticket()">' + backIcon() + '</button><h1 class="etk-title">E-Ticket</h1></div>' +
      '<div class="etk-wrap">' + ev + cards + '</div>';
    document.body.appendChild(ov);
    document.documentElement.classList.add("etk-lock");
    etkWake();
    ov._esc = function (e) { if (e.key === "Escape") window.twkCloseEticket(); };
    document.addEventListener("keydown", ov._esc);
  };
  window.twkCloseEticket = function () {
    var o = document.getElementById("etkOv");
    if (o) { if (o._esc) document.removeEventListener("keydown", o._esc); o.remove(); }
    document.documentElement.classList.remove("etk-lock");
    var f = document.getElementById("etkQrFull"); if (f) f.remove();
    etkWakeRelease();
  };
  // Salin kode tiket + umpan balik singkat (ikon centang 1,4 detik).
  window.twkCopy = function (id, btn) {
    var el = document.getElementById(id); if (!el) return;
    var text = el.textContent || "";
    var done = function () { if (!btn) return; var t0 = btn.innerHTML; btn.classList.add("ok"); btn.innerHTML = checkIcon(); setTimeout(function () { btn.classList.remove("ok"); btn.innerHTML = t0; }, 1400); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, function () { etkCopyFallback(text); done(); }); return; } } catch (e) {}
    etkCopyFallback(text); done();
  };
  function etkCopyFallback(text) { try { var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); } catch (e) {} }
  // QR layar penuh (tap QR di kartu tiket) — untuk scan mudah di gerbang.
  window.twkQrFull = async function (code) {
    var t = (TICKETS || []).filter(function (x) { return String(x.code) === String(code) || String(x.ref) === String(code); })[0];
    var html = t ? (t._qrHtml || (await twkFetchQr(t.code || t.ref))) : "";
    if (!html) return;
    var f = document.getElementById("etkQrFull"); if (f) f.remove();
    var ov = document.createElement("div"); ov.className = "etk-qrfull"; ov.id = "etkQrFull";
    ov.innerHTML = '<div class="etk-qrfull-box">' + html + '</div>';
    ov.addEventListener("click", function () { ov.remove(); });
    document.body.appendChild(ov);
    etkWake();
  };

  // ---- RENDER (tabs + body). Host membungkus dengan chrome-nya sendiri. ----
  // Kosong ≠ selalu "belum beli". TANPA OTP: kegagalan pengambilan tetap dibedakan dari
  // "memang belum beli", tapi TIDAK PERNAH memunculkan langkah verifikasi.
  function emptyMineHtml() {
    if (REASON && REASON !== "no_tickets" && REASON !== "no_account") {
      return '<div class="twk-empty"><h4>' + Lx({ en: "Couldn't load your tickets", id: "Gagal memuat tiketmu" }) + '</h4><p>'
        + Lx({ en: "This is a problem on our side, not an empty wallet. Please try again.",
               id: "Ini kendala di sisi kami, bukan berarti kamu belum punya tiket. Coba lagi ya." })
        + '</p><button type="button" class="twk-ghost" onclick="loadTickets()">' + Lx({ en: "Try again", id: "Coba lagi" }) + '</button></div>';
    }
    return '<div class="twk-empty"><h4>' + Lx({ en: "No tickets yet", id: "Belum ada tiket" }) + '</h4><p>'
      + Lx({ en: "Tickets you buy will show here with a QR for check-in.", id: "Tiket yang kamu beli muncul di sini lengkap dengan QR untuk check-in." })
      + '</p><button type="button" class="twk-ghost" onclick="tktSetTab(\'upcoming\')">' + Lx({ en: "See upcoming events", id: "Lihat event mendatang" }) + '</button></div>';
  }

  function renderInner(opts) {
    opts = opts || {};
    var layout = opts.layout === "grid" ? "grid" : "caro";
    var tab = effTab();
    // Badge tab "Tiket Saya": jumlah tiket. Kalau pengambilannya GAGAL (perlu verifikasi /
    // upstream mati), angka 0 menyesatkan — terbaca "kamu tidak punya tiket". Tampilkan "!"
    // supaya kegagalan tetap terlihat walau tab defaultnya sekarang "Mendatang".
    var mineGagal = !!(TICKETS && !TICKETS.length && REASON && REASON !== "no_tickets");
    var mineBadge = mineGagal ? "!" : (TICKETS ? TICKETS.length : 0);
    var tabs = '<div class="twk-tabs" role="tablist"><div class="twk-slider' + (tab === "upcoming" ? " right" : "") + '" aria-hidden="true"></div>' +
      '<button type="button" role="tab" class="twk-tab' + (tab === "mine" ? " on" : "") + '" onclick="tktSetTab(\'mine\')"' + (mineGagal ? ' title="' + Lx({ en: "Couldn’t load your tickets", id: "Tiketmu gagal dimuat" }) + '"' : '') + '>' + Lx({ en: "My Ticket", id: "Tiket Saya" }) + ' <span class="twk-count">' + mineBadge + '</span></button>' +
      '<button type="button" role="tab" class="twk-tab' + (tab === "upcoming" ? " on" : "") + '" onclick="tktSetTab(\'upcoming\')">' + Lx({ en: "Upcoming", id: "Mendatang" }) + ' <span class="twk-count">' + (Array.isArray(UPCOMING) ? UPCOMING.length : 0) + '</span></button></div>';
    var body;
    if (tab === "upcoming") {
      if (UPCOMING === null) body = '<div class="twk-list"><div class="tkskel" style="height:96px;border-radius:14px"></div></div>';
      else if (UPCOMING === "error") body = '<div class="twk-empty"><h4>' + Lx({ en: "Couldn’t load events", id: "Gagal memuat event" }) + '</h4><p>' + Lx({ en: "Something went wrong. Please try again.", id: "Ada kendala memuat. Coba lagi ya." }) + '</p><button type="button" class="twk-ghost" onclick="loadUpcoming()">' + Lx({ en: "Try again", id: "Coba lagi" }) + '</button></div>';
      else if (!UPCOMING.length) body = '<div class="twk-empty"><h4>' + Lx({ en: "No open events", id: "Belum ada event" }) + '</h4><p>' + Lx({ en: "New events appear here. Explore the full catalog at 20FIT Ticket.", id: "Event baru akan muncul di sini. Lihat katalog lengkap di 20FIT Ticket." }) + '</p><a class="twk-ghost" href="https://ticket.20fit.id/id/events">' + Lx({ en: "Explore events", id: "Jelajahi event" }) + ' ↗</a></div>';
      else body = listWrap(UPCOMING.map(twkEventCard).join(""), UPCOMING.length, layout);
    } else if (TICKETS === null) {
      body = '<div class="twk-list"><div class="tkskel" style="height:120px;border-radius:14px"></div></div>';
    } else if (!TICKETS.length) {
      body = emptyMineHtml();
    } else {
      // SATU kartu per event (grup). Ditekan → halaman E-Ticket (semua tiket event itu).
      var groups = GROUPS || groupByEvent(TICKETS);
      body = listWrap(groups.map(function (g, i) { return twkGroupCard(g, i); }).join(""), groups.length, layout);
    }
    return tabs + body;
  }

  // ---- API PUBLIK ----
  window.TicketWallet = {
    onRender: function (fn) { if (typeof fn === "function") cbs.push(fn); },
    renderInner: renderInner,
    // Keduanya dimuat di awal: "Mendatang" kini tab default untuk user yang belum punya
    // tiket, jadi datanya harus sudah jalan bersamaan — bukan baru ditarik setelah tiket
    // selesai (itu membuat skeleton muncul dua kali).
    init: function () { window.loadTickets(); window.loadUpcoming(); },
    counts: function () { return { tickets: (TICKETS ? TICKETS.length : 0), upcoming: (Array.isArray(UPCOMING) ? UPCOMING.length : 0) }; },
    tab: function () { return effTab(); }
  };
})();
