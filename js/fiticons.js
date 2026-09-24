/* ============================================================================
 * fiticons — ikon minimalis (inline SVG, 1 warna currentColor) untuk my.20fit.
 * SATU sumber kebenaran, pengganti emoji warna-warni di seluruh app.
 *
 * Pakai:
 *   - HTML statis:  <span class="fic" data-ic="water"></span>
 *                   (dihidrasi otomatis saat DOMContentLoaded jadi <svg>).
 *   - Dari JS:      FIC("water")            -> string "<svg ...>...</svg>"
 *                   FIC("water", 18)        -> ukuran 18px
 *                   FIC.hydrate(container)  -> hidrasi [data-ic] di node baru.
 *
 * Stroke-based, viewBox 24, currentColor -> warna ikut teks / var(--accent) dsb.
 * ========================================================================== */
(function () {
  var P = {
    // -- status / UI --
    check: '<path d="M5 13l4 4L19 6.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    warn: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 16.6h.01"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.2v4.8M12 8h.01"/>',
    edit: '<path d="M4 20h4L18.5 9.5l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-.6 4"/><path d="M20 5v6h-6"/>',
    exit: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
    chart: '<path d="M4 4v16h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4.2 7l7.8 6 7.8-6"/>',
    attach: '<path d="M18 9l-7 7a3 3 0 1 1-4-4l7.5-7.5a2 2 0 1 1 3 3L10 15"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    sort: '<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>',
    external: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M18 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4.5"/>',
    ban: '<circle cx="12" cy="12" r="8.5"/><path d="M6.2 6.2l11.6 11.6"/>',
    lightning: '<path d="M13 3L5 13h5l-1 8 8-11h-5z"/>',
    spark: '<path d="M12 3.5l1.7 4.8L18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z"/>',
    fire: '<path d="M12 3c3 3 4.5 5.6 4.5 8.6A4.5 4.5 0 0 1 7.5 12C7.5 9.2 9 7.5 9 7.5s.5 2 1.6 2C11.7 9.5 12 6.4 12 3z"/>',
    heart: '<path d="M12 20S3.5 14.5 3.5 8.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8.5 1.8C20.5 14.5 12 20 12 20z"/>',
    building: '<rect x="5.5" y="3.5" width="13" height="17" rx="1.5"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 20v-3h4v3"/>',
    medal: '<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 9.5L6.5 3.5h11l-2 6"/><path d="M12 12.2l.9 1.9 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
    // -- fitness / activity --
    run: '<path d="M3 12h3.5l2 5 4-11 2.2 6H21"/>',
    swim: '<circle cx="8" cy="7.5" r="1.7"/><path d="M3 15.5c1.8-1.8 3.2-1.8 5 0s3.2 1.8 5 0 3.2-1.8 5 0M6.5 12l4-2.5 3 2.5"/>',
    cycle: '<circle cx="6" cy="16.5" r="3.3"/><circle cx="18" cy="16.5" r="3.3"/><path d="M6 16.5l4.5-6.5h4.5l3 6.5M9.5 10h4M14 10l-1.5-3"/>',
    dumbbell: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
    walk: '<circle cx="12.5" cy="4.5" r="1.7"/><path d="M12.5 8l-2 4.5 2.5 2.5.5 5M10.5 12.5L8 14M12.5 8l3 1.5"/>',
    rest: '<path d="M4 12.5V19M20 12.5V19M4 16h16M5.5 12.5a2.5 2.5 0 0 1 2.5-2.5h8a2.5 2.5 0 0 1 2.5 2.5V16h-13z"/>',
    breathe: '<path d="M3 9h9a2.5 2.5 0 1 0-2.5-2.5M3 13h13a2.5 2.5 0 1 1-2.5 2.5M3 17h7"/>',
    moon: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.3 6.3 0 0 0 9.5 9.5z"/>',
    sun: '<circle cx="12" cy="12" r="4.3"/><path d="M12 2.5v2.4M12 19.1v2.4M4.5 4.5l1.7 1.7M17.8 17.8l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.5 19.5l1.7-1.7M17.8 6.2l1.7-1.7"/>',
    sunrise: '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 3v5.5M8.7 6.3L12 3l3.3 3.3"/><path d="M2 14l1.8.8M22 14l-1.8.8M3 21h18"/>',
    cookie: '<circle cx="12" cy="12" r="8.5"/><circle cx="9.5" cy="10" r=".9"/><circle cx="14.2" cy="9.6" r=".9"/><circle cx="13" cy="14.4" r=".9"/><circle cx="9" cy="14" r=".9"/>',
    water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    steps: '<path d="M6.5 4C5 4 4 5.6 4 7.7s1 3.8 2.5 3.8S9 9.6 9 7.5 8 4 6.5 4z"/><path d="M16.5 9c-1.5 0-2.5 1.6-2.5 3.7s1 3.8 2.5 3.8 2.5-1.9 2.5-4S18 9 16.5 9z"/><path d="M4.5 14.5c0 1.5.8 2.2 2 2.2M14 19.5c0 1.5.8 2.2 2 2.2"/>',
    // -- mood --
    'mood-good': '<circle cx="12" cy="12" r="8.5"/><path d="M8.4 14s1.3 2 3.6 2 3.6-2 3.6-2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'mood-ok': '<circle cx="12" cy="12" r="8.5"/><path d="M8.6 14.6h6.8"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    'mood-bad': '<circle cx="12" cy="12" r="8.5"/><path d="M8.4 15.6s1.3-2 3.6-2 3.6 2 3.6 2"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    // -- drinks --
    coffee: '<path d="M5 8.5h12v4.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 9.5h2a2.4 2.4 0 0 1 0 4.8h-2"/><path d="M8 3.5v2M11 3.5v2"/>',
    tea: '<path d="M5.5 9h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5z"/><path d="M15.5 10h2.2a2 2 0 0 1 0 4h-2.2M4 21h13"/><path d="M9 4v2"/>',
    glass: '<path d="M7 4h10l-1.3 16H8.3z"/><path d="M7.4 9h9.2"/>',
    juice: '<rect x="7" y="4.5" width="10" height="15.5" rx="1.5"/><path d="M9 4.5l1-2h4l1 2M10 9.5h4"/>',
    soda: '<path d="M7.5 4h9l-1 16h-7z"/><path d="M7.6 8.5h8.8M11 4V2h2v2"/>',
    // -- food groups (generik per grup) --
    meal: '<path d="M6 3v7a2 2 0 0 0 2 2M6 3v6M8 3v6M8 12v9M16.5 3c-1.4 0-2.4 2-2.4 4.6S15 12 16.5 12v9"/>',
    protein: '<path d="M15.5 4.5a4.2 4.2 0 0 1 4 4.2 3.2 3.2 0 0 1-3.3 3.2c-.6 2-2.5 3.4-4.7 3.4a4.6 4.6 0 1 1 .3-9.2c.4-1 1.6-1.6 3.7-1.6z"/><path d="M11 12l-4.5 4.5M6.5 16.5L4.5 17l.5-2z"/>',
    fish: '<path d="M3.5 12c4-5 10.5-5 13.5 0-3 5-9.5 5-13.5 0z"/><path d="M17 12l4-3v6z"/><path d="M7.5 11.4h.01"/>',
    egg: '<path d="M12 3.5c3.6 0 6 5.6 6 9.4a6 6 0 0 1-12 0c0-3.8 2.4-9.4 6-9.4z"/>',
    veg: '<path d="M5 19c0-7.5 6-13 14-13 0 7.5-6 13-14 13z"/><path d="M5.5 18.5C9 15 12 12 15.5 9.5"/>',
    fruit: '<path d="M12 8.5c-1-2-4-2.6-5.6-1C4.5 9 4.5 13.5 6.5 16.5s3.7 3.7 5.5 3.7 3.5-.7 5.5-3.7 2-7.5.4-9c-1.6-1.6-4.6-1-5.4 1z"/><path d="M12 8.5V6c0-1.2 1-2.2 2.3-2.2"/>',
    dairy: '<path d="M8 3h8l-.5 4-1 .8V20a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7.8l-1-.8z"/><path d="M8 7h8"/>',
    grain: '<path d="M12 21V8"/><path d="M12 12c-2.4 0-3.5-1.5-3.5-3.5C11 8.5 12 10 12 12zM12 12c2.4 0 3.5-1.5 3.5-3.5C13 8.5 12 10 12 12zM12 16c-2.4 0-3.5-1.5-3.5-3.5C11 12.5 12 14 12 16zM12 16c2.4 0 3.5-1.5 3.5-3.5C13 12.5 12 14 12 16z"/>'
  };
  var NS = 'http://www.w3.org/2000/svg';
  function svg(name, size) {
    size = size || 20;
    var inner = P[name];
    if (inner == null) inner = '<circle cx="12" cy="12" r="2.5"/>'; // fallback: titik netral
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="fic-svg" style="vertical-align:middle;display:inline-block" aria-hidden="true">' + inner + '</svg>';
  }
  function hydrate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var list = scope.querySelectorAll('[data-ic]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.getAttribute('data-ic-done') === '1') continue;
      el.setAttribute('data-ic-done', '1');
      var sz = parseInt(el.getAttribute('data-ic-size'), 10);
      el.innerHTML = svg(el.getAttribute('data-ic'), isFinite(sz) ? sz : undefined);
    }
  }
  svg.hydrate = hydrate;
  svg.has = function (n) { return Object.prototype.hasOwnProperty.call(P, n); };
  window.FIC = svg;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { hydrate(); });
  else hydrate();
})();
