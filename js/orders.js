// =============================================================
//  orders.js — Riwayat pembelian paket scan (commerce) di device.
//  Menyimpan setiap order paket scan beserta statusnya:
//    pending   = belum dibayar (menunggu pembayaran Xendit)
//    paid      = lunas
//    cancelled = dibatalkan user
//    expired   = kadaluarsa (invoice Xendit lewat waktu)
//  Dipakai calories.html (buat/poll order) & profile.html (riwayat).
//  Catatan: penyimpanan per-device (localStorage). Kredit scan sendiri
//  tetap ikut akun (my20fit_profile.scan_credits).
// =============================================================
(function () {
  var KEY = "my20fit_orders";
  var MAX_AGE = 30 * 60 * 1000; // 30 menit -> pending dianggap expired

  function read() { var a = []; try { a = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { a = []; } return Array.isArray(a) ? a : []; }
  function write(a) { try { localStorage.setItem(KEY, JSON.stringify(a || [])); } catch (e) {} }
  function now() { return Date.now(); }

  function normalize(o) {
    return {
      id: o.id, order_no: o.order_no || null, sales_order_id: o.sales_order_id || o.id || null,
      product_id: o.product_id || null, credits: +o.credits || 0, price: +o.price || 0,
      link: o.link || null, provider: o.provider || null, status: o.status || "pending", ts: o.ts || now(), paid_ts: o.paid_ts || null
    };
  }
  // Pindahkan data dari format lama (list/single pending order) ke store terpadu.
  function migrate() {
    var a = read(), changed = false;
    function ingest(o) { if (o && o.id && !a.some(function (x) { return String(x.id) === String(o.id); })) { a.push(normalize(o)); changed = true; } }
    try { var arr = JSON.parse(localStorage.getItem("my20fit_pending_orders") || "[]"); if (Array.isArray(arr)) arr.forEach(ingest); } catch (e) {}
    try { var one = JSON.parse(localStorage.getItem("my20fit_pending_order") || "null"); if (one) ingest(one); } catch (e) {}
    if (changed) write(a);
    try { localStorage.removeItem("my20fit_pending_orders"); localStorage.removeItem("my20fit_pending_order"); } catch (e) {}
  }
  // Tandai pending yang sudah lewat 30 menit sebagai expired.
  function prune(a) {
    var t = now(), ch = false;
    a.forEach(function (o) { if (o.status === "pending" && o.ts && (t - o.ts) > MAX_AGE) { o.status = "expired"; ch = true; } });
    if (ch) write(a);
    return a;
  }
  function all() { migrate(); var a = prune(read()); return a.slice().sort(function (x, y) { return (y.ts || 0) - (x.ts || 0); }); }
  function pending() { return all().filter(function (o) { return o.status === "pending"; }); }
  function get(id) { return read().find(function (o) { return String(o.id) === String(id); }) || null; }
  function add(o) { migrate(); var a = read(); if (!a.some(function (x) { return String(x.id) === String(o.id); })) { a.push(normalize(o)); write(a); } return o; }
  function setStatus(id, st, extra) {
    var a = read(), o = a.find(function (x) { return String(x.id) === String(id); });
    if (o) { o.status = st; if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); write(a); }
  }

  window.Orders = {
    all: all, list: all, pending: pending, get: get, add: add, setStatus: setStatus,
    markPaid: function (id) { setStatus(id, "paid", { paid_ts: now() }); },
    markExpired: function (id) { setStatus(id, "expired"); },
    markCancelled: function (id) { setStatus(id, "cancelled"); }
  };
})();
