/* receipt.js — BON (e-receipt) 20FIT: tampilan di layar + file PDF, SATU modul yang TERKUNCI.
 *
 * Permintaan pemilik: desain & fitur bon di-hardcode supaya perubahan di bagian lain (design system
 * css/*.css, token --fit-*, glass-app, dark mode, kelas global seperti .badge/.btn/.pm) TIDAK ikut
 * mengubah bon. Karena itu:
 *   - Semua warna, font, ukuran, jarak ada DI FILE INI (konstanta di bawah), tidak membaca var(--...).
 *   - Tampilan layar dirender di Shadow DOM (`:host{all:initial}`) -> CSS halaman tidak bisa masuk.
 *   - PDF dibuat di browser tanpa library (PDF 1.4, Helvetica standar, teks WinAnsi; karakter di luar itu jadi "?").
 *   - Bon selalu "kertas putih" (tidak ikut dark mode), sama dengan PDF-nya.
 * Mengubah bon = mengubah file ini saja.
 *
 * Bentuk mengikuti e-receipt gaya Grab: pita merah (jenis transaksi, logo 20FIT, judul, kode & tanggal),
 * Total besar, "Rincian" harga, "Detail" transaksi, catatan kaki.
 *
 * Pakai:  Receipt.open(data, { filename, labels:{pdf, rate, close}, onRate })   // tampilkan bon
 *         Receipt.download(data, "bon-20fit-XXX.pdf")                         // unduh PDF saja
 *   data = { kind, headline, sub:[..], status, statusCls (paid|pending|cancelled|expired), totalHd, total,
 *            items:[{name,desc,amt}], lines:[{k,v,disc,bold}], meta:[[k,v,mono]], foot:[..], sections:{rincian,detail} }
 *   Semua teks sudah dalam bahasa aktif & angka uang sudah berupa teks (mis. "Rp 300.000").
 */
