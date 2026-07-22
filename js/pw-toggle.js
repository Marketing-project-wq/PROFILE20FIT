// =============================================================
//  pw-toggle.js — Tombol MATA (show/hide) untuk semua input password.
//  Vanilla, tanpa dependency. Cukup sisipkan:
//     <script src="js/pw-toggle.js"></script>
//  di halaman yang punya <input type="password">. Script ini auto-wire
//  SEMUA field password: bungkus tiap input, tempel tombol mata di ujung
//  kanan, dan toggle type password<->text saat diklik.
//
//  TIDAK mengubah logika form/login apa pun — murni UI. Default: password
//  TERSEMBUNYI (ikon mata-dicoret). Klik -> teks kelihatan (ikon mata-kebuka).
//  Ikon = inline SVG (gaya stroke sama dgn ikon app lain, mis. nav.js).
// =============================================================
(function () {
  // Mata KEBUKA = password lagi KELIHATAN.
  var EYE =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  // Mata DICORET = password lagi DISEMBUNYIIN.
  var EYE_OFF =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';

  function injectCSS() {
    if (document.getElementById("pweye-css")) return;
    var s = document.createElement("style");
    s.id = "pweye-css";
    s.textContent =
      ".pweye-wrap{position:relative;display:block}" +
      // Tombol menutupi tinggi penuh field (min 40px) -> area tap besar utk HP.
      ".pweye{position:absolute;top:0;right:0;height:100%;min-height:40px;width:46px;" +
      "display:flex;align-items:center;justify-content:center;background:none;border:0;" +
      "padding:0;margin:0;cursor:pointer;color:var(--muted,#8A8D94);" +
      "-webkit-tap-highlight-color:transparent}" +
      ".pweye:hover{color:var(--red,#C41101)}" +
      ".pweye svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:2;" +
      "stroke-linecap:round;stroke-linejoin:round;pointer-events:none}";
    document.head.appendChild(s);
  }

  function wire(inp) {
    if (!inp || inp.dataset.pweye === "1" || inp.type !== "password") return;
    inp.dataset.pweye = "1";

    // Bungkus input dalam wrapper relative (tanpa mengubah alur/handler input).
    var wrap = document.createElement("span");
    wrap.className = "pweye-wrap";
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    inp.style.paddingRight = "46px"; // ruang buat ikon

    var btn = document.createElement("button");
    btn.type = "button"; // BUKAN submit -> tak trigger form
    btn.className = "pweye";
    btn.tabIndex = -1; // jangan ganggu urutan tab form
    btn.setAttribute("aria-label", "Tampilkan atau sembunyikan password");
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = EYE_OFF; // default: tersembunyi

    // Cegah blur input saat tombol ditekan (caret & fokus tetap).
    btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
    btn.addEventListener("click", function () {
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      btn.innerHTML = show ? EYE : EYE_OFF;
      btn.setAttribute("aria-pressed", show ? "true" : "false");
    });

    wrap.appendChild(btn);
  }

  function init() {
    injectCSS();
    var list = document.querySelectorAll('input[type="password"]');
    for (var i = 0; i < list.length; i++) wire(list[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
