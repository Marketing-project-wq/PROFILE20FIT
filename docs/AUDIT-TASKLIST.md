# Audit Arsitektur & Task List — my.20fit.id (PROFILE20FIT)

> Disusun: 2026-07-14. Tujuan: menilai fondasi teknis saat ini dan menyusun
> daftar tugas agar struktur **rapi, aman, dan scalable**, dengan fokus khusus
> pada **sistem beli kuota scan (payment)** dan **persiapan konversi ke app
> Android/iOS**. Dokumen ini adalah rencana — **belum dikerjakan**.
>
> Skala prioritas: **P0** = wajib/berisiko uang & keamanan · **P1** = fitur inti
> yang diminta · **P2** = scalability struktur · **P3** = mobile-ready ·
> **P4** = hygiene. Estimasi: **S** (≤1 hari) · **M** (2–4 hari) · **L** (≥1 minggu).

---

## Ringkasan eksekutif

Aplikasi berfungsi, tapi ada **beberapa lubang fundamental di sistem
pembayaran** yang harus ditutup sebelum menambah fitur atau pindah ke mobile:

1. **Harga & jumlah kredit dikirim dari client** — server percaya `price` dan
   `credits` dari body request (`/api/scan/buy`). Pembeli bisa bayar murah untuk
   kredit banyak. **(P0, kritikal)**
2. **Saldo kredit bisa ditulis langsung dari browser** — RLS `my20fit_profile`
   mengizinkan user meng-update kolom apa pun di barisnya sendiri, termasuk
   `scan_credits`. Kredit berbayar tidak server-authoritative. **(P0, kritikal)**
3. **Riwayat pembelian hanya di `localStorage`** (`js/orders.js`) — hilang saat
   ganti HP/browser/clear cache, dan **tidak ada di app native**. Server sudah
   punya tabel `my20fit_scan_orders` tapi user tidak bisa membacanya. **(P1)**
4. **"Cancel" tidak benar-benar membatalkan** — endpoint cancel menembak API
   FITCO lama, bukan SingaPay; status di DB tidak berubah. **(P1)**
5. **Skema DB pembayaran tidak ada di repo** — tabel & RPC penting
   (`my20fit_scan_orders`, `my20fit_vouchers`, `my20fit_credit_scan`, dll.) tidak
   punya file migration. Lingkungan tidak reproducible → menghambat scaling. **(P0/P2)**

Struktur kode juga perlu dirapikan agar scalable dan siap mobile: `server.js`
monolit ~1.830 baris, tidak ada test, tidak ada API versioning, dan auth sangat
bergantung pada `localStorage` (tidak tersedia di native).

---

## FASE 0 — Fondasi uang & keamanan (P0, kerjakan lebih dulu)

Tanpa ini, fitur apa pun di atasnya bocor uang. Semua server-authoritative.

- [ ] **F0-1 · Katalog paket & harga di server (S)**
  Pindahkan definisi paket (`SCAN_PACKS`: credits + harga + product_id) dari
  frontend (`js/deals.js`) ke server (konstanta atau tabel `my20fit_scan_packages`).
  `/api/scan/buy` **hanya menerima `package_id`**, lalu server yang menentukan
  `credits` & `price`. Berhenti membaca `b.credits`/`b.price` dari client.
  _Menutup temuan #1._

- [ ] **F0-2 · Kunci kolom saldo dari client (M)**
  `scan_credits`, `scan_count`, `scan_period`, `is_plus_member` tidak boleh
  ditulis oleh anon/JWT user. Opsi: cabut `GRANT UPDATE` kolom-kolom itu untuk
  role `authenticated` (biarkan kolom profil biasa tetap bisa di-update), atau
  pasang trigger yang menolak perubahan kolom saldo dari luar service role.
  Semua perubahan saldo hanya lewat RPC/`service key` di server.
  _Menutup temuan #2._

- [ ] **F0-3 · Ledger kredit append-only + konsumsi atomik (M)**
  Buat `my20fit_scan_ledger` (append-only: `+credits` dari pembelian/voucher,
  `-1` per scan, dengan `reason`, `reff_no`, `created_at`). Saldo = turunan dari
  ledger (atau kolom cache yang hanya di-update RPC). Ganti `Auth.consumeScan()`
  yang baca-lalu-tulis dari client dengan RPC atomik `my20fit_consume_scan`
  (kunci baris, cegah double-spend antar-tab/perangkat).
  _Menutup temuan #2 + race condition; menyiapkan audit keuangan._

