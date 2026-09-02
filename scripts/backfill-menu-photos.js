#!/usr/bin/env node
// backfill-menu-photos.js — pre-warm foto AI (gaya Indonesia) utk SEMUA resep resmi 20FIT.
//
// Tanpa skrip ini, foto AI baru ter-generate LAZY per-resep pas ada pengunjung pertama yang
// buka kartunya (lihat FoodImage.tsx di repo MENU) — jadi pengunjung pertama tiap resep akan
// lihat placeholder emoji sebentar. Skrip ini memanggil endpoint publik /api/menu/photo untuk
// SEMUA ~120 resep sekaligus, satu per satu, supaya cache-nya (tabel my20fit_foodimg + Supabase
// Storage) sudah terisi sebelum ada pengunjung.
//
// JALANKAN SETELAH deploy server.js yang sudah punya langkah 0 (AI) di /api/menu/photo, DAN
// setelah OPENROUTER_API_KEY di-set di Supabase Edge Function secrets (bukan di sini — skrip ini
// TIDAK butuh secret apa pun, cuma HTTP request biasa ke server yang sudah deploy).
//
// Pakai:
//   node scripts/backfill-menu-photos.js [base-url]
//   BASE_URL default: https://my.20fit.id (override lewat argumen atau env MENU_PHOTO_BASE_URL)
//
// Aman dijalankan berkali-kali: id yang sudah pernah sukses di-generate AI otomatis di-skip
// server-side (cache hit -> tidak generate ulang, tidak menambah biaya).

const BASE_URL = process.argv[2] || process.env.MENU_PHOTO_BASE_URL || "https://my.20fit.id";
const DELAY_MS = parseInt(process.env.BACKFILL_DELAY_MS || "2000", 10); // jeda antar-request

function loadCatalog() {
  const mod = require("../js/recipes.js");
  return (mod && Array.isArray(mod.LIST)) ? mod.LIST : [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOne(rec) {
  const name = (rec.nm && (rec.nm.en || rec.nm.id)) || rec.id;
  const mdb = rec.q || "";
  const url =
    BASE_URL.replace(/\/+$/, "") + "/api/menu/photo" +
    "?id=" + encodeURIComponent(rec.id) +
    "&q=" + encodeURIComponent(name) +
    "&mdb=" + encodeURIComponent(mdb);
  try {
    const r = await fetch(url);
    const j = await r.json().catch(() => ({}));
    return { id: rec.id, name, ok: !!(j && j.ok), source: j && j.source, cached: !!(j && j.cached) };
  } catch (e) {
    return { id: rec.id, name, ok: false, error: e.message };
  }
}

async function main() {
  const list = loadCatalog();
  if (!list.length) {
    console.error("Katalog kosong / js/recipes.js gagal dibaca. Berhenti.");
    process.exit(1);
  }
  console.log(`Backfill foto utk ${list.length} resep resmi -> ${BASE_URL} (jeda ${DELAY_MS}ms/request)\n`);

  const tally = { ai: 0, pexels: 0, themealdb: 0, none: 0, error: 0 };
  for (let i = 0; i < list.length; i++) {
    const rec = list[i];
    const res = await fetchOne(rec);
    const tag = res.ok ? (res.cached ? `cached:${res.source}` : res.source) : (res.error ? "error" : "none");
    console.log(`[${i + 1}/${list.length}] ${rec.id.padEnd(24)} ${res.ok ? "✅" : "⚠️ "} ${tag}`);
    if (res.error) tally.error++;
    else if (!res.ok) tally.none++;
    else if (res.source === "ai") tally.ai++;
    else if (res.source === "pexels") tally.pexels++;
    else if (res.source === "themealdb") tally.themealdb++;
    if (i < list.length - 1) await sleep(DELAY_MS);
  }

  console.log("\nSelesai. Ringkasan sumber foto:");
  console.log(`  AI (gaya Indonesia): ${tally.ai}`);
  console.log(`  Pexels (fallback):   ${tally.pexels}`);
  console.log(`  TheMealDB (fallback):${tally.themealdb}`);
  console.log(`  Tidak dapat foto:    ${tally.none}`);
  console.log(`  Error request:       ${tally.error}`);
}

main();
