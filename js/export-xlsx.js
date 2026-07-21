// =============================================================
//  export-xlsx.js — Export data tabel (hasil filter aktif) ke .xlsx (Excel asli).
//  File TERPISAH, tanpa dependency (vanilla): membangun file OOXML .xlsx sendiri
//  lewat penulis ZIP store-only (tanpa kompresi) + CRC32. Karena .xlsx bukan teks
//  berdelimiter, TIDAK ada masalah locale/pemisah koma-vs-titikkoma — kolom selalu
//  terpisah benar di Excel manapun. Angka ditulis sebagai number, teks sebagai
//  inlineStr (mempertahankan mis. nomor HP dengan angka 0 di depan).
//  API: AdminExport.xlsx(columns, rows, opts)
//    columns = [{ key, label, value?(row) }]
//    rows    = array objek
//    opts    = { filename, sheetName }
// =============================================================
(function () {
  window.AdminExport = window.AdminExport || {};
  var enc = new TextEncoder();

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
  function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }

  // Bangun ZIP store-only (compression=0) dari [{ name, bytes }].
  function zip(files) {
    var chunks = [], central = [], offset = 0;
    files.forEach(function (f) {
      var nameBytes = enc.encode(f.name);
      var crc = crc32(f.bytes), size = f.bytes.length;
      var lh = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0));
      chunks.push(new Uint8Array(lh), nameBytes, f.bytes);
      var cd = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset));
      central.push(new Uint8Array(cd), nameBytes);
      offset += lh.length + nameBytes.length + size;
    });
    var centralStart = offset;
    var centralSize = central.reduce(function (s, a) { return s + a.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0),
      u16(files.length), u16(files.length), u32(centralSize), u32(centralStart), u16(0)));
    var all = chunks.concat(central); all.push(end);
    var total = all.reduce(function (s, a) { return s + a.length; }, 0);
    var out = new Uint8Array(total), p = 0;
    all.forEach(function (a) { out.set(a, p); p += a.length; });
    return out;
  }

  function xmlEsc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function colLetter(n) { var s = ""; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function cellVal(col, row) { return typeof col.value === "function" ? col.value(row) : row[col.key]; }

  function sheetXml(columns, rows) {
    var hcells = columns.map(function (c, ci) {
      return '<c r="' + colLetter(ci) + '1" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(c.label) + '</t></is></c>';
    }).join("");
    var body = '<row r="1">' + hcells + '</row>';
    (rows || []).forEach(function (r, ri) {
      var rn = ri + 2;
      var cells = columns.map(function (c, ci) {
        var v = cellVal(c, r), ref = colLetter(ci) + rn;
        if (typeof v === "number" && isFinite(v)) return '<c r="' + ref + '"><v>' + v + '</v></c>';
        if (v == null || v === "") return '<c r="' + ref + '"/>';
        return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
      }).join("");
      body += '<row r="' + rn + '">' + cells + '</row>';
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' + body + '</sheetData></worksheet>';
  }

  AdminExport.xlsx = function (columns, rows, opts) {
    opts = opts || {};
    var sheetName = (opts.sheetName || "Data").replace(/[\\\/\?\*\[\]:]/g, " ").slice(0, 31);
    var files = [
      { name: "[Content_Types].xml", bytes: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>') },
      { name: "_rels/.rels", bytes: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') },
      { name: "xl/workbook.xml", bytes: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + xmlEsc(sheetName) + '" sheetId="1" r:id="rId1"/></sheets></workbook>') },
      { name: "xl/_rels/workbook.xml.rels", bytes: enc.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>') },
      { name: "xl/worksheets/sheet1.xml", bytes: enc.encode(sheetXml(columns, rows)) },
    ];
    var bytes = zip(files);
    var blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = opts.filename || "export.xlsx";
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  };
})();