- [ ] **F0-4 · Schema-as-code: semua tabel & RPC ke `db/` (M)**
  Buat migration untuk SEMUA objek `my20fit_*` yang saat ini hanya hidup di
  Supabase: `my20fit_scan_orders`, `my20fit_vouchers`, `my20fit_voucher_usages`,
  `my20fit_admin_roles`, `my20fit_admin_audit_log`, `my20fit_user_activity`,
  RPC `my20fit_credit_scan`, + yang baru dari F0-1/F0-3. Satu sumber kebenaran,
  reproducible di project lain. _Menutup temuan #5._

- [ ] **F0-5 · Webhook fail-closed di production (S)**
  Saat `NODE_ENV=production`, `SINGAPAY_WEBHOOK_ENFORCE` harus otomatis dianggap
  `"1"` (tolak signature invalid), bukan default longgar. Cegah kredit dari
  webhook palsu kalau env lupa di-set. Tambahkan guard boot-time.

---

## FASE 1 — Riwayat, cancel & rekonsiliasi pembayaran (P1 — inti permintaan)

Menjawab langsung: "perlu history payment quota, bisa cancel, dll."

- [ ] **F1-1 · Riwayat order server-side (M)**
  `GET /api/scan/orders` (paginated) membaca `my20fit_scan_orders` milik user
  dari server. Frontend `js/orders.js` berhenti jadi sumber kebenaran; localStorage
  hanya cache UI opsional. Tampilkan riwayat di `profile.html` dari server.
  _Menutup temuan #3; wajib untuk mobile (tidak ada localStorage di native)._

- [ ] **F1-2 · Cancel yang benar (M)**
  `/api/scan/order-cancel` harus: (a) hanya boleh untuk order `pending` milik user,
  (b) set status DB → `cancelled`, (c) batalkan/void payment link di SingaPay
  (bukan menembak endpoint FITCO lama). Hapus jalur cancel FITCO yang tidak relevan
  (sesuai aturan "hapus dead code"). _Menutup temuan #4._

- [ ] **F1-3 · State machine order + kolom status baku (S)**
  Definisikan status resmi: `pending → paid | cancelled | expired | failed | refunded`.
  Larang transisi ilegal (mis. `paid → cancelled` tanpa refund). Dokumentasikan.

- [ ] **F1-4 · Reconcile & sweeper pending (M)**
  Job berkala (cron/edge function/Railway scheduled): expire order `pending` yang
  lewat batas waktu, dan **poll balik ke SingaPay** untuk order yang webhook-nya
  gagal/telat, lalu kredit bila ternyata `paid`. Idempoten (pakai RPC F0-3).
  _Menutup risiko order nyangkut karena andalkan webhook saja._

- [ ] **F1-5 · Invoice / kwitansi + email konfirmasi (S)**
  Setelah `paid`, kirim email konfirmasi + simpan nomor invoice. Halaman
  "detail transaksi" untuk user (bukan hanya admin).

- [ ] **F1-6 · Kebijakan refund (S, desain dulu)**
  Tentukan apakah kredit bisa di-refund; kalau ya, alur `refunded` di ledger +
  penyesuaian saldo. (Penting untuk kebijakan store mobile nanti.)

---

## FASE 2 — Struktur backend scalable (P2)

- [ ] **F2-1 · Pecah `server.js` (~1.830 baris) jadi modul (L)**
  `routes/` (auth, scan, admin, singapay, meta), `services/` (singapay, fitco,
  supabase, mail), `lib/` (helpers). Satu file per domain. Mudah dites & dibaca.

- [ ] **F2-2 · API versioning + format error konsisten (M)**
  Namespace `/api/v1/...`. Bentuk error seragam `{ error: { code, message } }`.
  Wajib sebelum mobile: app versi lama di store harus tetap jalan saat API berubah.

- [ ] **F2-3 · Test harness (M)**
  Minimal integration test untuk alur bayar (buy → webhook → credit → consume),
  verifikasi signature webhook, dan validasi harga server-side. Jalankan di CI
  (selain secret-scan + `node --check` yang sudah ada).

- [ ] **F2-4 · Validasi konfigurasi saat boot (S)**
  Saat start, cek env wajib (service key, SingaPay creds bila `SINGAPAY_ENABLED`),
  gagal cepat dengan pesan jelas daripada error runtime saat transaksi.

- [ ] **F2-5 · Logging terstruktur + observability (S)**
  Ganti `console.log` ad-hoc dengan logger terstruktur (level, request id).
  Tambahkan health check & metrik dasar untuk pembayaran (sukses/gagal).

---

## FASE 3 — Persiapan mobile Android/iOS (P3)

