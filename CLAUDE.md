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
- Saat mengganti sistem/fitur (contoh nyata: SingaPay → Xendit), HAPUS kode
  lama sepenuhnya, jangan biarkan cabang/handler lama menganggur.
- Satu sumber kebenaran; hindari duplikasi logika.

## 3. Rahasia = env only, JANGAN pernah di-commit
- Semua kredensial (Xendit, Supabase service key, ADMIN_KEY, SMTP, Meta CAPI,
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

## 8. Code & Git Hygiene Rules
(Perluasan dari §2. Berlaku permanen untuk SEMUA pekerjaan ke depan.)
- Setiap kali mengerjakan perintah yang menggantikan fungsi/komponen/logic lama
  dengan yang baru: kode lama WAJIB dihapus, bukan dibiarkan nganggur di file
  (dikomentari, di-disable, atau ditinggal tanpa dipanggil). Tidak boleh ada
  dead code, unused import, unused variable/function, atau file yang sudah tidak
  dipakai tersisa di repo setelah sebuah task selesai.
- Sebelum menandai task selesai, jalankan pengecekan yang tersedia di stack ini:
  `node --check server.js` + cek sintaks inline JS tiap HTML yang diubah, dan
  grep referensi simbol/fungsi yang dihapus untuk memastikan tak ada unused
  code sisa perubahan. (Stack vanilla JS — tak ada bundler/linter. Kalau nanti
  perlu, boleh setup checker ringan mis. `eslint` rule `no-unused-vars`.)
- Kalau kode lama yang digantikan masih dipakai di tempat lain (shared function
  dsb), JANGAN hapus asal — cek seluruh referensi/usage lintas repo (grep) dulu,
  pastikan tak ada pemanggil lain yang rusak, baru hapus/refactor referensinya.
- Kalau ragu suatu kode masih dipakai (dipanggil dinamis, dipakai di test, atau
  eksternal), JANGAN langsung hapus — laporkan ke pemilik dulu sebelum menghapus.
- Jangan tinggalkan file/folder sisa eksperimen (`*_backup.js`, `*_old.html`,
  `.bak`, file test sementara). Versi lama itu tugas git history, bukan menumpuk
  file di working tree.
- Commit fokus & rapi: satu perubahan logis per commit sebisa mungkin; pesan
  commit jelas menerangkan apa yang diganti dan kenapa. Hindari commit besar
  bercampur banyak perubahan tak berhubungan.
- Jangan commit file yang seharusnya di-ignore (build artifact, `.env`,
  `node_modules`, dst.) — pastikan `.gitignore` mencakupnya.
- Sebelum bikin branch/commit baru, jalankan `git status` untuk pastikan tak ada
  file nyasar/untracked yang ikut ter-commit.
- Setiap selesai satu task, beri ringkasan singkat ke pemilik: file apa saja
  yang DIHAPUS, DIBUAT, dan DIMODIFIKASI — supaya cepat di-review sebelum merge.

## Konteks penting
- Login app 20FIT lewat API FITCO (`Auth.fitcoLogin`), fallback ke password
  Supabase (`Auth.signIn`). Admin dashboard pakai password Supabase; login juga
  fallback ke FITCO. `Auth.ready` adalah **Promise** (pakai `await Auth.ready`,
  bukan `Auth.ready()`).
- Pembayaran: **Xendit via API 20FIT, bukan Xendit langsung.** Kita POST
  `/api/v1/third-party/shop/order` (`payment_type:"xendit-invoices"`); **20FIT** yang
  menerbitkan invoice & balik `checkout.xendit.co`. Jangan panggil Xendit langsung: akun
  Xendit dipakai bersama photo.20fit.id + app utama, dan webhook invoice **ACCOUNT-GLOBAL**
  → callback "paid" SELALU ke backend 20FIT, **tidak pernah ke my.20fit.id**.
- **TIDAK ADA webhook di sisi kita.** (Baris lama di sini menyebut webhook
  `x-callback-token` — itu KELIRU dan sudah menyesatkan perbaikan sebelumnya.) Kredit
  masuk lewat: (a) polling `/api/scan/order-status` dari browser, dan (b) sapuan server
  `/api/scan/reconcile` (order pending user diambil dari DB by `auth_user_id`, bukan
  localStorage) — (b) yang menyelamatkan pembayaran lintas-device. Keduanya idempoten
  lewat RPC `my20fit_credit_scan` (`my20fit_scan_orders` → `my20fit_profile.scan_credits`).
- **`success_redirect_url` invoice DI LUAR kendali kita** — di-set backend 20FIT ke platform
  EVENT mereka; `shop/order` tidak menerima parameter redirect. Jadi setelah bayar user
  TIDAK kembali ke my.20fit.id. JANGAN bangun logika kredit di atas asumsi user kembali,
  dan JANGAN navigasi tab app ke link Xendit (tab itu harus hidup untuk polling).
  Mengubah ini butuh perubahan di backend 20FIT, bukan di repo ini.
- Admin dashboard: `/admin-dashboard` (RBAC superadmin/staff/viewer di
  `my20fit_admin_roles`); `/admin` redirect ke sana. `ADMIN_KEY` = master key
  superadmin opsional.
