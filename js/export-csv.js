// =============================================================
//  export-csv.js — Export data tabel (hasil filter aktif) ke CSV.
//  File TERPISAH dari export-pdf.js. Tanpa dependency (vanilla).
//  API: AdminExport.csv(columns, rows, opts)
//    columns = [{ key, label, value?(row) }]   (value opsional utk kolom turunan)
//    rows    = array objek
//    opts    = { filename }
// =============================================================
(function () {
  window.AdminExport = window.AdminExport || {};

  function esc(v) {
    if (v == null) return "";
    var s = String(v);
    // Kutip kalau ada koma/kutip/newline; kutip ganda di-escape jadi dobel.
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function cell(col, row) {
    return typeof col.value === "function" ? col.value(row) : row[col.key];
  }
  function download(filename, text) {
    // BOM (﻿) supaya Excel membaca UTF-8 dengan benar.
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename || "export.csv";
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
  }

  AdminExport.csv = function (columns, rows, opts) {
    opts = opts || {};
    var header = columns.map(function (c) { return esc(c.label); }).join(",");
    var lines = (rows || []).map(function (r) {
      return columns.map(function (c) { return esc(cell(c, r)); }).join(",");
    });
    download(opts.filename || "export.csv", [header].concat(lines).join("\r\n"));
  };
})();