- [ ] **F3-1 · Keputusan strategi arsitektur (S, keputusan pemilik)**
  Pilih jalur: **(A)** bungkus web via **Capacitor/PWA** (paling cepat, reuse
  kode HTML/JS sekarang) atau **(B)** native/**React Native/Flutter** konsumsi
  API (investasi lebih besar, UX terbaik). Rekomendasi awal: mulai **A** untuk
  cepat rilis, sambil merapikan API agar jalur **B** terbuka. _Butuh keputusan._

- [ ] **F3-2 · API-first contract + OpenAPI (M)**
  Dokumentasikan kontrak API stabil (OpenAPI/Swagger). App native bergantung
  penuh pada API — tidak boleh ada logika penting yang hanya ada di HTML.

- [ ] **F3-3 · Auth siap native: token + refresh, lepas dari `localStorage` (L)**
  Sekarang `fitco_token`/`fitco_uid`/sesi Supabase disimpan di `localStorage`
  (tidak ada di native). Rancang: penyimpanan token aman (Keychain/Keystore),
  alur refresh token, dan abstraksi storage sehingga web & native berbagi
  logika `Auth`. Rapikan dual-auth (FITCO + Supabase) jadi satu alur jelas.

- [ ] **F3-4 · Pembayaran di mobile + kebijakan store (M, riset dulu)**
  SingaPay payment link via in-app browser + **deep link** balik ke app setelah
  bayar. **Penting:** kredit scan = "digital goods" — cek kebijakan Apple/Google;
  iOS mungkin mewajibkan **In-App Purchase (IAP)** (potongan ~30%) untuk konten
  digital. Butuh keputusan bisnis + jalur pembayaran terpisah per platform.

- [ ] **F3-5 · Push notification (FCM/APNs) (M)**
  Ganti mekanisme berbasis web (mis. reminder puasa `supabase/functions`) dengan
  push native untuk pembayaran sukses, reminder, dsb.

- [ ] **F3-6 · Deep link & redirect pasca-bayar (S)**
  `redirect_url` SingaPay saat ini ke halaman web (`/calories?status=paid`).
  Untuk app perlu skema deep link (`my20fit://...`) atau universal/app links.

---

## FASE 4 — Hygiene, keamanan tambahan & dokumentasi (P4)

- [ ] **F4-1 · Keluarkan `archive/` (1,3 MB) & `design/` (2,2 MB) dari repo produksi (S)**
  Screenshot & prototipe ikut ter-deploy ke Railway tanpa guna. Pindah ke repo/
  branch terpisah atau `.gitignore` + arsip eksternal.

- [ ] **F4-2 · Perbaiki README (S)**
  README menyebut "React + Vite + codebase `artifacts/my20fit/`" dan "recreate as
  React components" — **tidak sesuai** stack asli (vanilla HTML + Express, lihat
  `CLAUDE.md`). Menyesatkan dev baru. Tulis ulang sesuai realita.

- [ ] **F4-3 · Aktifkan Content-Security-Policy (M)**
  Saat ini `helmet({ contentSecurityPolicy: false })`. Untuk app yang memegang
  uang & auth, rancang CSP (whitelist Supabase, Meta Pixel, SingaPay) untuk
  menekan risiko XSS.

- [ ] **F4-4 · Rate limiting per-endpoint & per-user (S)**
  `apiLimiter` global (50 req/10 mnt/IP) terlalu kasar: endpoint bayar/OTP butuh
  limit ketat spesifik, sedangkan `activity/ping` bisa kepentok. Tambah limit
  per-user (bukan hanya per-IP; mobile sering share IP/CGNAT).

- [ ] **F4-5 · Supabase CLI migrations + seed (M)**
  Pindah dari "jalankan manual di SQL Editor" ke migrations bernomor via Supabase
  CLI, sehingga skema versioned, terurut, dan sinkron antar staging/production.

---

## Peta ketergantungan (urutan disarankan)

```
F0-1 F0-2 F0-4 ─┐              (tutup lubang uang + schema-as-code)
F0-3 F0-5 ──────┤
                ├─► F1-1..F1-6  (riwayat, cancel, reconcile — fitur diminta)
                └─► F2-1..F2-5  (refactor + test → aman untuk scale)
                          └────► F3-1..F3-6  (mobile Android/iOS)
F4-* bisa jalan paralel kapan saja (hygiene).
```

**Rekomendasi:** kerjakan **FASE 0 lebih dulu** (menutup kebocoran uang &
membuat skema reproducible), lalu **FASE 1** (langsung menjawab kebutuhan
riwayat/cancel), baru **FASE 2** sebagai fondasi refactor sebelum menyentuh
**FASE 3 (mobile)**. Setiap task diselesaikan per-checkpoint sesuai aturan di
`CLAUDE.md` (staging dulu, tunggu CI hijau, jangan langsung production).