(function () {
  "use strict";

  // Lebar glyph Helvetica / Helvetica-Bold (AFM standar, satuan 1/1000 em) untuk ASCII 32..126.
  var W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  var W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
  // Karakter non-ASCII yang dipakai bon -> kode WinAnsi + lebar.
  var WIN = { "×": [0xd7, 584], "–": [0x96, 556], "—": [0x97, 1000], "·": [0xb7, 278], "•": [0x95, 350],
    "−": [0x2d, 333], "é": [0xe9, 556], "’": [0x92, 222], "‘": [0x91, 222], "…": [0x85, 1000], " ": [0x20, 278] };

  function enc(s) {
    var out = "";
    String(s == null ? "" : s).split("").forEach(function (ch) {
      var c = ch.charCodeAt(0);
      if (c >= 32 && c <= 126) out += ch;
      else if (WIN[ch]) out += String.fromCharCode(WIN[ch][0]);
      else out += "?";
    });
    return out;
  }
  function width(s, size, bold) {
    var tbl = bold ? W_BOLD : W_REG, w = 0;
    String(s == null ? "" : s).split("").forEach(function (ch) {
      var c = ch.charCodeAt(0);
      w += (c >= 32 && c <= 126) ? tbl[c - 32] : (WIN[ch] ? WIN[ch][1] : 556);
    });
    return w * size / 1000;
  }
  function wrap(s, size, bold, maxW) {
    var words = String(s == null ? "" : s).split(/\s+/).filter(Boolean), lines = [], cur = "";
    words.forEach(function (wd) {
      var t = cur ? cur + " " + wd : wd;
      if (width(t, size, bold) <= maxW || !cur) cur = t; else { lines.push(cur); cur = wd; }
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }
  function esc(s) { return enc(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(function (v) { return v.toFixed(3); }).join(" "); }

  var PAGE_W = 420, M = 28, CW = PAGE_W - 2 * M;
  // Palet bon — dipakai tampilan layar DAN PDF (satu sumber). Sengaja tidak memakai token design system.
  var RED = "#E4002B", RED_DARK = "#A8001F", RED_SOFT = "#F2546F", INK = "#15171C", MUTED = "#7A7D85", LINE = "#E3E1DC",
    GREEN = "#1B7A4D", GREEN_BG = "#E3F3EA", AMBER = "#9A5D12", AMBER_BG = "#FBEEDC", GREY_BG = "#EFEEEB", PAPER = "#FFFFFF";
  var FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

  // Tata letak dari atas (y bertambah ke bawah); dikonversi ke koordinat PDF setelah tinggi halaman diketahui.
  function layout(d) {
    var ops = [], y = 0;
    function text(x, yy, s, size, bold, color, align) {
      var w = width(s, size, bold), xx = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
      ops.push({ t: "text", x: xx, y: yy, s: s, size: size, bold: bold, color: color || INK });
    }
    function rect(x, yy, w, h, color) { ops.push({ t: "rect", x: x, y: yy, w: w, h: h, color: color }); }
    function line(x1, yy, x2, color, lw, dash) { ops.push({ t: "line", x1: x1, y: yy, x2: x2, color: color || LINE, lw: lw || 0.8, dash: dash }); }
    function circle(cx, cy, r, color) { ops.push({ t: "circle", x: cx, y: cy, r: r, color: color }); }
    function clip(x, yy, w, h) { ops.push({ t: "clip", x: x, y: yy, w: w, h: h }); }
    function unclip() { ops.push({ t: "unclip" }); }

    // ---- Pita merek ----
    var hl = wrap(d.headline, 19, true, CW - 70), bandH = 70 + hl.length * 23 + (d.sub || []).length * 13 + 18;
    rect(0, 0, PAGE_W, bandH, RED);
    clip(0, 0, PAGE_W, bandH);   // lingkaran dekoratif tidak boleh keluar dari pita
    circle(PAGE_W - 30, bandH - 10, 62, RED_SOFT);
    circle(PAGE_W - 96, bandH + 8, 30, RED_SOFT);
    unclip();
    text(M, 34, d.kind, 10, true, "#FFFFFF");
    text(PAGE_W - M, 36, "20FIT", 20, true, "#FFFFFF", "right");
    y = 72;
    hl.forEach(function (l) { text(M, y, l, 19, true, "#FFFFFF"); y += 23; });
    y += 4;
    (d.sub || []).forEach(function (l) { text(M, y, l, 9, false, "#FFFFFF"); y += 13; });
    y = bandH + 34;

    // ---- Total ----
    text(M, y, d.totalHd || "Total", 11, true, MUTED);
    text(PAGE_W - M, y + 2, d.total, 22, true, INK, "right");
    y += 14; line(M, y, PAGE_W - M, RED, 1.6);
    y += 18;
    if (d.status) { text(M, y, d.status, 10, true, ({ paid: GREEN, pending: AMBER })[d.statusCls] || MUTED); y += 22; }

    // ---- Rincian ----
    text(M, y, (d.sections && d.sections.rincian) || "Rincian", 12, true, INK); y += 20;
    (d.items || []).forEach(function (it) {
      var nl = wrap(it.name, 11, true, CW - 110);
      nl.forEach(function (l, i) { text(M, y, l, 11, true, INK); if (i === 0) text(PAGE_W - M, y, it.amt, 11, true, INK, "right"); y += 14; });
      if (it.desc) wrap(it.desc, 9, false, CW - 110).forEach(function (l) { text(M, y, l, 9, false, MUTED); y += 12; });
      y += 6;
    });
    line(M, y - 4, PAGE_W - M, LINE, 0.8, true); y += 12;
    (d.lines || []).forEach(function (r) {
      text(M, y, r.k, r.bold ? 11 : 10, !!r.bold, r.disc ? GREEN : (r.bold ? INK : MUTED));
      text(PAGE_W - M, y, r.v, r.bold ? 12 : 10, true, r.disc ? GREEN : INK, "right");
      y += r.bold ? 20 : 16;
    });
    y += 8;

    // ---- Detail ----
    text(M, y, (d.sections && d.sections.detail) || "Detail", 12, true, INK); y += 20;
    (d.meta || []).forEach(function (m) {
      text(M, y, m[0], 9, false, MUTED);
      var vl = wrap(m[1], 9.5, true, CW - 130);
      vl.forEach(function (l) { text(PAGE_W - M, y, l, 9.5, true, INK, "right"); y += 13; });
      y += 3;
    });
    y += 10; line(M, y, PAGE_W - M, LINE, 0.8, true); y += 20;

    // ---- Catatan kaki ----
    (d.foot || []).forEach(function (l) { wrap(l, 8.5, false, CW).forEach(function (ll) { text(PAGE_W / 2, y, ll, 8.5, false, MUTED, "center"); y += 12; }); });
    text(PAGE_W / 2, y + 4, "my.20fit.id", 10, true, RED, "center");
    return { ops: ops, h: y + 30 };
  }

  function build(d) {
    var L = layout(d), H = Math.ceil(L.h), s = "";
    function Y(v) { return (H - v).toFixed(2); }
    L.ops.forEach(function (o) {
      if (o.t === "clip") s += "q " + o.x.toFixed(2) + " " + (H - o.y - o.h).toFixed(2) + " " + o.w.toFixed(2) + " " + o.h.toFixed(2) + " re W n\n";
      else if (o.t === "unclip") s += "Q\n";
      else if (o.t === "rect") s += rgb(o.color) + " rg " + o.x.toFixed(2) + " " + (H - o.y - o.h).toFixed(2) + " " + o.w.toFixed(2) + " " + o.h.toFixed(2) + " re f\n";
      else if (o.t === "line") s += rgb(o.color) + " RG " + o.lw + " w " + (o.dash ? "[3 3] 0 d " : "[] 0 d ") + o.x1.toFixed(2) + " " + Y(o.y) + " m " + o.x2.toFixed(2) + " " + Y(o.y) + " l S\n";
      else if (o.t === "circle") {
        var k = 0.5523 * o.r, cx = o.x, cy = H - o.y, r = o.r;
        s += rgb(o.color) + " rg " + (cx + r) + " " + cy + " m " +
          (cx + r) + " " + (cy + k) + " " + (cx + k) + " " + (cy + r) + " " + cx + " " + (cy + r) + " c " +
          (cx - k) + " " + (cy + r) + " " + (cx - r) + " " + (cy + k) + " " + (cx - r) + " " + cy + " c " +
          (cx - r) + " " + (cy - k) + " " + (cx - k) + " " + (cy - r) + " " + cx + " " + (cy - r) + " c " +
          (cx + k) + " " + (cy - r) + " " + (cx + r) + " " + (cy - k) + " " + (cx + r) + " " + cy + " c f\n";
      }
      else s += "BT " + rgb(o.color) + " rg /" + (o.bold ? "F2" : "F1") + " " + o.size + " Tf " + o.x.toFixed(2) + " " + Y(o.y) + " Td (" + esc(o.s) + ") Tj ET\n";
    });
    var objs = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PAGE_W + " " + H + "] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
      "<< /Length " + s.length + " >>\nstream\n" + s + "endstream",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      "<< /Producer (my.20fit.id) /Title (" + esc("20FIT " + (d.kind || "Receipt")) + ") >>"
    ];
    var out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
    var xref = out.length;
    out += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" + offs.map(function (n) { return ("0000000000" + n).slice(-10) + " 00000 n \n"; }).join("");
    out += "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R /Info 7 0 R >>\nstartxref\n" + xref + "\n%%EOF";
    var bytes = new Uint8Array(out.length);
    for (var i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
    return new Blob([bytes], { type: "application/pdf" });
  }

  // Unduh di tab yang sama (atribut download) — tidak membuka tab baru.
  function download(d, filename) {
    var blob = build(d), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename || "bon-20fit.pdf";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  // ---------- Tampilan di layar: Shadow DOM, gaya terkunci ----------
  function h(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var ICON = {
    x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/></svg>'
  };
  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;margin:0;padding:0}',
    '.ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,12,16,.58);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);font-family:' + FONT + ';color:' + INK + ';-webkit-font-smoothing:antialiased;line-height:1.4;font-size:14px}',
    '.sh{width:100%;max-width:430px;max-height:92vh;overflow-y:auto;padding:10px 14px calc(env(safe-area-inset-bottom) + 22px);animation:up .28s cubic-bezier(.2,.85,.25,1)}',
    '@keyframes up{from{transform:translateY(100%)}to{transform:translateY(0)}}',
    '@media (prefers-reduced-motion:reduce){.sh{animation:none}}',
    '@media (min-width:620px){.ov{align-items:center;padding:24px}.grab{display:none}}',
    '.grab{width:42px;height:5px;border-radius:999px;background:rgba(255,255,255,.55);margin:0 auto 10px}',
    '.x{position:fixed;top:14px;right:14px;width:40px;height:40px;border-radius:50%;border:0;background:' + PAPER + ';color:' + INK + ';display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.25)}',
    '.gr{background:' + PAPER + ';border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(16,18,22,.22)}',
    '.hd{position:relative;overflow:hidden;padding:18px 20px 20px;color:#fff;background:linear-gradient(135deg,' + RED + ',' + RED_DARK + ')}',
    '.hd::before,.hd::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.13);pointer-events:none}',
    '.hd::before{width:160px;height:160px;right:-46px;bottom:-70px}',
    '.hd::after{width:64px;height:64px;right:96px;bottom:-26px}',
    '.top{position:relative;display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12px;font-weight:800;letter-spacing:.3px}',
    '.logo{font-size:21px;font-weight:900;letter-spacing:.5px;line-height:1}',
    '.hl{position:relative;font-size:21px;font-weight:900;line-height:1.22;margin:16px 0 8px;max-width:80%}',
    '.sub{position:relative;font-size:12px;line-height:1.6;opacity:.93}',
    '.bd{padding:18px 20px 20px}',
    '.tot{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:10px;border-bottom:2px solid ' + RED + '}',
    '.tot .k{font-size:13px;font-weight:800;color:' + MUTED + '}',
    '.tot .v{font-size:26px;font-weight:900;line-height:1}',
    '.st{display:inline-block;margin-top:10px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;padding:3px 9px;border-radius:999px}',
    '.sec{margin-top:18px;font-size:13.5px;font-weight:900}',
    '.it{display:flex;justify-content:space-between;gap:12px;margin-top:10px}',
    '.it .n{font-size:14px;font-weight:800}',
    '.it .d{font-size:12px;color:' + MUTED + ';margin-top:2px}',
    '.it .a{font-size:14px;font-weight:800;white-space:nowrap}',
    '.ln{display:flex;justify-content:space-between;gap:12px;font-size:13px;margin-top:8px;color:' + MUTED + '}',
    '.ln .v{color:' + INK + ';font-weight:700;white-space:nowrap}',
    '.ln.disc,.ln.disc .v{color:' + GREEN + '}',
    '.ln.b{color:' + INK + ';font-size:14.5px;font-weight:900;border-top:1px dashed ' + LINE + ';padding-top:10px;margin-top:10px}',
    '.mt{display:flex;justify-content:space-between;gap:14px;font-size:12.5px;margin-top:8px}',
    '.mt .mk{color:' + MUTED + '}',
    '.mt .mv{font-weight:700;text-align:right}',
    '.mono{font-family:' + MONO + ';font-size:12px;letter-spacing:.3px}',
    '.ft{text-align:center;font-size:11.5px;color:' + MUTED + ';line-height:1.6;margin-top:18px;padding-top:14px;border-top:1px dashed ' + LINE + '}',
    '.ft b{color:' + RED + ';font-weight:900}',
    '.acts{display:flex;gap:8px;margin-top:12px}',
    '.btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:12px;border:1px solid ' + LINE + ';background:' + PAPER + ';color:' + INK + ';font-family:' + FONT + ';font-weight:800;font-size:13.5px;cursor:pointer}',
    '.btn.pri{background:' + RED + ';border-color:' + RED + ';color:#fff}',
    'button:focus-visible{outline:3px solid ' + RED_SOFT + ';outline-offset:2px}'
  ].join("\n");

  var host = null, root = null, prevFocus = null;
  function onKey(e) { if (e.key === "Escape") close(); }
  function close() {
    if (!root) return;
    root.innerHTML = "";
    document.removeEventListener("keydown", onKey);
    if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) {}
  }
  function open(d, opts) {
    opts = opts || {}; var lb = opts.labels || {};
    if (!host) { host = document.createElement("div"); host.id = "receipt20"; document.body.appendChild(host); root = host.attachShadow({ mode: "open" }); }
    var st = ({ paid: [GREEN, GREEN_BG], pending: [AMBER, AMBER_BG] })[d.statusCls] || [MUTED, GREY_BG];
    var x = '<div class="gr"><div class="hd"><div class="top"><span>' + h(d.kind) + '</span><span class="logo">20FIT</span></div>' +
      '<div class="hl">' + h(d.headline) + '</div><div class="sub">' + (d.sub || []).map(function (l) { return '<div>' + h(l) + '</div>'; }).join("") + '</div></div>';
    x += '<div class="bd"><div class="tot"><span class="k">' + h(d.totalHd || "Total") + '</span><span class="v">' + h(d.total) + '</span></div>';
    if (d.status) x += '<span class="st" style="color:' + st[0] + ';background:' + st[1] + '">' + h(d.status) + '</span>';
    x += '<div class="sec">' + h((d.sections && d.sections.rincian) || "Rincian") + '</div>';
    (d.items || []).forEach(function (it) { x += '<div class="it"><div><div class="n">' + h(it.name) + '</div>' + (it.desc ? '<div class="d">' + h(it.desc) + '</div>' : '') + '</div><div class="a">' + h(it.amt) + '</div></div>'; });
    (d.lines || []).forEach(function (l) { x += '<div class="ln' + (l.disc ? ' disc' : '') + (l.bold ? ' b' : '') + '"><span>' + h(l.k) + '</span><span class="v">' + h(l.v) + '</span></div>'; });
    x += '<div class="sec">' + h((d.sections && d.sections.detail) || "Detail") + '</div>';
    (d.meta || []).forEach(function (m) { x += '<div class="mt"><span class="mk">' + h(m[0]) + '</span><span class="mv' + (m[2] ? ' mono' : '') + '">' + h(m[1]) + '</span></div>'; });
    x += '<div class="ft">' + (d.foot || []).map(h).join('<br>') + '<br><b>my.20fit.id</b></div></div></div>';
    x += '<div class="acts"><button type="button" class="btn pri" data-a="pdf">' + ICON.pdf + ' ' + h(lb.pdf || "Download PDF") + '</button>' +
      (opts.onRate ? '<button type="button" class="btn" data-a="rate">' + ICON.star + ' ' + h(lb.rate || "Rate") + '</button>' : '') + '</div>';
    root.innerHTML = '<style>' + CSS + '</style><div class="ov" role="dialog" aria-modal="true" aria-label="' + h(d.kind) + '">' +
      '<button type="button" class="x" data-a="close" aria-label="' + h(lb.close || "Close") + '">' + ICON.x + '</button><div class="sh"><div class="grab"></div>' + x + '</div></div>';
    var ov = root.querySelector(".ov");
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]");
      if (!b) { if (e.target === ov) close(); return; }
      var a = b.getAttribute("data-a");
      if (a === "close") close();
      else if (a === "pdf") download(d, opts.filename);
      else if (a === "rate") { close(); opts.onRate(); }
    });
    prevFocus = document.activeElement;
    document.addEventListener("keydown", onKey);
    root.querySelector(".x").focus();
  }

  window.Receipt = { open: open, close: close, download: download, build: build };

})();
