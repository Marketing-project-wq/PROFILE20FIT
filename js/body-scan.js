/* body-scan.js — pembaca hasil timbangan Visbody, dipakai bersama beberapa halaman.
 *
 * SATU SUMBER (CLAUDE.md §2): /body-scan dan /activity sama-sama lewat sini, jadi tidak
 * ada dua salinan query yang bisa berbeda. (/calories BELUM memakainya.)
 *
 * Dibaca LANGSUNG dari Supabase dengan JWT user. RLS tabelnya select-own-row, jadi
 * user tidak bisa melihat scan orang lain walau mencoba.
 *
 * Pakai:  var s = await BodyScan.latest();          // baris terakhir | null
 *         var n = await BodyScan.count();           // jumlah scan
 *         var r = await BodyScan.detail(scanId);    // rentang acuan + status per metrik
 * Hasilnya di-cache per halaman: /activity memanggilnya dari dua tempat.
 */
(function () {
  "use strict";

  // Seluruh kolom hasil ukur KECUALI raw_data (lihat catatan di detail()). /body-scan
  // memakai semuanya; /activity cuma sebagian — satu daftar dipakai bersama supaya tidak
  // ada dua salinan yang bisa berbeda.
  var FIELDS = "scan_id,scanned_at,body_weight,body_fat_percentage,body_fat_mass," +
    "muscle_mass,skeletal_muscle,fat_free_mass,protein,total_body_water," +
    "intracellular_water,extracellular_water,extracellular_water_ratio,total_minerals," +
    "basal_metabolic_rate,metabolic_age,body_mass_index,visceral_fat_grade," +
    "waist_hip_ratio,body_composition_score,segmental_muscle_mass,segmental_fat_mass";

  var _cache = null;   // {list: [...]} setelah sukses
  var _inflight = null;

  function ready() {
    return !!(window.Auth && Auth.supabase);
  }

  // Tabelnya belum tentu ada (migration 019 dijalankan manual oleh pemilik). Kegagalan
  // karena itu TIDAK dianggap error yang perlu diteriakkan ke user — halaman pemanggil
  // cukup tidak menampilkan apa-apa, sama seperti kalau user memang belum pernah scan.
  function load() {
    if (_cache) return Promise.resolve(_cache);
    if (_inflight) return _inflight;
    if (!ready()) return Promise.resolve({ list: [], unavailable: true });
    _inflight = Auth.supabase
      .from("my20fit_visbody_body")
      .select(FIELDS)
      .order("scanned_at", { ascending: false })
      .limit(50)
      .then(function (r) {
        _inflight = null;
        if (r.error) { _cache = { list: [], unavailable: true }; return _cache; }
        _cache = { list: r.data || [], unavailable: false };
        return _cache;
      }, function () {
        _inflight = null;
        _cache = { list: [], unavailable: true };
        return _cache;
      });
    return _inflight;
  }

  // /activity cukup tahu "ada data atau tidak". /body-scan perlu membedakan KOSONG dari
  // GAGAL supaya bisa menampilkan tombol coba lagi — itu gunanya state().
  function state() { return load(); }
  function reset() { _cache = null; _inflight = null; _detail = {}; }

  function latest() { return load().then(function (c) { return c.list[0] || null; }); }
  function all() { return load().then(function (c) { return c.list; }); }
  function count() { return load().then(function (c) { return c.list.length; }); }

  // Selisih ke scan sebelumnya — dipakai kartu ringkas di /activity.
  function latestWithPrev() {
    return load().then(function (c) {
      return { now: c.list[0] || null, prev: c.list[1] || null };
    });
  }

  // ---- Rentang acuan & status per metrik ----
  // Visbody membungkus TIAP metrik begini:
  //   { name, value, unit, extra:{ status_info:{description:"Normal|Over|Under"},
  //                                reference:{low,standard,high} } }
  // Angka telanjang tidak memberi tahu member apakah 22.3% itu bagus. `extra` itulah
  // yang menjawabnya, dan selama ini sudah ikut tersimpan di kolom raw_data — cuma
  // tidak pernah dibaca.
  //
  // raw_data sengaja TIDAK dimasukkan ke FIELDS: satu baris bisa puluhan KB dan daftar
  // di atas mengambil sampai 50 baris. Jadi diambil per scan, hanya saat dibutuhkan.
  var _detail = {};   // scan_id -> {refs} | null

  function toNum(v) {
    if (v === null || v === undefined || v === "") return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }

  function extractRefs(raw) {
    var bc = raw && raw.body_composition;
    if (!bc || typeof bc !== "object") return {};
    var out = {};
    Object.keys(bc).forEach(function (k) {
      var it = bc[k];
      if (!it || typeof it !== "object") return;
      var ex = it.extra || {};
      var r = ex.reference || {};
      var st = ex.status_info && ex.status_info.description;
      var lo = toNum(r.low), hi = toNum(r.high);
      // Rentang hanya dipakai kalau masuk akal. Contoh nyata dari dokumentasi Visbody:
      // visceral_fat_grade punya standard "0" padahal low "0.90" — rentang seperti itu
      // tidak digambar, tapi statusnya tetap berguna.
      var ok = (lo !== null && hi !== null && lo < hi);
      if (st || ok) out[k] = { status: st || null, low: ok ? lo : null, high: ok ? hi : null, unit: it.unit || "" };
    });
    return out;
  }

  // Ambil `extra` untuk SATU scan. Balasannya di-cache; gagal -> {} (bukan error),
  // supaya halaman tetap menampilkan angkanya walau rentangnya tidak didapat.
  function detail(scanId) {
    if (!scanId) return Promise.resolve({});
    if (Object.prototype.hasOwnProperty.call(_detail, scanId)) return Promise.resolve(_detail[scanId]);
    if (!ready()) return Promise.resolve({});
    return Auth.supabase
      .from("my20fit_visbody_body")
      .select("raw_data")
      .eq("scan_id", scanId)
      .limit(1)
      .then(function (r) {
        var row = (!r.error && r.data && r.data[0]) || null;
        _detail[scanId] = row ? extractRefs(row.raw_data) : {};
        return _detail[scanId];
      }, function () {
        _detail[scanId] = {};
        return _detail[scanId];
      });
  }

  window.BodyScan = { latest: latest, all: all, count: count, latestWithPrev: latestWithPrev, detail: detail, state: state, reset: reset };
})();
