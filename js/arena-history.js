/* arena-history.js — riwayat 20FIT Arena (booking kelas, paket sesi, booking venue) dari /api/arena/history.
 *
 * SATU SUMBER: daftar riwayat tampil di /profile (ArenaHistory.html); data & badge status juga dipakai
 * kartu "Booking Terdekat" di /activity (di balik flag SHOW_UPCOMING_BOOKINGS).
 * Butuh js/i18n.js (window.L, I18N) dan js/auth.js (Auth.token) lebih dulu.
 *
 * Pakai:  ArenaHistory.load().then(function (data) { box.innerHTML = ArenaHistory.html(data); });
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
  function lang() { return (window.I18N && I18N.lang === "en") ? "en" : "id"; }

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

  function rupiah(n) { return "Rp " + (+n || 0).toLocaleString("id-ID"); }
  function date(s) {
    if (!s) return "—";
    try {
      var d = new Date(String(s).length <= 10 ? s + "T00:00:00" : s);
      return d.toLocaleDateString(lang() === "id" ? "id-ID" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) { return s; }
  }
  function time(t) { return t ? String(t).slice(0, 5) : ""; }
  function badge(s) {
    var map = { confirmed: ["#2A7A4F", "rgba(42,122,79,.14)"], pending_payment: ["#C87000", "rgba(200,112,0,.14)"], cancelled: ["#C41101", "rgba(196,17,1,.12)"] };
    var c = map[s] || ["#9a907f", "rgba(154,144,127,.15)"];
    var lbl = { confirmed: L({ en: "Confirmed", id: "Terkonfirmasi" }), pending_payment: L({ en: "Pending", id: "Menunggu" }), cancelled: L({ en: "Cancelled", id: "Batal" }) }[s] || s || "—";
    return '<span style="font-size:11px;font-weight:800;padding:2px 8px;border-radius:20px;white-space:nowrap;color:' + c[0] + ';background:' + c[1] + '">' + esc(lbl) + '</span>';
  }

  // Isi kartu riwayat (tanpa judul section). data === undefined -> status memuat.
  function html(data) {
    var muted = function (t) { return '<div class="card"><div class="muted" style="font-size:13px">' + esc(t) + '</div></div>'; };
    if (data === undefined) return muted(L({ en: "Loading your 20FIT Arena history…", id: "Memuat riwayat 20FIT Arena kamu…" }));
    if (data.error) {
      return muted(data.error === "no_phone"
        ? L({ en: "Add your phone number in your profile to see your class, package & venue history.", id: "Isi nomor HP di profil untuk melihat riwayat kelas, paket & venue kamu." })
        : L({ en: "Couldn't load your 20FIT history right now.", id: "Belum bisa memuat riwayat 20FIT kamu sekarang." }));
    }
    var bk = data.bookings || [], pk = data.packages || [], vn = data.venue || [];
    if (!bk.length && !pk.length && !vn.length) {
      return muted(L({ en: "No 20FIT Arena activity yet. Book a class at booking.20fit.id and it will appear here.", id: "Belum ada aktivitas 20FIT Arena. Booking kelas di booking.20fit.id dan riwayatnya muncul di sini." }));
    }
    var row = 'display:flex;gap:11px;padding:10px 0;border-top:1px solid var(--line,#eee)';
    var out = "";
    if (bk.length) {
      out += '<div class="card"><div style="font-weight:800;margin-bottom:6px">' + esc(L({ en: "Class bookings", id: "Booking Kelas" })) + '</div>' +
        bk.map(function (b) {
          var sc = b.arena_class_schedules || {}, ct = sc.arena_class_types || {}, color = ct.color || "#C41101";
          return '<div style="' + row + '">' +
            '<span style="width:10px;height:10px;border-radius:3px;margin-top:5px;flex:0 0 auto;background:' + esc(color) + '"></span>' +
            '<div style="flex:1;min-width:0"><div style="font-weight:800;font-size:14px">' + esc(ct.name || L({ en: "Class", id: "Kelas" })) + '</div>' +
              '<div class="muted" style="font-size:12px">' + esc(date(sc.schedule_date)) + (sc.start_time ? ' · ' + esc(time(sc.start_time)) + (sc.end_time ? '–' + esc(time(sc.end_time)) : '') : '') + (sc.instructor ? ' · ' + esc(sc.instructor) : '') + '</div></div>' +
            '<div style="text-align:right;flex:0 0 auto">' + badge(b.status) + '<div class="muted" style="font-size:12px;margin-top:3px">' + esc(rupiah(b.price)) + '</div></div>' +
          '</div>';
        }).join("") + '</div>';
    }
    if (pk.length) {
      out += '<div class="card"><div style="font-weight:800;margin-bottom:6px">' + esc(L({ en: "Session packages", id: "Paket Sesi" })) + '</div>' +
        pk.map(function (p) {
          var v = (p.arena_package_vouchers || [])[0] || null, used = v ? v.used_sessions : 0, tot = v ? v.total_sessions : p.sessions;
          return '<div style="padding:10px 0;border-top:1px solid var(--line,#eee)">' +
            '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div style="font-weight:800;font-size:14px">' + esc(p.package_name || L({ en: "Package", id: "Paket" })) + '</div>' + badge(p.status) + '</div>' +
            '<div class="muted" style="font-size:12px;margin-top:2px">' + esc(rupiah(p.price)) + (v ? ' · ' + esc(L({ en: "used", id: "terpakai" })) + ' ' + used + '/' + tot + (v.is_active ? '' : ' · ' + esc(L({ en: "inactive", id: "nonaktif" }))) : '') + '</div>' +
          '</div>';
        }).join("") + '</div>';
    }
    if (vn.length) {
      out += '<div class="card"><div style="font-weight:800;margin-bottom:6px">' + esc(L({ en: "Venue bookings", id: "Booking Venue" })) + '</div>' +
        vn.map(function (b) {
          return '<div style="' + row + ';justify-content:space-between">' +
            '<div><div style="font-weight:800;font-size:14px">' + esc(date(b.booking_date)) + '</div>' +
              '<div class="muted" style="font-size:12px">' + esc(time(b.start_time)) + (b.end_time ? '–' + esc(time(b.end_time)) : '') + ' · ' + esc(b.customer_type === "corporation" ? L({ en: "Corporate", id: "Korporasi" }) : L({ en: "Individual", id: "Individu" })) + '</div></div>' +
            '<div style="text-align:right">' + badge(b.status) + '<div class="muted" style="font-size:12px;margin-top:3px">' + esc(rupiah(b.price)) + '</div></div>' +
          '</div>';
        }).join("") + '</div>';
    }
    return out;
  }

  window.ArenaHistory = { load: load, html: html, badge: badge, time: time };
})();
