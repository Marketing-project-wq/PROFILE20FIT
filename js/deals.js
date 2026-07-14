// =============================================================
//  deals.js — Modul bersama "Top up scan" (paket kredit scan + checkout SingaPay).
//  Dipakai calories.html & profile.html supaya UI + logika beli SAMA (satu sumber).
//  Butuh: js/auth.js (Auth), js/orders.js (Orders). Meta (Pixel) opsional.
//  Server otoritatif: kredit ditambah lewat webhook SingaPay -> jangan dobel di client.
//  API: window.Deals.open({ onCredited })  |  window.Deals.close()
// =============================================================
(function () {
  // Paket top-up. product_id dari 20FIT (Third party > Retail > shop/order).
  var SCAN_PACKS = [
    { credits: 10, price: 25000, product_id: 8477, best: false },
    { credits: 50, price: 75000, product_id: 8478, best: true },
    { credits: 150, price: 150000, product_id: 8479, best: false },
  ];
  function L(o) { return (window.L ? window.L(o) : (o && o.en)) || ""; }
  function rupiah(n) { return "Rp " + (Number(n) || 0).toLocaleString("id-ID"); }
  function metaTrack(ev, p) { try { if (window.Meta) Meta.track(ev, p); } catch (e) {} }

  var CURRENT_VOUCHER = null;
  var _onCredited = null;
  var _pollTimer = null, _payChecking = false, _payDismissed = false;

  // ---------- Inject style + markup sekali ----------
  function injectOnce() {
    if (document.getElementById("dealsRoot")) return;
    var css = document.createElement("style");
    css.textContent = [
      ".dl-bg{position:fixed;inset:0;z-index:9000;background:rgba(10,12,16,.55);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:none;align-items:flex-end;justify-content:center}",
      ".dl-bg.open{display:flex}",
      ".dl-card{width:100%;max-width:460px;background:var(--card,#fff);color:var(--txt,#16181d);border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;padding:8px 22px calc(env(safe-area-inset-bottom) + 26px);box-shadow:0 -12px 44px rgba(0,0,0,.28);animation:dlUp .3s cubic-bezier(.2,.85,.25,1)}",
      "@keyframes dlUp{from{transform:translateY(100%)}to{transform:translateY(0)}}",
      ".dl-grab{width:42px;height:5px;border-radius:999px;background:var(--line,#e6e3dd);margin:9px auto 16px}",
      ".dl-ic{width:56px;height:56px;border-radius:17px;background:var(--red-soft,#fdecec);display:grid;place-items:center;margin:0 auto 12px}",
      ".dl-ic svg{width:28px;height:28px;fill:none;stroke:var(--red,#C41101);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
      ".dl-card h3{margin:0 0 4px;text-align:center;font-size:20px;font-weight:800}",
      ".dl-sub{text-align:center;color:var(--muted,#8a8378);font-size:13.5px;line-height:1.5;margin:0 auto 16px;max-width:360px}",
      ".dl-deal{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1.5px solid var(--line,#e6e3dd);background:var(--card,#fff);border-radius:16px;padding:15px;margin-top:11px;cursor:pointer;transition:.15s;color:var(--txt,#16181d);position:relative}",
      ".dl-deal:hover{border-color:var(--red,#C41101);transform:translateY(-1px)}",
      ".dl-deal:disabled{opacity:.55;cursor:default}",
      ".dl-deal.best{border-color:var(--red,#C41101);box-shadow:0 8px 22px rgba(196,17,1,.14)}",
      ".dl-qty{width:56px;height:56px;flex:0 0 auto;border-radius:14px;background:var(--red,#C41101);color:#fff;display:grid;place-items:center;font-size:20px;font-weight:900;line-height:1}",
      ".dl-qty small{display:block;font-size:9px;letter-spacing:1px;font-weight:800;opacity:.9;margin-top:2px}",
      ".dl-info{flex:1}.dl-info .p{font-size:18px;font-weight:900}.dl-info .d{font-size:12.5px;color:var(--muted,#8a8378);margin-top:2px}",
      ".dl-tag{position:absolute;top:-9px;right:14px;background:var(--red,#C41101);color:#fff;font-size:10px;font-weight:800;letter-spacing:.5px;padding:3px 9px;border-radius:999px}",
      ".dl-vrow{display:flex;gap:8px;align-items:center;margin:16px 0 4px}",
      ".dl-vrow input{flex:1;text-transform:uppercase;padding:12px 13px;border:1.5px solid var(--line,#e6e3dd);border-radius:12px;font-size:14px;background:var(--inp,#f6f4f0);color:var(--txt,#16181d)}",
      ".dl-vapply{margin:0;width:auto;padding:12px 18px;border:0;border-radius:12px;background:var(--inp,#efece6);color:var(--txt,#16181d);font-weight:750;font-size:14px;cursor:pointer}",
      ".dl-vmsg{font-size:12px;min-height:16px;margin-bottom:6px;font-weight:600}",
      ".dl-note{text-align:center;color:var(--muted,#8a8378);font-size:12px;margin-top:14px;line-height:1.5}",
      ".dl-ghost{width:100%;margin-top:12px;border:0;border-radius:13px;background:var(--inp,#efece6);color:var(--txt,#16181d);font-weight:750;font-size:14.5px;padding:13px;cursor:pointer}",
      ".dl-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 16px);z-index:9100;background:var(--card,#fff);color:var(--txt,#16181d);border:1px solid var(--line,#e6e3dd);border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.22);padding:13px 15px;max-width:380px;width:calc(100% - 32px);display:none;gap:10px;align-items:center}",
      ".dl-toast.show{display:flex}",
      ".dl-toast .sp{width:18px;height:18px;flex:0 0 auto;border:2.5px solid var(--line,#e6e3dd);border-top-color:var(--red,#C41101);border-radius:50%;animation:dlSpin 1s linear infinite}",
      "@keyframes dlSpin{to{transform:rotate(360deg)}}",
      ".dl-toast .tmsg{flex:1;font-size:12.5px;line-height:1.4}.dl-toast .tord{font-size:11px;color:var(--muted,#8a8378)}",
      ".dl-toast button{border:0;background:var(--red,#C41101);color:#fff;font-weight:700;font-size:12px;border-radius:9px;padding:8px 11px;cursor:pointer}",
      ".dl-toast .tx{background:transparent;color:var(--muted,#8a8378);padding:6px}",
      ".dl-thx{text-align:center}.dl-thx .em{font-size:44px;margin:6px 0 4px}",
      "@media(min-width:620px){ .dl-bg{align-items:center;padding:24px} .dl-card{border-radius:24px} .dl-grab{display:none} }",
    ].join("");
    document.head.appendChild(css);

    var root = document.createElement("div");
    root.id = "dealsRoot";
    root.innerHTML =
      '<div class="dl-bg" id="dlBg"><div class="dl-card">' +
      '<div class="dl-grab"></div>' +
      '<div class="dl-ic"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>' +
      '<h3 id="dlTitle"></h3><div class="dl-sub" id="dlSub"></div>' +
      '<div id="dlList"></div>' +
      '<div class="dl-vrow"><input id="dlVoucher" autocomplete="off" /><button class="dl-vapply" id="dlVApply"></button></div>' +
      '<div class="dl-vmsg" id="dlVMsg"></div>' +
      '<div class="dl-note" id="dlNote"></div>' +
      '<button class="dl-ghost" id="dlClose"></button>' +
      '</div></div>' +
      '<div class="dl-toast" id="dlToast"><div class="sp"></div><div class="tmsg"><div id="dlToastMsg"></div><div class="tord" id="dlToastOrd"></div></div>' +
      '<button id="dlToastBtn"></button><button class="tx" id="dlToastClose">✕</button></div>' +
      '<div class="dl-bg" id="dlThxBg"><div class="dl-card dl-thx">' +
      '<div class="dl-grab"></div><div class="em">🎉</div><h3 id="dlThxTitle"></h3><div class="dl-sub" id="dlThxSub"></div>' +
      '<button class="dl-ghost" id="dlThxClose" style="background:var(--red,#C41101);color:#fff"></button>' +
      '</div></div>';
    document.body.appendChild(root);

    document.getElementById("dlClose").addEventListener("click", closeDeals);
    document.getElementById("dlBg").addEventListener("click", function (e) { if (e.target.id === "dlBg") closeDeals(); });
    document.getElementById("dlVApply").addEventListener("click", applyVoucher);
    document.getElementById("dlThxClose").addEventListener("click", closeThanks);
    document.getElementById("dlThxBg").addEventListener("click", function (e) { if (e.target.id === "dlThxBg") closeThanks(); });
    document.getElementById("dlToastBtn").addEventListener("click", function () { pollOrderStatus(true); });
    document.getElementById("dlToastClose").addEventListener("click", function () { _payDismissed = true; hideToast(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      try { if (getPendings().length) { if (_pollTimer) pollOrderStatus(); else startPolling(); } } catch (e) {}
    });
  }

  // ---------- Deals modal ----------
  function open(opts) {
    injectOnce();
    _onCredited = (opts && opts.onCredited) || null;
    var q = opts && opts.quota;
    document.getElementById("dlTitle").textContent = (q && q.remaining > 0)
      ? L({ en: "Top up your calorie scans", id: "Top up scan kalori kamu" })
      : L({ en: "Get more calorie scans", id: "Tambah kuota scan kalori" });
    document.getElementById("dlSub").textContent = L({ en: "Topping up lets you scan more often — understand your food intake better and keep up your healthy lifestyle.", id: "Dengan top up, kamu bisa scan lebih sering — lebih paham asupan makananmu dan tetap jaga gaya hidup sehat." });
    document.getElementById("dlList").innerHTML = SCAN_PACKS.map(function (p, idx) {
      return '<button class="dl-deal' + (p.best ? ' best' : '') + '" data-idx="' + idx + '">' +
        '<div class="dl-qty">' + p.credits + '<small>SCAN</small></div>' +
        '<div class="dl-info"><div class="p">' + rupiah(p.price) + '</div>' +
        '<div class="d">' + p.credits + 'x ' + L({ en: "calorie scans", id: "scan kalori" }) + '</div></div>' +
        (p.best ? '<span class="dl-tag">' + L({ en: "BEST VALUE", id: "PALING HEMAT" }) + '</span>' : '') +
        '</button>';
    }).join("");
    document.getElementById("dlList").querySelectorAll(".dl-deal").forEach(function (b) {
      b.addEventListener("click", function () { buyPack(+b.dataset.idx); });
    });
    document.getElementById("dlNote").textContent = L({ en: "Secure payment via SingaPay. Your extra scans never expire.", id: "Pembayaran aman via SingaPay. Scan tambahan tidak akan hangus." });
    document.getElementById("dlClose").textContent = L({ en: "Maybe later", id: "Nanti aja" });
    CURRENT_VOUCHER = null;
    var vi = document.getElementById("dlVoucher"), vm = document.getElementById("dlVMsg");
    vi.value = ""; vi.placeholder = L({ en: "Voucher code (optional)", id: "Kode voucher (opsional)" }); vm.textContent = "";
    document.getElementById("dlVApply").textContent = L({ en: "Apply", id: "Terapkan" });
    document.getElementById("dlBg").classList.add("open");
    metaTrack("Purchase", { content_name: "scan package", content_category: "calorie_scan", currency: "IDR", value: 0 });
  }
  function closeDeals() { var el = document.getElementById("dlBg"); if (el) el.classList.remove("open"); }

  async function applyVoucher() {
    var inp = document.getElementById("dlVoucher"), msg = document.getElementById("dlVMsg");
    var code = ((inp && inp.value) || "").trim().toUpperCase(); if (inp) inp.value = code;
    if (!code) { CURRENT_VOUCHER = null; if (msg) msg.textContent = ""; return; }
    if (msg) { msg.style.color = ""; msg.textContent = L({ en: "Checking…", id: "Mengecek…" }); }
    try {
      var tk = await Auth.token();
      var maxPrice = Math.max.apply(null, SCAN_PACKS.map(function (p) { return p.price; }));
      var r = await fetch("/api/scan/voucher-check", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (tk || "") }, body: JSON.stringify({ code: code, price: maxPrice }) });
      var j = await r.json().catch(function () { return {}; });
      if (!j.ok) { CURRENT_VOUCHER = null; if (msg) { msg.style.color = "var(--red,#C41101)"; msg.textContent = j.error || L({ en: "Invalid voucher.", id: "Voucher tidak valid." }); } return; }
      CURRENT_VOUCHER = code;
      if (msg) { msg.style.color = "#2A7A4F"; msg.textContent = L({ en: "Voucher applied ✓ discount calculated at payment.", id: "Voucher aktif ✓ diskon dihitung saat memilih paket." }); }
    } catch (e) { CURRENT_VOUCHER = null; if (msg) { msg.style.color = "var(--red,#C41101)"; msg.textContent = L({ en: "Couldn't check voucher.", id: "Gagal cek voucher." }); } }
  }

  async function buyPack(idx) {
    var p = SCAN_PACKS[idx]; if (!p || !p.product_id) return;
    var note = document.getElementById("dlNote");
    function setNote(t, err) { if (note) { note.textContent = t || ""; note.style.color = err ? "var(--red,#C41101)" : ""; note.style.fontWeight = err ? "800" : ""; } }
    var ftk = localStorage.getItem("fitco_token") || "";
    var btns = document.querySelectorAll("#dlList .dl-deal"); btns.forEach(function (b) { b.disabled = true; });
    var payWin = window.open("", "_blank");
    if (payWin) { try { payWin.document.write("<p style='font-family:sans-serif;padding:24px'>Menyiapkan pembayaran…</p>"); } catch (e) {} }
    setNote(L({ en: "Preparing secure payment…", id: "Menyiapkan pembayaran aman…" }), false);
    try {
      var tk = await Auth.token();
      // Server-authoritative: cukup kirim package_id (= product_id 20FIT). Server yang
      // menentukan credits & harga dari katalognya — credits/price TIDAK dikirim lagi.
      var r = await fetch("/api/scan/buy", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (tk || "") }, body: JSON.stringify({ package_id: p.product_id, voucher_code: CURRENT_VOUCHER || null, fitco_token: ftk, user_id: localStorage.getItem("fitco_uid") || null }) });
      var j = await r.json().catch(function () { return {}; });
      // Voucher bikin gratis (Rp 0): kredit sudah ditambah server.
      if (j.ok && j.free) {
        if (payWin) { try { payWin.close(); } catch (e) {} }
        btns.forEach(function (b) { b.disabled = false; });
        closeDeals();
        metaTrack("Success Payment", { content_name: "scan pack (voucher)", currency: "IDR", value: 0, contents: [{ id: p.product_id, quantity: 1 }], num_items: 1 });
        if (_onCredited) { try { await _onCredited(); } catch (e) {} }
        showThanks(p.credits);
        return;
      }
      if (!r.ok || !j.link) throw new Error(j.error || L({ en: "Couldn't start payment.", id: "Gagal memulai pembayaran." }));
      if (payWin) { payWin.location.href = j.link; } else if (!window.open(j.link, "_blank")) { location.href = j.link; }
      var oid = j.sales_order_id || j.order_no;
      if (oid) {
        try { Orders.add({ id: oid, order_no: j.order_no || null, sales_order_id: j.sales_order_id || null, credits: p.credits, price: p.price, product_id: p.product_id, link: j.link || null, provider: j.provider || null, ts: Date.now() }); } catch (e) {}
        _payDismissed = false; showToast(); startPolling();
      }
      btns.forEach(function (b) { b.disabled = false; });
      closeDeals();
    } catch (e) {
      var emsg = (e && e.message) || L({ en: "Purchase failed. Try again.", id: "Pembelian gagal. Coba lagi." });
      if (payWin && !payWin.closed) { try { payWin.document.body.innerHTML = "<p style='font-family:sans-serif;padding:24px;color:#c0392b'>" + emsg + "</p>"; } catch (e2) {} }
      setNote(emsg, true);
      btns.forEach(function (b) { b.disabled = false; });
    }
  }

  // ---------- Thank-you ----------
  function showThanks(credits) {
    injectOnce();
    document.getElementById("dlThxTitle").textContent = L({ en: "Your purchase has succeeded 🎉", id: "Pembayaranmu berhasil 🎉" });
    document.getElementById("dlThxSub").textContent = L({ en: credits + " extra calorie scans have been added to your account — happy scanning!", id: credits + " scan kalori tambahan sudah masuk ke akunmu — selamat scan!" });
    document.getElementById("dlThxClose").textContent = L({ en: "Great!", id: "Mantap!" });
    document.getElementById("dlThxBg").classList.add("open");
  }
  function closeThanks() { var m = document.getElementById("dlThxBg"); if (m) m.classList.remove("open"); }

  // ---------- Toast tunggu bayar + polling status ----------
  function getPendings() { try { return (window.Orders ? Orders.pending() : []); } catch (e) { return []; } }
  function showToast() {
    if (_payDismissed) return;
    var el = document.getElementById("dlToast"); if (!el) return;
    var a = getPendings(), last = a[0];
    document.getElementById("dlToastMsg").textContent = L({ en: "Waiting for payment confirmation… updates automatically.", id: "Menunggu konfirmasi pembayaran… ter-update otomatis." });
    document.getElementById("dlToastOrd").textContent = last ? ("Order " + (last.order_no || last.id) + (a.length > 1 ? (" +" + (a.length - 1)) : "")) : "";
    document.getElementById("dlToastBtn").textContent = L({ en: "Check now", id: "Cek sekarang" });
    el.classList.add("show");
  }
  function hideToast() { var el = document.getElementById("dlToast"); if (el) el.classList.remove("show"); }
  function stopPolling() { if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; } }
  function creditPaid(o) {
    if (o.provider !== "singapay") { try { Auth.addScanCredits(o.credits || 0); } catch (e) {} }
    if (_onCredited) { try { _onCredited(); } catch (e) {} }
    metaTrack("Success Payment", { content_name: "scan package", content_category: "calorie_scan", currency: "IDR", value: o.price || 0, contents: [{ id: o.product_id, quantity: 1 }], num_items: 1 });
  }
  async function checkOne(o) {
    var ftk = localStorage.getItem("fitco_token") || "";
    var tk = await Auth.token();
    var r = await fetch("/api/scan/order-status", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (tk || "") }, body: JSON.stringify({ sales_order_id: o.sales_order_id || o.id, order_no: o.order_no || null, fitco_token: ftk }) });
    return await r.json().catch(function () { return {}; });
  }
  async function pollOrderStatus(manual) {
    var a = getPendings();
    if (!a.length) { stopPolling(); hideToast(); return; }
    if (!_payDismissed) showToast();
    if (_payChecking) return; _payChecking = true;
    var btn = document.getElementById("dlToastBtn");
    if (manual && btn) { btn.textContent = L({ en: "Checking…", id: "Mengecek…" }); btn.disabled = true; }
    var paidOne = null;
    for (var i = 0; i < a.length; i++) {
      var o = a[i], j = {};
      try { j = await checkOne(o); } catch (e) { continue; }
      if (j && j.paid) { paidOne = o; try { Orders.markPaid(o.id); } catch (e) {} creditPaid(o); }
      else if (j && j.expired) { try { Orders.markExpired(o.id); } catch (e) {} }
    }
    _payChecking = false;
    if (btn) { btn.disabled = false; btn.textContent = L({ en: "Check now", id: "Cek sekarang" }); }
    var rem = getPendings();
    if (paidOne) { closeDeals(); if (!rem.length) { stopPolling(); hideToast(); } showThanks(paidOne.credits || 0); return; }
    if (!rem.length) { stopPolling(); hideToast(); return; }
    if (manual) { var m = document.getElementById("dlToastMsg"); if (m) m.textContent = L({ en: "Not confirmed yet. If you've paid, wait a moment and check again.", id: "Belum terkonfirmasi. Kalau sudah bayar, tunggu sebentar lalu cek lagi." }); }
  }
  function startPolling() { stopPolling(); _payDismissed = false; pollOrderStatus(); _pollTimer = setInterval(pollOrderStatus, 5000); }

  // Kalau halaman dimuat dan masih ada order tertunda (mis. balik dari SingaPay) -> lanjut pantau.
  try { if (getPendings().length) { injectOnce(); startPolling(); } } catch (e) {}

  // Lanjutkan pantau pembayaran kalau masih ada order tertunda (dipanggil saat balik dari SingaPay).
  function resume() { try { if (getPendings().length) { injectOnce(); _payDismissed = false; startPolling(); } } catch (e) {} }

  window.Deals = { open: open, close: closeDeals, resume: resume, packs: SCAN_PACKS };
})();
