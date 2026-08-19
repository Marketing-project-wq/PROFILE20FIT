/* ============================================================
   Ticket Wallet — KOMPONEN BERSAMA (widget dashboard + halaman /event).
   SATU sumber kebenaran, TIDAK ada copy-paste antar halaman.

   Sumber data:
     - GET /api/tickets/mine   → tiket yang DIBELI user (per email, dari event_transaction).
     - GET /api/events/upcoming→ katalog event on_sale (my20fit_ticket_events, publik).
   Waktu SELALU dirender Asia/Jakarta (WIB).

   Cara pakai (host tak terikat markup internal):
     TicketWallet.onRender(fn)          // daftarkan callback; dipanggil tiap state berubah
     TicketWallet.init({eagerUpcoming}) // muat data (tickets selalu; upcoming eager utk /event)
     host tempel: el.innerHTML = TicketWallet.renderInner({layout:"caro"|"grid"})
   Global onclick diekspos (tktSetTab / loadUpcoming / loadTickets / twkZoom / twkCaroScroll)
   supaya markup inline jalan di kedua halaman.

   Default tab BERDASARKAN kondisi user setelah data dimuat: punya tiket → "Tiket Saya",
   belum → "Mendatang". Berhenti auto-memilih begitu user menyentuh tab sendiri.
   ============================================================ */
