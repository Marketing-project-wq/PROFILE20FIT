// =============================================================
//  export-pdf.js — Export data tabel (hasil filter aktif) ke PDF rapi (tabel, bukan
//  dump teks). File TERPISAH dari export-csv.js. Butuh js/vendor-jspdf.js dimuat lebih dulu.
//  API: AdminExport.pdf(columns, rows, opts)
//    columns = [{ key, label, value?(row) }]
//    rows    = array objek
//    opts    = { filename, title, subtitle, orientation }
// =============================================================
(function () {
  window.AdminExport = window.AdminExport || {};

  function cell(col, row) {
    var v = typeof col.value === "function" ? col.value(row) : row[col.key];
    return v == null ? "" : String(v);
  }

  AdminExport.pdf = function (columns, rows, opts) {
    opts = opts || {};
    if (!window.jspdf || !window.jspdf.jsPDF) { alert("Library PDF belum termuat (js/vendor-jspdf.js)."); return; }
    var doc = new window.jspdf.jsPDF({ orientation: opts.orientation || "landscape", unit: "pt", format: "a4" });

    var title = opts.title || "Export";
    var sub = opts.subtitle || "";
    doc.setFontSize(14); doc.text(title, 40, 40);
    if (sub) { doc.setFontSize(9); doc.setTextColor(120); doc.text(sub, 40, 56); doc.setTextColor(0); }

    var head = [columns.map(function (c) { return c.label; })];
    var body = (rows || []).map(function (r) {
      return columns.map(function (c) { return cell(c, r); });
    });

    doc.autoTable({
      head: head,
      body: body,
      startY: sub ? 68 : 52,
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [196, 17, 1], textColor: 255, fontStyle: "bold" }, // brand #C41101
      alternateRowStyles: { fillColor: [247, 244, 240] },
      margin: { left: 40, right: 40 },
    });

    doc.save(opts.filename || "export.pdf");
  };
})();
