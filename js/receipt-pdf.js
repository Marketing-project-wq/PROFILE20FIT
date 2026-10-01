/* receipt-pdf.js — bon (e-receipt) 20FIT jadi file PDF, dibuat langsung di browser tanpa library.
 *
 * Bentuk mengikuti e-receipt gaya Grab: pita warna merek di atas (jenis transaksi, logo 20FIT, judul,
 * kode & tanggal), baris Total besar, "Rincian" harga, "Detail" transaksi, catatan kaki.
 * PDF 1.4 dengan font standar Helvetica (tanpa embed) — teks di-encode WinAnsi, karakter di luar itu jadi "?".
 *
 * Pakai:  ReceiptPDF.download(data, "bon-20fit-XXX.pdf")
 *   data = { kind, headline, sub:[..], status, total, totalLabel, items:[{name,desc,amt}],
 *            lines:[{k,v,disc}], meta:[[k,v]], foot:[..], sections:{rincian,detail}, totalHd }
 *   Semua angka uang sudah berupa teks (mis. "Rp 300.000").
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
  var RED = "#E4002B", RED_SOFT = "#F2546F", INK = "#15171C", MUTED = "#7A7D85", LINE = "#E3E1DC", GREEN = "#1B7A4D";

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
    if (d.status) { text(M, y, d.status, 10, true, d.statusColor || MUTED); y += 22; }

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

  window.ReceiptPDF = { build: build, download: download };
})();
