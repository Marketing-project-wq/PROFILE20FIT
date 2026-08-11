# AUDIT — my.20fit.id (admin + user + teknis)

> TASK 1. Audit read-only (3 auditor paralel + verifikasi langsung). Tidak ada
> kode yang diubah untuk menghasilkan dokumen ini. Format tiap temuan:
> `Lokasi file:line · Masalah · Dampak (ke siapa) · Usulan · Effort (S/M/L)`.
> Prioritas: **P0** = bug / risiko keamanan / data salah · **P1** = mengganggu
> pemakaian harian · **P2** = polish / nice-to-have.

---

## P0 — Bug / keamanan / data salah (segera)

### T-1 · Middleware body-parser/helmet/limiter terdaftar SETELAH ~40 route ⚠️ paling kritis
- **Lokasi:** `server.js:751-808` (helmet 751, `express.json` 752, `urlencoded` 759, `trust proxy` 765, `apiLimiter` 808) vs route `184-748`.
- **Masalah:** Route yang didaftarkan sebelum baris 751 tidak pernah mencapai body-parser → `req.body`/`req.rawBody` = `undefined`. Terverifikasi (grep + semantik Express: route di baris 279 dijalankan & membalas sebelum stack sampai ke parser di 752).
- **Dampak:** (a) **`/api/webhooks/resend` (279) selalu 401** → event delivered/opened/clicked/**bounced/complained** tak pernah masuk → analytics email (TASK 2) kosong **dan** suppression bounce/complaint tak jalan → reputasi domain memburuk; (b) **semua aksi tulis konsol email admin rusak** (killswitch 575, suppression 557, segment/preview 601, send/create·test·confirm·pause·resume·cancel 622-669, automations 713/728) — `admin-email.html` POST JSON ke sana; (c) **`/api/comms/consent` (489) rusak** → consent onboarding/profil tak tersimpan (padahal consent = prasyarat semua campaign); (d) `/unsubscribe` one-click (416), cron meal/daily body.
- **Usulan:** Pindahkan blok middleware (helmet, `express.json` dgn `verify` rawBody, `urlencoded`, `trust proxy`, limiter) ke **atas route pertama** (sebelum baris 184). Menutup T-1 sekaligus P1 rate-limit/helmet gap.
- **Effort:** S. **Prasyarat untuk TASK 2/3/4 bisa berfungsi.**

### T-2 · Handler tombol range Overview nge-bind ke SEMUA `.rbtn` lintas-tab
- **Lokasi:** `admin-dashboard.html:827-833` (+ tombol `.rbtn` di 172-175, 193-196, 268-271).
- **Masalah:** Selektor `.rbtn` global — tombol range di tab Transaksi/Minat Menu/Recap ikut men-trigger handler Overview → `CUR_RANGE=undefined`, `fetch /api/admin/metrics?range=undefined`, `.on` di-toggle ke semua `.rbtn`.
- **Dampak:** Semua admin — state range antar-tab rusak + fetch metrics liar tiap ganti range.
- **Usulan:** Batasi selektor (`.rbtn[data-range]` / scope ke `#tab-overview`).
- **Effort:** S.

### T-3 · Ringkasan Revenue tab Transaksi dihitung dari maks 1000 baris
- **Lokasi:** `server.js:2781` (`.limit(1000)`) + `admin-dashboard.html:966-969` (total dihitung client-side dari baris yang dikembalikan).
- **Masalah:** Untuk rentang dgn >1000 tx, list & total (Revenue gross/net, kredit terjual) dipotong diam-diam tanpa peringatan.
- **Dampak:** Owner — angka revenue under-report begitu volume >1000 tx.
- **Usulan:** Hitung agregat di server (spt Overview) atau banner "menampilkan 1000 terbaru — total tak lengkap" + paginate.
- **Effort:** M.

### U-1 · 8 key i18n hilang → label mentah tampil ke SEMUA user baru
- **Lokasi:** `onboarding.html:98-102` (`ob_email_pref`, `ob_email_sub`, `ob_consent_mkt`, `ob_consent_meal`) + `profile.html:172,178,180,181` (`corp_title`, `emailpref_title`, `emailpref_mkt`, `emailpref_meal`). Key tak ada di `js/i18n.js`.
- **Masalah:** `apply()` menimpa teks dgn string key mentah.
- **Dampak:** Semua user baru (onboarding wajib) & halaman Profil melihat teks "ob_consent_mkt", "emailpref_title", dst.
- **Usulan:** Tambah 8 key ke `DICT.en` & `DICT.id`.
- **Effort:** S.

### U-2 · `.opt.active` teks putih di atas latar pink pucat → pilihan tak terbaca
- **Lokasi:** `onboarding.html:26` (`.opt.active{color:#fff}` di atas `background:rgba(225,29,42,.12)` pada kartu putih). Bandingkan `profile.html:32` yang benar (`color:var(--red)`).
- **Masalah:** Kontras teks ~gagal; label Gender/Goal terpilih "hilang".
- **Dampak:** Semua user baru — pilihan onboarding tak terbaca (hanya border merah penanda).
- **Usulan:** `color:#fff` → `var(--red)`.
- **Effort:** S.

---

## P1 — Mengganggu pemakaian harian

- **A-1 · `admin-email.html` tak ada di navigasi** · `admin-dashboard.html:125-136` · Konsol Email hanya terjangkau kalau tahu URL `/admin-email` · Marketing/staff tak bisa akses fitur email/analytics dari dashboard · Tambah item nav "Email & Campaign" (role staff+/marketing) · **S**
- **A-2 · `removeCorpAdmin()` tanpa `confirm()`** · `admin-dashboard.html:575-578` · DELETE admin corporate seketika saat klik · Superadmin salah-klik mencabut akses · Bungkus `confirm()` spt removeRole · **S**
- **SEC-1 · Master `ADMIN_KEY` & `CRON_SECRET` diterima via `?key=` URL** · `server.js:1810,185,437,452,700` + `admin-email.html:43,134` · Kredензial bocor ke access log/Referer/history · Superadmin/keamanan · Terima **header-only** (`x-admin-key`/`x-cron-secret`), hapus cabang `req.query.key` · **S**
- **A-3 · Tab Transaksi tanpa search / pagination / sort** · `admin-dashboard.html:169-185,960-986` · Sulit temukan 1 transaksi (Reff/email) · Admin harian · Tambah input cari + paginate · **M**
- **A-4 · Tab Pengguna render semua user tanpa pagination; server cap 5000/20000** · `admin-dashboard.html:1109-1131` + `server.js:2818-2826` · Halaman berat + KPI (total/aktif/buyer) salah saat basis >5000 · Admin · Paginate client + agregat server (count/SQL, jangan tarik 20-30rb baris) · **M**
- **A-5 · Tak ada filter "belum bayar / non-buyer"** · `admin-dashboard.html:223` · Pertanyaan "siapa belum bayar" tak terjawab langsung · Marketing/sales · Tambah opsi filter inverse `purchases>0` · **S**
- **PERF-1 · N+1 di cron meal-reminder** · `lib/campaigns.js:151-186` · Query profile/activity/daily_log + `canSend` per-user dalam loop · Cron lambat/timeout saat user tumbuh · Batch `.in(ids)` (pola sudah ada di `server.js:2165` corpRoster) · **M**
- **PERF-2 · N+1 di blast queue** · `lib/blast.js:174-186` · `getPrefsByUser`+`isSuppressed` per penerima · Blast besar lambat · Pre-fetch prefs+suppression per batch `.in(ids)` · **M**
- **U-3 · Default bahasa "en" untuk market Indonesia** · `js/i18n.js:258` (+ login/code-login/privacy) · Pengunjung pertama lihat app bahasa Inggris sampai klik ID · Semua user ID · Default `"id"` atau deteksi `navigator.language` · **S**
- **U-4 · Login tak autofocus email + default EN** · `login.html` · Returning user rugi 1 tap fokus + 1 klik ganti bahasa · Semua user · `autofocus` di `#email`; default lang id · **S**

---

## P2 — Polish / nice-to-have

- **Konsistensi warna brand merah:** `admin-email.html:10` (`#D62828`) vs dashboard/corp (`#C41101`). Samakan `#C41101`. · S
- **Sistem visual `admin-email.html` beda total** (light, tanpa sidebar) dari dashboard/corp (dark shell + sidebar). Selaraskan tema atau embed sbg tab. · L
- **Ikon nav corp pakai emoji** (📊✉️↻⎋⬇) vs dashboard SVG. Pilih satu gaya. · S
- **Pola tutup modal beda** (`corp .x-close` bulat vs dashboard `.btn.ghost "Tutup"`). Samakan komponen. · S
- **Dua zona waktu di satu baris** (Pengguna: "Tgl Onboarding" UTC vs "Terakhir aktif" lokal) `admin-dashboard.html:1120,1367`. Seragamkan. · S
- **Tabel Pengguna & Transaksi tak bisa sort per kolom** (corp sudah bisa). Tambah sort header. · M
- **Form voucher tanpa validasi client** `admin-dashboard.html:911-920` (kode kosong, %>100). Validasi ringan. · S
- **Kill-switch & remove-suppression tanpa `confirm()`** `admin-email.html:167,196`. Tambah konfirmasi. · S
- **Copy "· FASE 1" bocor ke UI** `admin-dashboard.html:309`. Hapus. · S
- **Copy campur EN/ID** (AOV, Pause/Resume/Cancel, Bounce/Complaint/Unsub, Warm-up) di admin. Terjemahkan/tooltip. · S
- **Sidebar admin ≤820px jadi 10 tombol wrap** memakan tinggi. Hamburger/drawer. · M
- **corp loadSummary: KPI/donut tanpa skeleton loading** `corp-dashboard.html:248`. · S
- **Kontras warna:** verify.html:26 (`#46d369`/`#ff6b6b`), medical.html:313 (`#46d369` nilai lab normal) gagal WCAG AA di kartu putih. Pakai hijau/merah lebih gelap. · S
- **Tap target <44px:** toggle EN/ID `login.html:63`/`code-login.html:36` (~28px), `unsubscribe.html:32` input time (~31px). Naikkan ≥44px. · S
- **`<html lang>` tak konsisten** (sebagian "en", sebagian "id") sebelum JS jalan. Samakan `"id"`. · S
- **Duplikasi hardcoded Supabase URL+anon key** di `js/auth.js:19`, `medical.html:206`, `server.js:28` padahal `/api/config` sudah ada. Anon key publik (bukan bocor) tapi rawan drift saat rotasi. Hapus literal, baca `/api/config`. · S
- **Sejumlah `fetch` frontend tanpa `.catch`** (`js/deals.js`, `js/auth.js`, `dashboard.html`) — gagal diam-diam. Tambah `.catch` di jalur pembayaran dulu. · M

---

## Temuan NEGATIF (aman — biar tak salah kira)
- **Semua 54 route `/api/admin/*` memanggil `requireAdmin` di baris pertama** (diverifikasi menyeluruh) — tak ada admin route bocor.
- **Corporate endpoints** di-gate `requireCorpAdmin` + selalu difilter `corporate_id` milik admin → **tidak ada IDOR**.
- **Verifikasi signature webhook Resend BENAR** (HMAC Svix + `timingSafeEqual` + anti-replay 5 mnt) — hanya tak tercapai karena bug T-1.
- **Tidak ada rahasia hardcoded di source REPO.** Edge function `my20fit-ai`/`my20fit-foodimg` di repo baca `OPENROUTER_API_KEY` dari env saja. ⚠️ *Catatan:* versi **ter-deploy** `my20fit-ai` yang saya baca via MCP awal sesi ini SEMPAT punya fallback key `sk-or-…127dcb` — **verifikasi versi deployed sekarang** & rotate bila masih ada.
- State handling halaman berat (calories/medical/progress/classes) sudah baik: 401/402/timeout/empty/loading ditangani, tak ada `{{variable}}` bocor, tak ada white-screen.
- Static guard memblok `server.js`/`lib`/`db`/`supabase`/`.git`; global error handler + `unhandledRejection`/`uncaughtException` terjaga; partner/cron pakai secret (walau `?key=` perlu diperketat, SEC-1).

---

## Rekomendasi urutan kerja
1. **T-1** (middleware ordering) — **prasyarat** email/webhook/consent berfungsi (TASK 2/3/4). Kecil, aman.
2. **U-1, U-2** (i18n key hilang + kontras onboarding) — user-facing broken, effort S.
3. **T-2, SEC-1** (rbtn scope, header-only key) — kecil, berdampak.
4. **T-3, A-4, PERF-1/2** (akurasi angka + skalabilitas) — sebelum basis user membesar.
5. Sisanya P1/P2 sesuai prioritas kamu.

*TASK 1 selesai. Kamu pilih mana yang dikerjakan — kecuali T-1 yang wajib lebih dulu agar TASK 2/3/4 bisa jalan.*
