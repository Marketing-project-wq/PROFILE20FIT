/* arena-history.js — data riwayat 20FIT Arena (booking kelas, paket sesi, booking venue) dari /api/arena/history.
 *
 * SATU SUMBER data: dipakai "Riwayat & Transaksi" di /profile (digabung dengan pembelian scan kalori, render
 * di profile.html) dan kartu "Booking Terdekat" di /activity (di balik flag SHOW_UPCOMING_BOOKINGS).
 * Butuh js/i18n.js (window.L) dan js/auth.js (Auth.token) lebih dulu.
 *
 * Pakai:  ArenaHistory.load().then(function (data) { ... });
 *         data = { bookings, packages, venue } | { error: "no_phone" | "unauth" | "failed" | ... }
 */
(function () {
  "use strict";

  function L(o) { return window.L ? window.L(o) : (o && (o.id || o.en)) || ""; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Sekali per halaman — semua pemakai di halaman yang sama berbagi satu request.
  var _p = null;
  function load() {
    if (!_p) {
      _p = (async function () {
        try {
          var tk = await Auth.token();
          if (!tk) return { error: "unauth" };
          var r = await fetch("/api/arena/history", { headers: { Authorization: "Bearer " + tk } });
          var j = await r.json().catch(function () { return {}; });
          return r.ok ? j : { error: j.error || "failed" };
        } catch (e) { return { error: "failed" }; }
      })();
    }
    return _p;
  }

  function time(t) { return t ? String(t).slice(0, 5) : ""; }
  function badge(s) {
    var map = { confirmed: ["#2A7A4F", "rgba(42,122,79,.14)"], pending_payment: ["#C87000", "rgba(200,112,0,.14)"], cancelled: ["#C41101", "rgba(196,17,1,.12)"] };
    var c = map[s] || ["#9a907f", "rgba(154,144,127,.15)"];
    var lbl = { confirmed: L({ en: "Confirmed", id: "Terkonfirmasi" }), pending_payment: L({ en: "Pending", id: "Menunggu" }), cancelled: L({ en: "Cancelled", id: "Batal" }) }[s] || s || "—";
    return '<span style="font-size:11px;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;color:' + c[0] + ';background:' + c[1] + '">' + esc(lbl) + '</span>';
  }

  window.ArenaHistory = { load: load, badge: badge, time: time };
})();
