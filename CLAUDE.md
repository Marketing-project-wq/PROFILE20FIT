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

## Konteks penting
- Login app 20FIT lewat API FITCO (`Auth.fitcoLogin`), fallback ke password
  Supabase (`Auth.signIn`). Admin dashboard pakai password Supabase; login juga
  fallback ke FITCO. `Auth.ready` adalah **Promise** (pakai `await Auth.ready`,
  bukan `Auth.ready()`).
- Pembayaran punya **DUA mode** (dipilih otomatis oleh `XENDIT_SECRET_KEY`):
  - **Direct Xendit (default kalau `XENDIT_SECRET_KEY` di-set) — DIREKOMENDASIKAN.** Server
    kita POST `api.xendit.co/v2/invoices` sendiri (Basic auth secret key). KITA yang set
    `success_redirect_url` → setelah bayar user **balik ke my.20fit.id + halaman asalnya**.
    Status dicek via `GET /v2/invoices/{id}` (bukan FITCO). Order di DB provider =
    `"xendit-direct"`, `payment_link_id` = invoice.id.
  - **FITCO shop/order (fallback kalau `XENDIT_SECRET_KEY` kosong).** POST
    `/api/v1/third-party/shop/order` (`payment_type:"xendit-invoices"`); **20FIT** yang
    menerbitkan invoice & balik `checkout.xendit.co`. Provider DB = `"xendit"`.
  - Catatan akun bersama: akun Xendit dipakai bareng photo.20fit.id + app utama, dan webhook
    invoice **ACCOUNT-GLOBAL** → callback "paid" SELALU ke backend 20FIT, **tak pernah ke
    my.20fit.id**. Karena itu KEDUA mode TIDAK mengandalkan webhook (lihat butir berikut).
- **TIDAK ADA webhook di sisi kita.** (Baris lama di sini menyebut webhook
  `x-callback-token` — itu KELIRU dan sudah menyesatkan perbaikan sebelumnya.) Kredit
  masuk lewat: (a) polling `/api/scan/order-status` dari browser, dan (b) sapuan server
  `/api/scan/reconcile` (order pending user diambil dari DB by `auth_user_id`, bukan
  localStorage) — (b) yang menyelamatkan pembayaran lintas-device. Keduanya idempoten
  lewat RPC `my20fit_credit_scan` (`my20fit_scan_orders` → `my20fit_profile.scan_credits`).
- **`success_redirect_url`:** di **Direct Xendit** KITA yang set (`/payment/pending?external_id=
  <reff>&return=<halaman asal>`) → user balik ke my.20fit.id lalu diarahkan ke halaman asalnya.
  Di **FITCO fallback** redirect DI LUAR kendali kita (di-set backend 20FIT ke platform EVENT;
  `shop/order` mengabaikan parameter redirect) → user tak kembali; mengubahnya butuh perubahan
  di backend 20FIT. Apa pun modenya: **JANGAN** bangun logika kredit di atas asumsi user kembali
  (kredit tetap dari polling + reconcile), dan di WebView in-app (window.open null) navigasi tab
  app ke link Xendit memang satu-satunya cara bayar — aman karena reconcile menyapu dari DB.
- Admin dashboard: `/admin-dashboard` (RBAC superadmin/staff/viewer di
  `my20fit_admin_roles`); `/admin` redirect ke sana. `ADMIN_KEY` = master key
  superadmin opsional.