(function () {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function Lx(o) { try { if (window.L) return window.L(o); } catch (e) {} return (o && (o.id || o.en)) || ""; }

  // ---- STATE ----
  var TICKETS = null;   // null=loading | [] kosong | [..] daftar
  var UPCOMING = null;  // null=loading | "error" gagal | [] sukses-kosong | [..] daftar
  var TAB = null;       // null=belum diputuskan | "mine" | "upcoming"
  var tabTouched = false;
  var cbs = [];

  function notify() { for (var i = 0; i < cbs.length; i++) { try { cbs[i](); } catch (e) {} } }
  function effTab() { return TAB || "mine"; }

  // ---- LOADERS ----
  window.loadUpcoming = async function loadUpcoming() {
    UPCOMING = null; notify(); // skeleton saat memuat / mencoba lagi
    try {
      var r = await fetch("/api/events/upcoming");
      var j = await r.json().catch(function () { return null; });
      UPCOMING = (r.ok && j && j.ok && Array.isArray(j.events)) ? j.events : "error"; // bedakan gagal vs kosong
    } catch (e) { UPCOMING = "error"; }
    notify();
  };
  window.loadTickets = async function loadTickets() {
    try {
      var t = (window.Auth && Auth.token) ? await Auth.token() : null;
      if (!t) { TICKETS = []; }
      else {
        var r = await fetch("/api/tickets/mine", { headers: { Authorization: "Bearer " + t } });
        var j = await r.json().catch(function () { return null; });
        TICKETS = (r.ok && j && j.ok && Array.isArray(j.tickets)) ? j.tickets : [];
      }
    } catch (e) { TICKETS = []; }
    // Tentukan tab default sekali, setelah tahu apakah user punya tiket.
    if (!tabTouched) {
      if (TICKETS && TICKETS.length) { TAB = "mine"; }
      else { TAB = "upcoming"; if (UPCOMING === null || UPCOMING === "error") window.loadUpcoming(); }
    }
    notify();
  };
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

  // ---- CARDS ----
  // Tiket DIBELI (Tiket Saya): pembelian nyata dari event_transaction (per email user).
  // QR gerbang TIDAK dikarang (aturan 2b): t.qr (dari penerbit) → tombol; kalau tidak → arah ke ticket.20fit.id.
  function twkTicketCard(t) {
    var nm = (t && t.event_name) || "Event 20FIT";
    var date = (t && t.paid_at) ? tktDate(t.paid_at) : "";
    var cover = (t && t.cover_url)
      ? '<div class="twk-pcover"><img src="' + esc(t.cover_url) + '" alt="' + esc(nm) + '" loading="lazy" onerror="this.closest(\'.twk-pcover\').classList.add(\'noimg\')"></div>'
      : '<div class="twk-pcover noimg"></div>';
    var meta = '<div class="twk-pmeta">' +
      ((t && t.product_name) ? '<span>' + esc(t.product_name) + '</span>' : '') +
      ((t && t.holder) ? '<span>' + Lx({ en: "Attendee: ", id: "Peserta: " }) + esc(t.holder) + '</span>' : '') +
      (date ? '<span>' + Lx({ en: "Paid ", id: "Dibayar " }) + esc(date) + '</span>' : '') +
      ((t && t.ref) ? '<span>' + Lx({ en: "Order ", id: "Order " }) + esc(t.ref) + '</span>' : '') +
      '</div>';
    var action = (t && t.qr)
      ? '<button type="button" class="twk-pbuy" style="background:var(--ink,#15171C)" onclick="twkZoom(\'' + esc(t.ref || "") + '\')">' + Lx({ en: "Show QR", id: "Tampilkan QR" }) + '</button>'
      : '<a class="twk-pbuy" style="background:var(--ink,#15171C)" href="https://ticket.20fit.id">' + Lx({ en: "Open e-ticket at ticket.20fit.id", id: "Buka e-tiket di ticket.20fit.id" }) + '</a>';
    return '<article class="twk-pcard">' + cover + '<div class="twk-pbody">' +
      '<div class="twk-pname">' + esc(nm) + '</div>' + meta +
      '<div style="margin-top:auto">' + action + '</div></div></article>';
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

  // ---- QR overlay ----
  window.twkZoom = function (ref) {
    var t = (TICKETS || []).filter(function (x) { return String(x.ref) === String(ref); })[0];
    if (!t || !t.qr) return;
    window.twkZoomClose();
    var ov = document.createElement("div"); ov.className = "twk-ov"; ov.id = "twkOv";
    ov.innerHTML = '<div class="twk-sheet"><button type="button" class="twk-close" onclick="twkZoomClose()" aria-label="Close">✕</button>' +
      '<h4>' + esc(t.event_name || "") + '</h4>' +
      '<small>' + esc([t.holder, (t.ticket_label || t.category)].filter(Boolean).join(" · ")) + '</small>' +
      '<div class="twk-qrbox">' + t.qr + '</div>' +
      (t.ref ? '<div class="twk-code">' + esc(t.ref) + '</div>' : '') +
      '<div class="twk-hint">' + Lx({ en: "Show this QR at the check-in gate.", id: "Tunjukkan QR ini di gerbang check-in." }) + '</div></div>';
    ov.addEventListener("click", function (e) { if (e.target === ov) window.twkZoomClose(); });
    document.body.appendChild(ov);
  };
  window.twkZoomClose = function () { var o = document.getElementById("twkOv"); if (o) o.remove(); };

  // ---- RENDER (tabs + body). Host membungkus dengan chrome-nya sendiri. ----
  function renderInner(opts) {
    opts = opts || {};
    var layout = opts.layout === "grid" ? "grid" : "caro";
    var tab = effTab();
    var tabs = '<div class="twk-tabs" role="tablist"><div class="twk-slider' + (tab === "upcoming" ? " right" : "") + '" aria-hidden="true"></div>' +
      '<button type="button" role="tab" class="twk-tab' + (tab === "mine" ? " on" : "") + '" onclick="tktSetTab(\'mine\')">' + Lx({ en: "My Ticket", id: "Tiket Saya" }) + ' <span class="twk-count">' + (TICKETS ? TICKETS.length : 0) + '</span></button>' +
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
      body = '<div class="twk-empty"><h4>' + Lx({ en: "No tickets yet", id: "Belum ada tiket" }) + '</h4><p>' + Lx({ en: "Tickets you buy will show here with a QR for check-in.", id: "Tiket yang kamu beli muncul di sini lengkap dengan QR untuk check-in." }) + '</p><button type="button" class="twk-ghost" onclick="tktSetTab(\'upcoming\')">' + Lx({ en: "See upcoming events", id: "Lihat event mendatang" }) + '</button></div>';
    } else {
      body = listWrap(TICKETS.map(twkTicketCard).join(""), TICKETS.length, layout);
    }
    return tabs + body;
  }

  // ---- API PUBLIK ----
  window.TicketWallet = {
    onRender: function (fn) { if (typeof fn === "function") cbs.push(fn); },
    renderInner: renderInner,
    init: function (opts) { opts = opts || {}; window.loadTickets(); if (opts.eagerUpcoming) window.loadUpcoming(); },
    counts: function () { return { tickets: (TICKETS ? TICKETS.length : 0), upcoming: (Array.isArray(UPCOMING) ? UPCOMING.length : 0) }; },
    tab: function () { return effTab(); }
  };
})();
