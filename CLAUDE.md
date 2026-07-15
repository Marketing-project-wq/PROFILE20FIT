# CLAUDE.md — Panduan kerja untuk agent di repo PROFILE20FIT (my.20fit.id)

Aturan tetap di bawah ini WAJIB diikuti setiap sesi. Ditulis dari instruksi
pemilik proyek (zidni@20fit.id). Kalau ragu, ikuti file ini.

## 1. Alur deploy — STAGING DULU, JANGAN LANGSUNG PRODUCTION
- Kerja di branch fitur (mis. `claude/auto-payment-success`), JANGAN commit
  langsung ke `main`.
- Urutan wajib: **branch fitur → PR ke `staging` → merge → PR `staging` ke
  `main` → merge**.
- JANGAN pernah merge langsung ke `main` tanpa lewat `staging` lebih dulu.
- Railway auto-deploy per branch: `main` = production (my.20fit.id),
  `staging` = lingkungan staging.
- Tunggu CI hijau (secret-scan + cek sintaks) sebelum tiap merge.
- JANGAN rewrite history yang sudah ke-merge.

## 2. Ganti kode lama dengan yang baru — jangan sisakan dead code
- Saat mengganti sistem/fitur (contoh nyata: Xendit → SingaPay), HAPUS kode
  lama sepenuhnya, jangan biarkan cabang/handler lama menganggur.
- Satu sumber kebenaran; hindari duplikasi logika.

## 3. Rahasia = env only, JANGAN pernah di-commit
- Semua kredensial (SingaPay, Supabase service key, ADMIN_KEY, SMTP, Meta CAPI,
  dst.) hanya lewat **Railway Variables** / env. Tidak ada nilai rahasia di
  kode, commit, PR, atau komentar.
- CI menegakkan ini: `.gitleaks.toml` + `.github/workflows/secret-scan.yml`
  (gitleaks + `node --check server.js`).
- Agent tidak bisa set env Railway sendiri — minta pemilik yang mengisi.

## 4. Supabase dipakai bareng banyak app — namespace `my20fit_*`
- Project Supabase `cpvzwqptzcxnwzfzgrmt` ("20FIT ALL DATA") berisi ratusan
  tabel milik app lain. HANYA sentuh tabel berawalan `my20fit_*`.
- Tabel seperti `vouchers`, `admin_users`, `super_admins` (tanpa prefix) milik
  app lain — JANGAN diubah.
- RLS deny-public; akses admin ditegakkan di server (service key bypass RLS).

## 5. Stack — jangan tambah framework baru
- Frontend: vanilla HTML/CSS/JS (tanpa React/Next). Chart pakai inline SVG.
- Backend: Node/Express (`server.js`). DB/Auth: Supabase. Deploy: Railway.

## 6. Tugas multi-step besar — checkpoint per step
- Untuk pekerjaan bertahap (mis. admin dashboard), selesaikan per step,
  tunjukkan hasilnya, jeda sebelum lanjut — kecuali pemilik minta lanjut semua.

## 7. Verifikasi sebelum push
- `node --check server.js` untuk backend.
- Cek sintaks inline JS untuk file HTML yang diubah.

## Code & Git Hygiene Rules
- Setiap kali mengerjakan perintah yang menggantikan fungsi/komponen/logic lama
  dengan yang baru: kode lama WAJIB dihapus, bukan dibiarkan nganggur di file
  (baik dikomentari, di-disable, atau ditinggal tanpa dipanggil). Tidak boleh
  ada dead code, unused import, unused variable/function, atau file yang sudah
  tidak dipakai tersisa di repo setelah sebuah task selesai.
- Sebelum menandai sebuah task selesai, jalankan pengecekan unused code
  (linter/type-checker yang tersedia di project ini, misalnya eslint/tsc/ts-prune
  atau tool setara sesuai stack project) dan pastikan tidak ada warning terkait
  unused code yang berasal dari perubahan yang baru dibuat.
- Kalau ada kode lama yang digantikan tapi masih dipakai di tempat lain (shared
  function, dsb), jangan hapus asal-asalan — cek seluruh referensi/usage dulu
  (grep/search across repo), pastikan tidak ada pemanggil lain yang akan rusak,
  baru hapus atau refactor referensinya.
- Kalau ragu apakah suatu kode masih dipakai atau tidak (misalnya dipanggil
  dinamis, dipakai di test, atau dipakai eksternal), jangan langsung hapus —
  laporkan ke saya dulu sebelum menghapus.
- Jangan tinggalkan file/folder sisa hasil eksperimen (contoh: file_backup.js,
  component_old.tsx, .bak, temporary test file) di dalam repo. Kalau perlu
  menyimpan versi lama untuk referensi, itu tugas git history, bukan tugas
  menumpuk file di working tree.
- Commit yang dihasilkan harus fokus dan rapi: satu perubahan logis per commit
  sebisa mungkin, commit message jelas menjelaskan apa yang diganti dan kenapa
  (contoh: "Replace Singpay payment flow with Xendit product-id based flow,
  remove unused Singpay integration files"). Hindari commit besar bercampur
  banyak perubahan tidak berhubungan.
- Jangan commit file yang seharusnya di-ignore (build artifact, .env,
  node_modules, dsb) — cek .gitignore relevan sudah mencakup itu.
- Sebelum membuat branch/commit baru, jalankan `git status` untuk pastikan tidak
  ada file nyasar/untracked yang tidak sengaja ikut ter-commit.
- Setiap selesai satu task, berikan ringkasan singkat ke saya: file apa saja
  yang dihapus, file apa saja yang baru dibuat, dan file apa saja yang
  dimodifikasi — supaya saya bisa review dengan cepat sebelum merge.

## Konteks penting
- Login app 20FIT lewat API FITCO (`Auth.fitcoLogin`), fallback ke password
  Supabase (`Auth.signIn`). Admin dashboard pakai password Supabase; login juga
  fallback ke FITCO. `Auth.ready` adalah **Promise** (pakai `await Auth.ready`,
  bukan `Auth.ready()`).
- Pembayaran: **20FIT retail shop-order** (`POST {FITCO_API}/api/v1/third-party/shop/order`
  dengan `payment: { payment_type: "xendit-invoices" }`) — 20FIT yang jadi
  merchant Xendit & membuat invoice; auth pakai `FITCO_PARTNER_TOKEN` (env).
  Kredit server-authoritative saat `/api/scan/order-status` melihat order 20FIT
  `is_paid` → `creditScanOrder` → `my20fit_scan_orders` →
  `my20fit_profile.scan_credits`. Sisa webhook SingaPay masih ada sementara
  (grace period) hanya untuk settle order pending lama.
- Admin dashboard: `/admin-dashboard` (RBAC superadmin/staff/viewer di
  `my20fit_admin_roles`); `/admin` redirect ke sana. Master key = env
  `ADMIN_KEY` (+ `ADMIN_KEY_2` cadangan utk rotasi tanpa downtime).
