#!/usr/bin/env node
/* Penjaga CI: view publik dokter TIDAK boleh membocorkan admin_user_id.
 * Gagalkan build kalau ada definisi view `my20fit_doctors_public` di migration
 * yang menyebut kolom admin_user_id. Satu baris pencegahan > menemukan setelah bocor.
 *
 * Catatan keterbatasan: ini memeriksa DEFINISI di repo (supabase/migrations/*.sql).
 * Perubahan view langsung di DB (di luar repo) tak terlihat CI — lihat usulan
 * pelengkap di laporan (tes sisi-DB berkala). */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "supabase", "migrations");
let files = [];
try { files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")); }
catch (e) { console.error("check-doctors-view: tak bisa baca", dir, e.message); process.exit(1); }

const viewRe = /create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?my20fit_doctors_public\b[\s\S]*?;/gi;
const bad = [];
let sawDefinition = false;

for (const f of files) {
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  let m;
  while ((m = viewRe.exec(sql))) {
    sawDefinition = true;
    if (/\badmin_user_id\b/i.test(m[0])) {
      bad.push(f);
    }
  }
}

if (bad.length) {
  console.error("❌ my20fit_doctors_public MEMUAT admin_user_id di: " + bad.join(", "));
  console.error("   Kolom penghubung akun internal tidak boleh diekspos ke client. Hapus dari view.");
  process.exit(1);
}

if (!sawDefinition) {
  console.error("⚠️  Tidak menemukan definisi view my20fit_doctors_public di migrations — periksa apakah file-nya ada.");
  process.exit(1);
}

console.log("✅ my20fit_doctors_public bersih (tanpa admin_user_id).");
