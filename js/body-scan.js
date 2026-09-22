/* body-scan.js — pembaca hasil timbangan Visbody, dipakai bersama beberapa halaman.
 *
 * SATU SUMBER (CLAUDE.md §2): /body-scan, /activity, dan /calories sama-sama lewat sini,
 * jadi tidak ada tiga salinan query yang bisa berbeda.
 *
 * Dibaca LANGSUNG dari Supabase dengan JWT user. RLS tabelnya select-own-row, jadi
 * user tidak bisa melihat scan orang lain walau mencoba.
 *
 * Pakai:  var s = await BodyScan.latest();     // baris terakhir | null
 *         var n = await BodyScan.count();      // jumlah scan
 * Hasilnya di-cache per halaman: /activity memanggilnya dari dua tempat.
 */
(function () {
  "use strict";

  var FIELDS = "scan_id,scanned_at,body_weight,body_fat_percentage,body_fat_mass," +
    "muscle_mass,skeletal_muscle,fat_free_mass,basal_metabolic_rate,metabolic_age," +
    "body_mass_index,visceral_fat_grade,body_composition_score";

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

  function latest() { return load().then(function (c) { return c.list[0] || null; }); }
  function all() { return load().then(function (c) { return c.list; }); }
  function count() { return load().then(function (c) { return c.list.length; }); }

  // Selisih ke scan sebelumnya — dipakai kartu ringkas di /activity.
  function latestWithPrev() {
    return load().then(function (c) {
      return { now: c.list[0] || null, prev: c.list[1] || null };
    });
  }

  window.BodyScan = { latest: latest, all: all, count: count, latestWithPrev: latestWithPrev };
})();
