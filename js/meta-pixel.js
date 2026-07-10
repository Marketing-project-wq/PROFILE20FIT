// =============================================================
//  meta-pixel.js — Meta (Facebook) Pixel + Conversions API (CAPI)
//  - Pixel ID (PUBLIK) diambil dari GET /api/config (metaPixelId).
//  - Setiap event dikirim DUA jalur dengan event_id yang SAMA (deduplikasi):
//      1) Pixel browser (fbq)         -> real-time di browser
//      2) POST /api/meta/event (CAPI) -> server, pakai access token RAHASIA
//  - Access token TIDAK pernah ada di frontend/kode; hanya di server (env).
//  Pemakaian:  Meta.track("ViewContent");  Meta.track("Lead", {}, {email});
// =============================================================
(function () {
  var pixelId = null, ready = false, queue = [];

  // Snippet resmi Meta (fbevents.js)
  function loadFbq(id) {
    if (window.fbq) return;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ?
        n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', id);
    fbq('track', 'PageView');
  }

  function uuid() {
    try { return crypto.randomUUID(); }
    catch (e) { return 'e' + Date.now() + Math.floor(Math.random() * 1e9).toString(16); }
  }
  function cookie(n) {
    var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }

  // Pixel ID PUBLIK. Diinisialisasi LANGSUNG (tanpa menunggu /api/config) supaya
  // tracking andal di setiap page-load — tidak ada race yang bikin event ketelan
  // saat navigasi (dulu event cuma jalan setelah refresh). Bisa dioverride via
  // window.META_PIXEL_ID sebelum script ini dimuat.
  var FALLBACK_PIXEL_ID = '882946526927316';
  var init = (function () {
    pixelId = (window.META_PIXEL_ID && String(window.META_PIXEL_ID)) || FALLBACK_PIXEL_ID;
    loadFbq(pixelId);
    ready = true;
    var q = queue; queue = [];
    q.forEach(function (a) { track(a[0], a[1], a[2]); });
    return Promise.resolve();
  })();

  // Event standar Meta memakai 'track'; nama lain (mis. "View Dashboard") = custom -> 'trackCustom'.
  var STD = { PageView:1, ViewContent:1, Lead:1, Purchase:1, Search:1, AddToCart:1,
    AddToWishlist:1, InitiateCheckout:1, AddPaymentInfo:1, CompleteRegistration:1,
    Contact:1, CustomizeProduct:1, Donate:1, FindLocation:1, Schedule:1,
    StartTrial:1, SubmitApplication:1, Subscribe:1 };
  function track(name, custom, opts) {
    if (!ready) { queue.push([name, custom, opts]); return; }
    custom = custom || {}; opts = opts || {};
    var eid = uuid();
    // 1) Pixel browser
    try { fbq(STD[name] ? 'track' : 'trackCustom', name, custom, { eventID: eid }); } catch (e) {}
    // 2) Conversions API (server) — event_id sama untuk dedup. keepalive supaya
    //    tetap terkirim walau halaman langsung pindah (mis. setelah login).
    try {
      fetch('/api/meta/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          event_name: name,
          event_id: eid,
          event_source_url: location.href,
          custom_data: custom,
          email: opts.email || '',
          fbp: cookie('_fbp'),
          fbc: cookie('_fbc')
        })
      }).catch(function () {});
    } catch (e) {}
  }

  window.Meta = { track: track, ready: init };
})();
