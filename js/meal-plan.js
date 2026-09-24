/* meal-plan.js — Rencana makan harian untuk halaman /calories.
 *
 * DIPORT DARI calorietracker.20fit.id (src/lib/mealPlan.ts + components/tracker/
 * MealPlanSection.tsx). Aturan pemilihannya DISALIN, bukan dikarang ulang: pembagian
 * porsi per waktu makan, PRNG mulberry32 ber-seed, toleransi jarak kalori, shortlist 4,
 * dan larangan memakai resep yang sama dua kali dalam sehari — semuanya sama persis
 * supaya rencana di kedua app bisa dibandingkan.
 *
 * SUMBER DATA: /api/menu/catalog — katalog resep resmi 20FIT yang SUDAH ada di repo ini
 * (server.js -> js/recipes.js, 120 resep). Sama dengan yang dipakai calorietracker,
 * jadi tidak ada API baru yang perlu dipasang.
 *
 * Vanilla, tanpa framework (CLAUDE.md §5). Pakai: MealPlan.mount(el, {target:2000}).
 */
(function () {
  "use strict";

  // Porsi target harian per waktu makan — angka dari mealPlan.ts.
  var MEAL_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
  var MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];
  // Emoji waktu makan sengaja SAMA dengan chip di calories.html (MEAL_TX di sana),
  // bukan menyalin ikon calorietracker — supaya satu halaman tidak memakai dua set ikon
  // untuk hal yang sama.
  var MEAL_TX = {
    breakfast: { en: "Breakfast", id: "Sarapan",     e: FIC("sunrise") },
    lunch:     { en: "Lunch",     id: "Makan siang", e: FIC("sun") },
    dinner:    { en: "Dinner",    id: "Makan malam", e: FIC("moon") },
    snack:     { en: "Snack",     id: "Camilan",     e: FIC("cookie") }
  };

  function L(o) { return (window.L ? window.L(o) : (o && (o.id || o.en))) || ""; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function kcLbl() { return L({ en: "kcal", id: "kkal" }); }
  function fmt(n) {
    n = Math.round(+n || 0);
    try { return n.toLocaleString((window.I18N && I18N.lang === "en") ? "en-US" : "id-ID"); }
    catch (e) { return String(n); }
  }

  // mulberry32 — PRNG ber-seed, disalin apa adanya supaya seed yang sama selalu
  // menghasilkan rencana yang sama (stabil per hari; "acak lagi" menaikkan seed).
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Hari ke-berapa dalam setahun -> rencana default stabil untuk satu tanggal.
  function dayOfYearSeed() {
    var now = new Date(), start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }

  function toItem(r) {
    return {
      // `rec` = record katalog apa adanya; RecipePhotos.resolveImg() butuh id/q/nm/pq.
      // Foto memakai jalur yang SAMA dengan /recipe (/api/foodphoto), bukan sumber lain.
      rec: r,
      id: r.id, emoji: r.emoji || null,
      name: L(r.nm || { en: r.id, id: r.id }),
      kcal: +r.kcal || 0, p: +r.p || 0, c: +r.c || 0, f: +r.f || 0,
      servings: r.servings != null ? r.servings : null
    };
  }

  /** null kalau katalog kosong — pemanggil menampilkan pesan, bukan crash. */
  function generate(recipes, target, seed) {
    var pool = (recipes || []).filter(function (r) { return r && +r.kcal > 0; });
    if (!pool.length) return null;
    var rand = mulberry32(seed), used = {};
    var meals = MEAL_ORDER.map(function (meal) {
      var budget = target * MEAL_SHARE[meal];
      var avail = pool.filter(function (r) { return !used[r.id]; });
      var cands = (avail.length ? avail : pool).map(function (r) {
        return { r: r, dist: Math.abs((+r.kcal || 0) - budget) };
      }).sort(function (a, b) { return a.dist - b.dist; });
      var near = cands.filter(function (x) { return x.dist <= budget * 0.35 + 40; });
      var shortlist = (near.length ? near : cands).slice(0, 4);
      var chosen = shortlist[Math.floor(rand() * shortlist.length)].r;
      used[chosen.id] = 1;
      var it = toItem(chosen);
      return { meal: meal, budget: Math.round(budget), items: [it], kcal: it.kcal, p: it.p, c: it.c, f: it.f };
    });
    var t = meals.reduce(function (a, m) {
      return { kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f };
    }, { kcal: 0, p: 0, c: 0, f: 0 });
    return { meals: meals, target: Math.round(target), kcal: t.kcal, p: t.p, c: t.c, f: t.f };
  }

  // Katalog di-cache per halaman: satu fetch untuk semua kali "acak lagi".
  var _catalog = null, _inflight = null;
  function loadCatalog() {
    if (_catalog) return Promise.resolve(_catalog);
    if (_inflight) return _inflight;
    _inflight = fetch("/api/menu/catalog")
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !Array.isArray(j.recipes)) throw new Error("bentuk data tak dikenal");
        _catalog = j.recipes; _inflight = null; return _catalog;
      })
      .catch(function (e) { _inflight = null; throw e; });
    return _inflight;
  }

  function mealHtml(m, i) {
    var it = m.items[0];
    // /recipe BELUM punya deep-link per resep (hanya ?q=), jadi tombolnya membuka
    // pencarian nama resep. Same-tab, tanpa target=_blank (CLAUDE.md §G).
    var href = "/recipe?q=" + encodeURIComponent(it.name);
    return '<div class="mp-card">' +
      '<div class="mp-mh">' +
        '<span class="mp-mi" aria-hidden="true">' + MEAL_TX[m.meal].e + '</span>' +
        '<span class="mp-mn">' + esc(L(MEAL_TX[m.meal])) + '</span>' +
        '<span class="mp-mk">~' + fmt(it.kcal) + ' ' + esc(kcLbl()) + '</span>' +
      '</div>' +
      '<div class="mp-item">' +
        '<span class="mp-ph" data-mp-photo="' + i + '" aria-hidden="true">' +
          FIC(it.emoji || "meal", 20) + '</span>' +
        '<span class="mp-it">' +
          '<span class="mp-nm">' + esc(it.name) + '</span>' +
          '<span class="mp-sub">' + fmt(it.kcal) + ' ' + esc(kcLbl()) +
            ' · P ' + Math.round(it.p) + 'g · C ' + Math.round(it.c) + 'g · F ' + Math.round(it.f) + 'g</span>' +
        '</span>' +
        '<a class="mp-cta" href="' + href + '">' + esc(L({ en: "See Recipe", id: "Lihat Resep" })) + '</a>' +
      '</div>' +
    '</div>';
  }

  // Foto dipasang SETELAH HTML masuk DOM, lazy (IntersectionObserver di recipe-photos.js)
  // supaya tidak 4 fetch sekaligus. Kalau modulnya belum ada, emoji tetap tampil.
  function applyPhotos(el, plan) {
    if (!window.RecipePhotos) return;
    var fn = RecipePhotos.applyThumbLazy || RecipePhotos.applyThumb;
    if (!fn) return;
    plan.meals.forEach(function (m, i) {
      var box = el.querySelector('[data-mp-photo="' + i + '"]');
      if (box && m.items[0] && m.items[0].rec) fn(box, m.items[0].rec);
    });
  }

  function render(el, plan, target) {
    if (!plan) {
      el.innerHTML = '<div class="mp-msg">' + esc(L({
        en: "The recipe catalog is empty, so no plan can be built.",
        id: "Katalog resep kosong, jadi rencananya belum bisa dibuat."
      })) + '</div>';
      return;
    }
    el.innerHTML =
      '<div class="mp-hd">' +
        '<span class="mp-hd-l">' +
          '<span class="mp-lbl">' + esc(L({ en: "Target", id: "Target" })) + '</span>' +
          '<span class="mp-tg"><b>' + fmt(plan.target) + '</b> <s>' + esc(kcLbl()) + '</s></span>' +
        '</span>' +
        '<button type="button" class="mp-re" id="mpRe">' +
          '<span aria-hidden="true">' + FIC("refresh", 14) + '</span> ' +
          esc(L({ en: "Another variation", id: "Variasi lain" })) + '</button>' +
      '</div>' +
      plan.meals.map(mealHtml).join("") +
      '<div class="mp-total">' +
        '<span class="mp-tl">' + esc(L({ en: "Day total", id: "Total hari ini" })) + '</span>' +
        '<span class="mp-tr"><b>' + fmt(plan.kcal) + ' ' + esc(kcLbl()) + '</b>' +
          '<s>P ' + Math.round(plan.p) + 'g · C ' + Math.round(plan.c) + 'g · F ' + Math.round(plan.f) + 'g</s></span>' +
      '</div>' +
      '<div class="mp-note">' + esc(L({
        en: "A suggestion only — nothing here is logged until you add it yourself.",
        id: "Sekadar saran — tidak ada yang tercatat sampai kamu tambahkan sendiri."
      })) + '</div>';
    applyPhotos(el, plan);
  }

  function mount(el, opts) {
    if (!el) return null;
    opts = opts || {};
    var target = +opts.target > 0 ? +opts.target : 2000;
    var seed = dayOfYearSeed();

    el.innerHTML = '<div class="mp-msg">' + esc(L({ en: "Loading the recipe catalog…", id: "Memuat katalog resep…" })) + '</div>';

    function draw() {
      render(el, generate(_catalog, target, seed), target);
      var b = el.querySelector("#mpRe");
      if (b) b.onclick = function () { seed = (seed + 1) | 0; draw(); };
    }
    function boot() {
      loadCatalog().then(draw).catch(function () {
        // Gagal muat -> pesan + tombol coba lagi (pola state repo: loading/empty/error/retry).
        el.innerHTML = '<div class="mp-msg">' + esc(L({
          en: "Couldn't load the recipe catalog.", id: "Gagal memuat katalog resep."
        })) + ' <button type="button" class="mp-re" id="mpRetry">' + esc(L({ en: "Retry", id: "Coba lagi" })) + '</button></div>';
        var r = el.querySelector("#mpRetry");
        if (r) r.onclick = boot;
      });
    }
    boot();

    // Target kalori bisa berubah (mis. profil/puasa) — halaman memanggil ini, bukan
    // menyimpan salinan targetnya sendiri.
    return { setTarget: function (t) { if (+t > 0 && +t !== target) { target = +t; if (_catalog) draw(); } } };
  }

  window.MealPlan = { mount: mount, generate: generate, dayOfYearSeed: dayOfYearSeed, MEAL_SHARE: MEAL_SHARE };
})();
