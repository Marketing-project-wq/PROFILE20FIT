// =============================================================
//  deals.js — Modul bersama "Top up scan" (paket kredit + checkout Xendit).
//  Alur: pilih paket (sekali klik) -> "Purchase now" -> pop-up RESI (ringkasan +
//  voucher + total) -> bayar. Dipakai calories.html & profile.html (satu sumber).
//  Server otoritatif: kredit ditambah lewat webhook; harga akhir = harga - diskon voucher.
//  API: window.Deals.open({ onCredited })  |  Deals.close()  |  Deals.resume()
// =============================================================
(function () {
  var SCAN_PACKS = [
    { credits: 10, price: 25000, product_id: 8477, best: false },
    { credits: 50, price: 75000, product_id: 8478, best: true },
    { credits: 150, price: 150000, product_id: 8479, best: false },
  ];
  function L(o) { return (window.L ? window.L(o) : (o && o.en)) || ""; }
  function rupiah(n) { return "Rp " + (Number(n) || 0).toLocaleString("id-ID"); }
  function metaTrack(ev, p) { try { if (window.Meta) Meta.track(ev, p); } catch (e) {} }

  var SELECTED = -1;         // index paket terpilih (-1 = belum ada yang dipilih)
  var CUR_VOUCHER = null, CUR_DISCOUNT = 0, CUR_FINAL = 0;
  var _onCredited = null;
  var _pollTimer = null, _payChecking = false, _payDismissed = false;
  // Tab checkout Xendit yang KITA buka. Disimpan di level modul supaya polling otomatis
  // (bukan cuma tombol "Cek sekarang") bisa menutupnya begitu pembayaran terkonfirmasi.
  // Perlu karena success_redirect_url invoice ditentukan backend 20FIT dan mengarah ke
  // platform event mereka — tanpa ini user ditinggal menatap situs asing setelah bayar.
  var _payWin = null;
  function closePayWin() { try { if (_payWin && !_payWin.closed) _payWin.close(); } catch (e) {} _payWin = null; }

  function injectOnce() {
    if (document.getElementById("dealsRoot")) return;
    var css = document.createElement("style");
    css.textContent = [
      ".dl-bg{position:fixed;inset:0;z-index:9000;background:rgba(10,12,16,.55);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:none;align-items:flex-end;justify-content:center}",
      ".dl-bg.open{display:flex}",
      ".dl-card{position:relative;width:100%;max-width:460px;background:var(--card,#fff);color:var(--txt,#16181d);border-radius:24px 24px 0 0;max-height:92vh;overflow-y:auto;padding:8px 22px calc(env(safe-area-inset-bottom) + 24px);box-shadow:0 -12px 44px rgba(0,0,0,.28);animation:dlUp .3s cubic-bezier(.2,.85,.25,1)}",
      "@keyframes dlUp{from{transform:translateY(100%)}to{transform:translateY(0)}}",
      ".dl-grab{width:42px;height:5px;border-radius:999px;background:var(--line,#e6e3dd);margin:9px auto 8px}",
      ".dl-x{position:absolute;top:12px;right:14px;z-index:3;width:34px;height:34px;border:0;border-radius:50%;background:var(--inp,#efece6);color:var(--txt,#16181d);font-size:17px;line-height:1;cursor:pointer;display:grid;place-items:center}",
      ".dl-ic{width:54px;height:54px;border-radius:16px;background:var(--red-soft,#fdecec);display:grid;place-items:center;margin:6px auto 12px}",
      ".dl-ic svg{width:26px;height:26px;fill:none;stroke:var(--red,#C41101);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
      ".dl-card h3{margin:0 0 4px;text-align:center;font-size:20px;font-weight:800}",
      ".dl-sub{text-align:center;color:var(--muted,#8a8378);font-size:13.5px;line-height:1.5;margin:0 auto 14px;max-width:360px}",
      ".dl-deal{display:flex;align-items:center;gap:13px;width:100%;text-align:left;border:1.5px solid var(--line,#e6e3dd);background:var(--card,#fff);border-radius:16px;padding:14px;margin-top:11px;cursor:pointer;transition:.15s;color:var(--txt,#16181d);position:relative}",
      ".dl-deal:hover{border-color:var(--green,#2A7A4F)}",
      ".dl-deal.sel{border-color:var(--green,#2A7A4F);box-shadow:0 6px 18px rgba(42,122,79,.16);background:rgba(42,122,79,.05)}",
      ".dl-qty{width:54px;height:54px;flex:0 0 auto;border-radius:14px;background:var(--red,#C41101);color:#fff;display:grid;place-items:center;font-size:19px;font-weight:900;line-height:1}",
      ".dl-qty small{display:block;font-size:9px;letter-spacing:1px;font-weight:800;opacity:.9;margin-top:2px}",
      ".dl-info{flex:1}.dl-info .p{font-size:17px;font-weight:900}.dl-info .d{font-size:12.5px;color:var(--muted,#8a8378);margin-top:2px}",
      ".dl-radio{width:22px;height:22px;flex:0 0 auto;border-radius:50%;border:2px solid var(--line,#cfc9c0);display:grid;place-items:center}",
      ".dl-deal.sel .dl-radio{border-color:var(--green,#2A7A4F)}",
      ".dl-deal.sel .dl-radio::after{content:'';width:11px;height:11px;border-radius:50%;background:var(--green,#2A7A4F)}",
      ".dl-tag{position:absolute;top:-9px;right:52px;background:var(--red,#C41101);color:#fff;font-size:10px;font-weight:800;letter-spacing:.5px;padding:3px 9px;border-radius:999px}",
      ".dl-primary{width:100%;margin-top:16px;border:0;border-radius:14px;background:var(--green,#2A7A4F);color:#fff;font-weight:800;font-size:15.5px;padding:15px;cursor:pointer;box-shadow:0 8px 20px rgba(42,122,79,.28)}",
      ".dl-primary:disabled{opacity:.6;cursor:default;box-shadow:none}",
      ".dl-note{text-align:center;color:var(--muted,#8a8378);font-size:12px;margin-top:12px;line-height:1.5}",
      // receipt
      ".dl-rc-item{display:flex;align-items:center;gap:13px;padding:12px 0;border-bottom:1px solid var(--line,#e6e3dd)}",
      ".dl-vrow{display:flex;gap:8px;align-items:center;margin:14px 0 4px}",
      ".dl-vrow input{flex:1;text-transform:uppercase;padding:12px 13px;border:1.5px solid var(--line,#e6e3dd);border-radius:12px;font-size:14px;background:var(--inp,#f6f4f0);color:var(--txt,#16181d)}",
      ".dl-vapply{margin:0;width:auto;padding:12px 18px;border:0;border-radius:12px;background:var(--inp,#efece6);color:var(--txt,#16181d);font-weight:750;font-size:14px;cursor:pointer}",
      ".dl-vmsg{font-size:12px;min-height:16px;margin:2px 0 8px;font-weight:600}",
      ".dl-rc-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:14px}",
      ".dl-rc-row .k{color:var(--muted,#8a8378)}",
      ".dl-rc-total{display:flex;justify-content:space-between;align-items:center;padding:12px 0 4px;margin-top:6px;border-top:1px dashed var(--line,#e6e3dd);font-weight:900;font-size:17px}",
      ".dl-detail{margin-top:6px}",
      // toast + thanks
      ".dl-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom) + 16px);z-index:9100;background:var(--card,#fff);color:var(--txt,#16181d);border:1px solid var(--line,#e6e3dd);border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.22);padding:13px 15px;max-width:380px;width:calc(100% - 32px);display:none;gap:10px;align-items:center}",
      ".dl-toast.show{display:flex}",
      ".dl-toast .sp{width:18px;height:18px;flex:0 0 auto;border:2.5px solid var(--line,#e6e3dd);border-top-color:var(--red,#C41101);border-radius:50%;animation:dlSpin 1s linear infinite}",
      "@keyframes dlSpin{to{transform:rotate(360deg)}}",
      ".dl-toast .tmsg{flex:1;font-size:12.5px;line-height:1.4}.dl-toast .tord{font-size:11px;color:var(--muted,#8a8378)}",
      ".dl-toast button{border:0;background:var(--red,#C41101);color:#fff;font-weight:700;font-size:12px;border-radius:9px;padding:8px 11px;cursor:pointer}",
      ".dl-toast .tx{background:transparent;color:var(--muted,#8a8378);padding:6px}",
      ".dl-thx{text-align:center}.dl-thx .em{font-size:44px;margin:10px 0 4px}",
      "@media(min-width:620px){ .dl-bg{align-items:center;padding:24px} .dl-card{border-radius:24px} .dl-grab{display:none} }",
    ].join("");
    document.head.appendChild(css);

    var root = document.createElement("div");
    root.id = "dealsRoot";
    root.innerHTML =
      // ----- Deals (pilih paket + detail harga & voucher INLINE) -----
      '<div class="dl-bg" id="dlBg"><div class="dl-card">' +
      '<button class="dl-x" id="dlX" aria-label="Tutup">✕</button>' +
      '<div class="dl-grab"></div>' +
      '<div class="dl-ic"><svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>' +
      '<h3 id="dlTitle"></h3><div class="dl-sub" id="dlSub"></div>' +
      '<div id="dlList"></div>' +
      // detail muncul setelah paket dipilih (voucher + rincian harga), tanpa popup terpisah
      '<div id="dlDetail" class="dl-detail" style="display:none">' +
      '<div class="dl-vrow"><input id="dlVoucher" autocomplete="off" /><button class="dl-vapply" id="dlVApply"></button></div>' +
      '<div class="dl-vmsg" id="dlVMsg"></div>' +
      '<div id="dlPhoneRow" style="display:none;margin:10px 0 2px">' +
      '<label for="dlPhone" id="dlPhoneLbl" style="display:block;font-size:13px;font-weight:600;margin-bottom:5px"></label>' +
      '<input id="dlPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+62 812xxxxxxxx" style="width:100%;padding:11px 12px;border-radius:12px;border:1px solid var(--line,#e5e2dd);background:var(--card,#fff);color:var(--txt,#16181d);font-size:15px;box-sizing:border-box" />' +
      '<div id="dlPhoneMsg" style="font-size:12.5px;color:var(--red,#C41101);margin-top:5px"></div></div>' +
      '<div class="dl-rc-row"><span class="k" id="dlRcSubL"></span><span id="dlRcSub"></span></div>' +
      '<div class="dl-rc-row" id="dlRcDiscRow" style="display:none"><span class="k" style="color:var(--green,#2A7A4F)" id="dlRcDiscL"></span><span style="color:var(--green,#2A7A4F);font-weight:700" id="dlRcDisc"></span></div>' +
      '<div class="dl-rc-total"><span id="dlRcTotalL"></span><span id="dlRcTotal"></span></div>' +
      '</div>' +
      '<div class="dl-note" id="dlNote"></div>' +
      '<button class="dl-primary" id="dlPay"></button>' +
      '</div></div>' +
      // ----- Toast + thanks -----
      '<div class="dl-toast" id="dlToast"><div class="sp"></div><div class="tmsg"><div id="dlToastMsg"></div><div class="tord" id="dlToastOrd"></div></div>' +
      '<button id="dlToastBtn"></button><button class="tx" id="dlToastClose">✕</button></div>' +
      '<div class="dl-bg" id="dlThxBg"><div class="dl-card dl-thx">' +
      '<button class="dl-x" id="dlThxX" aria-label="Tutup">✕</button>' +
      '<div class="dl-grab"></div><div class="em">🎉</div><h3 id="dlThxTitle"></h3><div class="dl-sub" id="dlThxSub"></div>' +
      '<button class="dl-primary" id="dlThxClose"></button>' +
      '</div></div>';
    document.body.appendChild(root);

    document.getElementById("dlX").addEventListener("click", closeDeals);
    document.getElementById("dlBg").addEventListener("click", function (e) { if (e.target.id === "dlBg") closeDeals(); });
    document.getElementById("dlVApply").addEventListener("click", applyVoucher);
    document.getElementById("dlPay").addEventListener("click", function () { buyPack(SELECTED); });
    document.getElementById("dlThxClose").addEventListener("click", closeThanks);
    document.getElementById("dlThxX").addEventListener("click", closeThanks);
    document.getElementById("dlThxBg").addEventListener("click", function (e) { if (e.target.id === "dlThxBg") closeThanks(); });
    document.getElementById("dlToastBtn").addEventListener("click", function () {
      // "Cek sekarang" -> cek status; kalau BELUM lunas, arahkan ke HALAMAN PEMBAYARAN (link Xendit).
      // Window dibuka SINKRON di dalam gesture klik supaya tidak diblok popup-blocker; nanti
      // pollOrderStatus mengarahkannya ke link (masih pending) atau menutup (sudah lunas).
      var a = getPendings();
      var target = (a[0] && a[0].link) ? a[0] : null;
      if (!target) { for (var i = 0; i < a.length; i++) { if (a[i] && a[i].link) { target = a[i]; break; } } }
      var win = target ? window.open("", "_blank") : null;
      if (win) { closePayWin(); _payWin = win; try { win.document.write("<p style='font-family:sans-serif;padding:24px'>" + L({ en: "Opening payment page…", id: "Membuka halaman pembayaran…" }) + "</p>"); } catch (e) {} }
      pollOrderStatus(true, win, target);
    });
    document.getElementById("dlToastClose").addEventListener("click", function () { _payDismissed = true; hideToast(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDeals(); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) return;
      try { if (getPendings().length) { if (_pollTimer) pollOrderStatus(); else startPolling(); } } catch (e) {}
      // Titik coba-ulang sapuan: kalau sapuan saat load gagal (429/offline/cold start), user
      // yang kembali ke tab ini memicunya lagi. Tanpa ini kegagalan sekali = kredit lintas-device
      // tertahan sampai halaman di-reload. No-op kalau sudah sukses (_swept).
      try { sweep(); } catch (e) {}
    });
  }

  // ---------- Deals: pilih paket + detail inline ----------
  function open(opts) {
    injectOnce();
    _onCredited = (opts && opts.onCredited) || null;
    var q = opts && opts.quota;
    SELECTED = -1;                       // tak ada paket ter-highlight saat dibuka
    CUR_VOUCHER = null; CUR_DISCOUNT = 0; CUR_FINAL = 0;
    document.getElementById("dlTitle").textContent = (q && q.remaining > 0)
      ? L({ en: "Top up your calorie scans", id: "Top up scan kalori kamu" })
      : L({ en: "Get more calorie scans", id: "Tambah kuota scan kalori" });
    document.getElementById("dlSub").textContent = L({ en: "Pick a pack to see the price & add a voucher.", id: "Pilih paket untuk lihat harga & pakai voucher." });
    renderPacks();
    document.getElementById("dlVApply").textContent = L({ en: "Apply", id: "Pakai" });
    document.getElementById("dlRcSubL").textContent = L({ en: "Subtotal", id: "Subtotal" });
    document.getElementById("dlRcDiscL").textContent = L({ en: "Voucher discount", id: "Diskon voucher" });
    document.getElementById("dlRcTotalL").textContent = L({ en: "Total to pay", id: "Total bayar" });
    document.getElementById("dlDetail").style.display = "none";   // detail baru muncul setelah pilih paket
    // Reset input HP (hanya muncul kalau server minta / profil tanpa no HP).
    var _pr = document.getElementById("dlPhoneRow"); if (_pr) _pr.style.display = "none";
    var _pi = document.getElementById("dlPhone"); if (_pi) _pi.value = "";
    var _pm = document.getElementById("dlPhoneMsg"); if (_pm) _pm.textContent = "";
    document.getElementById("dlNote").textContent = L({ en: "Secure payment via Xendit. Your extra scans never expire.", id: "Pembayaran aman via Xendit. Scan tambahan tidak akan hangus." });
    renderTotals();
    document.getElementById("dlBg").classList.add("open");
    metaTrack("Purchase", { content_name: "scan package", content_category: "calorie_scan", currency: "IDR", value: 0 });
  }
  function renderPacks() {
    document.getElementById("dlList").innerHTML = SCAN_PACKS.map(function (p, idx) {
      return '<button class="dl-deal' + (idx === SELECTED ? ' sel' : '') + '" data-idx="' + idx + '">' +
        '<div class="dl-qty">' + p.credits + '<small>SCAN</small></div>' +
        '<div class="dl-info"><div class="p">' + rupiah(p.price) + '</div>' +
        '<div class="d">' + p.credits + 'x ' + L({ en: "calorie scans", id: "scan kalori" }) + '</div></div>' +
        (p.best ? '<span class="dl-tag">' + L({ en: "BEST VALUE", id: "PALING HEMAT" }) + '</span>' : '') +
        '<span class="dl-radio"></span></button>';
    }).join("");
    document.getElementById("dlList").querySelectorAll(".dl-deal").forEach(function (b) {
      b.addEventListener("click", function () { selectPack(+b.dataset.idx); });
    });
  }
  // Pilih paket -> highlight hijau + tampilkan detail harga & voucher INLINE (bukan popup terpisah).
  function selectPack(idx) {
    SELECTED = idx;
    CUR_VOUCHER = null; CUR_DISCOUNT = 0; CUR_FINAL = SCAN_PACKS[idx].price;
    renderPacks();
    var vi = document.getElementById("dlVoucher"), vm = document.getElementById("dlVMsg");
    if (vi) { vi.value = ""; vi.placeholder = L({ en: "Voucher code (optional)", id: "Kode voucher (opsional)" }); }
    if (vm) { vm.style.color = ""; vm.textContent = ""; }
    document.getElementById("dlDetail").style.display = "";
    renderTotals();
  }
  function closeDeals() { var el = document.getElementById("dlBg"); if (el) el.classList.remove("open"); }

  // ---------- Rincian harga + voucher (inline) ----------
  function renderTotals() {
    var payBtn = document.getElementById("dlPay");
    if (SELECTED < 0) {                  // belum ada paket dipilih -> tombol nonaktif
      payBtn.disabled = true;
      payBtn.textContent = L({ en: "Select a pack", id: "Pilih paket dulu" });
      return;
    }
    var p = SCAN_PACKS[SELECTED];
    document.getElementById("dlRcSub").textContent = rupiah(p.price);
    var dr = document.getElementById("dlRcDiscRow");
    if (CUR_DISCOUNT > 0) { dr.style.display = ""; document.getElementById("dlRcDisc").textContent = "− " + rupiah(CUR_DISCOUNT); }
    else dr.style.display = "none";
    document.getElementById("dlRcTotal").textContent = rupiah(CUR_FINAL);
    payBtn.disabled = false;
    payBtn.textContent = (CUR_FINAL <= 0)
      ? L({ en: "Claim for free", id: "Klaim gratis" })
      : L({ en: "Pay ", id: "Bayar " }) + rupiah(CUR_FINAL);
  }
  async function applyVoucher() {
    var inp = document.getElementById("dlVoucher"), msg = document.getElementById("dlVMsg");
    var code = ((inp && inp.value) || "").trim().toUpperCase(); if (inp) inp.value = code;
    var p = SCAN_PACKS[SELECTED];
    if (!code) { CUR_VOUCHER = null; CUR_DISCOUNT = 0; CUR_FINAL = p.price; if (msg) msg.textContent = ""; renderTotals(); return; }
    if (msg) { msg.style.color = ""; msg.textContent = L({ en: "Checking…", id: "Mengecek…" }); }
    try {
      var tk = await Auth.token();
      var r = await fetch("/api/scan/voucher-check", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (tk || "") }, body: JSON.stringify({ code: code, price: p.price }) });
      var j = await r.json().catch(function () { return {}; });
      if (!j.ok) { CUR_VOUCHER = null; CUR_DISCOUNT = 0; CUR_FINAL = p.price; renderTotals(); if (msg) { msg.style.color = "var(--red,#C41101)"; msg.textContent = j.error || L({ en: "Invalid voucher.", id: "Voucher tidak valid." }); } return; }
      CUR_VOUCHER = code; CUR_DISCOUNT = +j.discount || 0; CUR_FINAL = (j.final != null) ? +j.final : Math.max(0, p.price - CUR_DISCOUNT);
      renderTotals();
      if (msg) { msg.style.color = "#2A7A4F"; msg.textContent = L({ en: "Voucher applied ✓", id: "Voucher aktif ✓" }); }
    } catch (e) { CUR_VOUCHER = null; CUR_DISCOUNT = 0; CUR_FINAL = p.price; renderTotals(); if (msg) { msg.style.color = "var(--red,#C41101)"; msg.textContent = L({ en: "Couldn't check voucher.", id: "Gagal cek voucher." }); } }
  }

  // Sesi habis: tampilkan pesan manusiawi + jalan keluarnya, bukan kata "Unauthorized".
  // Sesi bisa mati wajar (token kedaluwarsa; beberapa tab my.20fit.id saling merotasi refresh
  // token Supabase). Yang penting user tahu ini bukan pembayaran gagal & tak perlu bayar ulang.
  function showSessionExpired(payWin) {
    if (payWin) { try { payWin.close(); } catch (e) {} }
    _payWin = null;
    var msg = L({
      en: "Your session has expired. Please log in again to continue — nothing was charged.",
      id: "Sesi kamu sudah habis. Login lagi untuk melanjutkan — tidak ada yang terpotong.",
    });
    var vm = document.getElementById("dlVMsg");
    if (vm) { vm.style.color = "var(--red,#C41101)"; vm.textContent = msg; }
    var btn = document.getElementById("dlPay");
    if (btn) {
      btn.disabled = false;
      btn.textContent = L({ en: "Log in again", id: "Login lagi" });
      btn.onclick = function () { location.href = "/login?next=" + encodeURIComponent(location.pathname + location.hash); };
    }
  }

  // ---------- Bayar ----------
  async function buyPack(idx) {
    var p = SCAN_PACKS[idx]; if (!p || !p.product_id) return;
    var payBtn = document.getElementById("dlPay");
    var free = CUR_FINAL <= 0;
    payBtn.disabled = true; payBtn.textContent = L({ en: "Processing…", id: "Memproses…" });
    var ftk = localStorage.getItem("fitco_token") || "";
    // Dibuka SINKRON di dalam gesture klik supaya tidak kena popup blocker.
    var payWin = free ? null : window.open("", "_blank");
    _payWin = payWin;
    if (payWin) { try { payWin.document.write("<p style='font-family:sans-serif;padding:24px'>Menyiapkan pembayaran…</p>"); } catch (e) {} }
    try {
      var tk = await Auth.token();
      // Sesi sudah hilang sebelum kita menembak server (mis. token kedaluwarsa, atau beberapa
      // tab saling merotasi refresh token). Jangan kirim "Bearer " kosong lalu memantulkan
      // "Unauthorized" ke wajah user — beri tahu apa yang terjadi & jalan keluarnya.
      if (!tk) { showSessionExpired(payWin); payBtn.disabled = false; renderTotals(); return; }
      // Server-authoritative: kirim package_id (= product_id 20FIT). Server menentukan
      // credits & harga dari katalog; voucher juga diverifikasi & dihitung server.
      var phoneVal = ((document.getElementById("dlPhone") || {}).value || "").trim();
      var r = await fetch("/api/scan/buy", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (tk || "") }, body: JSON.stringify({ package_id: p.product_id, credits: p.credits, price: p.price, voucher_code: CUR_VOUCHER || null, fitco_token: ftk, user_id: localStorage.getItem("fitco_uid") || null, phone: phoneVal || null }) });
      // Baca sbg TEXT dulu lalu parse: kalau server/platform balas non-JSON (mis. 5xx/timeout
      // HTML), kita masih tahu status HTTP-nya dan bisa tampilkan sebab yg actionable.
      var raw = await r.text().catch(function () { return ""; });
      var j = {}; try { j = raw ? JSON.parse(raw) : {}; } catch (e) { j = {}; }
      var disc = (j.discount != null) ? +j.discount : CUR_DISCOUNT;
      var total = (j.amount != null) ? +j.amount : Math.max(0, p.price - disc);
      // Voucher bikin gratis (Rp 0): kredit sudah ditambah server.
      if (j.ok && j.free) {
        if (payWin) { try { payWin.close(); } catch (e) {} }
        try { Orders.add({ id: j.sales_order_id || j.order_no, order_no: j.order_no || null, sales_order_id: j.sales_order_id || null, credits: p.credits, price: p.price, discount: disc, total: 0, product_id: p.product_id, provider: j.provider || "voucher", status: "paid", ts: Date.now(), paid_ts: Date.now() }); } catch (e) {}
        closeDeals();
        metaTrack("Success Payment", { content_name: "scan pack (voucher)", currency: "IDR", value: 0, contents: [{ id: p.product_id, quantity: 1 }], num_items: 1 });
        if (_onCredited) { try { await _onCredited(); } catch (e) {} }
        showThanks(p.credits);
        return;
      }
      // Server bilang sesi habis (401): tawarkan login ulang, jangan pantulkan pesan mentah.
      if (!r.ok && j.session_expired) { showSessionExpired(payWin); return; }
      // Server minta nomor HP (profil kosong) -> munculkan input HP di sheet & minta ulang; bukan error fatal.
      if (!r.ok && j.need_phone) {
        if (payWin) { try { payWin.close(); } catch (e) {} }
        var prow = document.getElementById("dlPhoneRow");
        var plbl = document.getElementById("dlPhoneLbl");
        var pmsg = document.getElementById("dlPhoneMsg");
        var pinp = document.getElementById("dlPhone");
        if (plbl) plbl.textContent = L({ en: "Phone number (for payment)", id: "Nomor HP (untuk pembayaran)" });
        if (prow) prow.style.display = "block";
        if (pmsg) pmsg.textContent = j.error || L({ en: "Enter your phone number to continue.", id: "Masukkan nomor HP untuk lanjut." });
        if (pinp) { try { pinp.focus(); } catch (e) {} }
        payBtn.disabled = false; renderTotals();
        return;
      }
      if (!r.ok || !j.link) {
        if (!j.error) { try { console.error("scan/buy non-JSON resp", r.status, (raw || "").slice(0, 300)); } catch (e) {} }
        throw new Error(j.error || (L({ en: "Couldn't start payment.", id: "Gagal memulai pembayaran." }) + " (HTTP " + r.status + ")"));
      }
      // Catat order DULU, baru buka checkout: kalau pencatatan gagal/terlewat, order hilang
      // dari sisi klien dan polling tak pernah jalan. Server tetap sumber kebenarannya, tapi
      // ini yang bikin tab ini tahu harus memantau apa.
      var oid = j.sales_order_id || j.order_no;
      if (oid) {
        try { Orders.add({ id: oid, order_no: j.order_no || null, sales_order_id: j.sales_order_id || null, credits: p.credits, price: p.price, discount: disc, total: total, product_id: p.product_id, link: j.link || null, provider: j.provider || null, ts: Date.now() }); } catch (e) {}
      }
      // Arahkan tab checkout. Urutan sengaja: tab terpisah DULU supaya halaman ini tetap hidup
      // dan bisa polling + menampilkan thank-you (invoice ber-success_redirect_url ke platform
      // event 20FIT, di luar kendali kita, jadi tab pembayaran TIDAK kembali ke sini).
      //
      // TAPI jangan sampai memaksa: di WebView in-app (Instagram/Facebook/TikTok) window.open
      // SELALU balik null — gesture klik pun tak menolong (Android setSupportMultipleWindows
      // (false) / WKWebView tanpa createWebViewWith). Buat mereka, menavigasi tab ini adalah
      // SATU-SATUNYA cara bisa bayar. Menghapusnya = pembayaran mustahil, lebih parah dari
      // masalah yang mau diperbaiki. Aman dilakukan sekarang karena kredit tak lagi bergantung
      // pada tab ini: /api/scan/reconcile menyapu order dari DB saat app dibuka lagi.
      if (oid) { _payDismissed = false; showToast(); startPolling(); }
      closeDeals();
      if (payWin) { try { payWin.location.href = j.link; } catch (e) { location.href = j.link; } }
      else {
        _payWin = window.open(j.link, "_blank");
        if (!_payWin) { location.href = j.link; }   // WebView/popup-blocked: bayar > tetap di sini
      }
    } catch (e) {
      var emsg = (e && e.message) || L({ en: "Purchase failed. Try again.", id: "Pembelian gagal. Coba lagi." });
      if (payWin && !payWin.closed) { try { payWin.document.body.innerHTML = "<p style='font-family:sans-serif;padding:24px;color:#c0392b'>" + emsg + "</p>"; } catch (e2) {} }
      var vm = document.getElementById("dlVMsg"); if (vm) { vm.style.color = "var(--red,#C41101)"; vm.textContent = emsg; }
    }
    payBtn.disabled = false; renderTotals();
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
    if (o.provider !== "xendit") { try { Auth.addScanCredits(o.credits || 0); } catch (e) {} }
    if (_onCredited) { try { _onCredited(); } catch (e) {} }
    metaTrack("Success Payment", { content_name: "scan package", content_category: "calorie_scan", currency: "IDR", value: o.total || o.price || 0, contents: [{ id: o.product_id, quantity: 1 }], num_items: 1 });
  }
  async function checkOne(o) {
    var ftk = localStorage.getItem("fitco_token") || "";
    var tk = await Auth.token();
    var r = await fetch("/api/scan/order-status", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + (tk || "") }, body: JSON.stringify({ sales_order_id: o.sales_order_id || o.id, order_no: o.order_no || null, fitco_token: ftk }) });
    return await r.json().catch(function () { return {}; });
  }
  async function pollOrderStatus(manual, payWin, payTarget) {
    // payWin/payTarget hanya diisi saat user klik "Cek sekarang" (window sudah dibuka sinkron).
    // Masih pending -> window diarahkan ke halaman pembayaran; sudah lunas -> window ditutup.
    function routePayWin() {
      if (!payWin) return;
      if (payTarget && payTarget.link) { try { payWin.location.href = payTarget.link; return; } catch (e) {} }
      try { payWin.close(); } catch (e) {}
    }
    var a = getPendings();
    // Daftar pending kosong TIDAK berarti lunas: Orders.prune() menandai pending >30 menit
    // (MAX_AGE) sebagai expired secara LOKAL, padahal invoice Xendit-nya masih bisa dibayar
    // (transfer bank sering lebih lama). Jadi berhenti polling saja — JANGAN tutup _payWin di
    // sini; itu akan menutup tab yang sedang dipakai user membayar. Tab hanya ditutup kalau
    // pembayaran benar-benar terkonfirmasi lunas (lihat cabang paidOne di bawah).
    if (!a.length) { stopPolling(); hideToast(); return; }
    if (!_payDismissed) showToast();
    if (_payChecking) { routePayWin(); return; }
    _payChecking = true;
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
    // Lunas: tutup tab checkout. Setelah bayar, Xendit melempar tab itu ke platform event 20FIT
    // (success_redirect_url di-set backend 20FIT, bukan kita) — kalau dibiarkan, user berakhir
    // menatap situs asing dan mengira pembayarannya gagal. Tab ini yang menampilkan thank-you.
    if (paidOne) { if (payWin) { try { payWin.close(); } catch (e) {} } closePayWin(); closeDeals(); if (!rem.length) { stopPolling(); hideToast(); } showThanks(paidOne.credits || 0); return; }
    // Sisa pending habis TANPA ada yang lunas (mis. semua kadaluarsa/dibatalkan): stop polling,
    // tapi lagi-lagi JANGAN tutup _payWin — belum tentu user selesai di sana.
    if (!rem.length) { stopPolling(); hideToast(); return; }
    // Masih pending -> arahkan ke halaman pembayaran (kalau dipicu tombol & ada link).
    routePayWin();
    if (manual) {
      var m = document.getElementById("dlToastMsg");
      if (m) m.textContent = payWin
        ? L({ en: "Payment page opened — complete it there. If you've already paid, this updates automatically.", id: "Halaman pembayaran dibuka — selesaikan di sana. Kalau sudah bayar, ini ter-update otomatis." })
        : L({ en: "Not confirmed yet. If you've paid, wait a moment and check again.", id: "Belum terkonfirmasi. Kalau sudah bayar, tunggu sebentar lalu cek lagi." });
    }
  }
  function startPolling() { stopPolling(); _payDismissed = false; pollOrderStatus(); _pollTimer = setInterval(pollOrderStatus, 5000); }

  function resume() { try { if (getPendings().length) { injectOnce(); _payDismissed = false; startPolling(); } } catch (e) {} }

  // Sapu order tertunda milik user dari SERVER (bukan localStorage). Sengaja jalan TANPA syarat
  // getPendings(): justru kasus yang mau ditolong adalah localStorage kosong — user bayar di
  // device lain, atau storage-nya hilang. Server yang menyimpan order-nya, jadi server yang tahu.
  // onCredited dilewatkan eksplisit: _onCredited hanya terisi lewat Deals.open(), dan pada
  // kasus lintas-device user belum pernah membuka sheet paket — tanpa ini kredit masuk di
  // server tapi angka kuota di layar tidak ikut ter-update.
  // _swept dikunci HANYA setelah sapuan benar-benar BERHASIL. Kalau dikunci di awal, satu
  // kegagalan sementara (429, offline, 502 cold-start) mematikan satu-satunya jalur kredit
  // lintas-device untuk seluruh page load — diam-diam, tanpa error. User yang sudah bayar
  // lihat kuota lama, mengira gagal, lalu BELI LAGI: dobel bayar beneran.
  var _swept = false, _sweeping = false, _sweepCb = null;
  async function sweep(onCredited) {
    if (onCredited) _sweepCb = onCredited;   // diingat: percobaan ulang tak membawa argumen
    if (_swept || _sweeping) return;
    _sweeping = true;
    var cb = _sweepCb || _onCredited;
    try {
      var tk = await Auth.token(); if (!tk) return;   // Auth belum siap: biarkan bisa dicoba lagi
      var ftk = localStorage.getItem("fitco_token") || "";
      var r = await fetch("/api/scan/reconcile", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + tk }, body: JSON.stringify({ fitco_token: ftk }) });
      if (!r.ok) { try { console.warn("scan/reconcile HTTP " + r.status); } catch (e) {} return; }
      var j = await r.json().catch(function () { return null; });
      if (!j || j.ok !== true) { try { console.warn("scan/reconcile balasan tak terbaca"); } catch (e) {} return; }
      _swept = true;   // sukses -> jangan ulangi di page load ini
      if (j.credited > 0) {
        // Selaraskan riwayat lokal kalau order-nya memang ada di device ini (lintas-device: tidak ada).
        try { (j.orders || []).forEach(function (o) { if (Orders.get(o.reff_no)) Orders.markPaid(o.reff_no); }); } catch (e) {}
        stopPolling(); hideToast(); closePayWin();
        if (cb) { try { await cb(); } catch (e) {} }
        injectOnce(); showThanks(j.credits || 0);
      }
    } catch (e) {
      try { console.warn("scan/reconcile gagal:", (e && e.message) || e); } catch (_) {}
    } finally { _sweeping = false; }
  }

  try { if (getPendings().length) { injectOnce(); startPolling(); } } catch (e) {}

  window.Deals = { open: open, close: closeDeals, resume: resume, sweep: sweep, packs: SCAN_PACKS };
})();
