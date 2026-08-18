# CLAUDE.md — Panduan kerja untuk agent di repo PROFILE20FIT (my.20fit.id)

Aturan tetap di bawah ini WAJIB diikuti setiap sesi. Ditulis dari instruksi
pemilik proyek (zidni@20fit.id). Kalau ragu, ikuti file ini.

> **Pembaruan dokumen terakhir:** 2026-08-13 · **Commit staging:** `8c31776`
> Claude Code memuat file ini otomatis di awal sesi. Baca ini dulu, lalu buka
> dokumen pecahan sesuai kebutuhan.

## Ringkasan proyek
**my.20fit.id** = web app "20FIT Health Profile" untuk **member 20FIT**: onboarding
profil, tracker kalori (scan makanan pakai AI), catatan kesehatan/aktivitas, jadwal &
booking kelas (Arena/Gym/Klinik — booking diproses di `booking.20fit.id`), paket
membership, konten/berita (`media.20fit.id`), plus **console admin** (RBAC) & **corporate**.
Menyelesaikan: satu tempat member memantau kesehatan + mengakses layanan 20FIT. **Bukan
alat diagnosis medis.** Stack: vanilla HTML/CSS/JS + Node/Express + Supabase, deploy Railway.

## Indeks dokumen konteks
- **`docs/STATUS.md`** — status fitur terkini, utang teknis, keputusan (paling sering berubah; **baca ini untuk tahu kondisi sekarang**).
- **`docs/DATABASE.md`** — tabel `my20fit_*`, migration, cara jalan DB.
- **`docs/CODEBASE-MAP.md`** — peta arsitektur/route/API detail (⚠️ **sebagian STALE** — lihat `docs/STATUS.md` §4; verifikasi ke kode).
- **`docs/GIT_WORKFLOW.md`**, **`docs/GITHUB_SECRETS.md`** — alur git & penanganan secret.
- Email: `docs/EMAIL-*.md`, `docs/RESEND-SETUP-AUDIT.md`, `docs/EMAIL-LOGIC-SPEC.md`.
- Bagian **Tech stack, Struktur repo, Route, Env, Cara menjalankan, Konvensi, Jangan
  dilakukan, Langkah berikutnya** ada di bawah aturan kerja file ini.

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
  superadmin opsional. Di **staging**, `/admin-dashboard` auto-redirect ke `/admin-v2`
  (deteksi host); **produksi** tetap admin lama sampai flag `admin_v2` ON.

---

# Referensi proyek (dibuat dari hasil baca repo)

## A. Tech stack (dari `package.json` + lockfile + kode)
| Layer | Pilihan |
|---|---|
| Runtime | Node.js ≥18, **Express 4** (`server.js`) |
| Frontend | **Vanilla HTML/CSS/JS**, tanpa framework/bundler. Halaman = `.html` di root; logika bersama di `js/*.js` (global `window.*`). Chart = inline SVG. |
| Styling | `<style>` per halaman + `css/20fit-design-system.css` (token `--fit-*`) + `css/glass-app.css` (skin + dark mode, dimuat terakhir) |
| DB/Auth | **Supabase** (Postgres + Auth + Edge Functions), project `cpvzwqptzcxnwzfzgrmt` (shared) |
| Deploy | **Railway** — `main`=produksi (my.20fit.id), `staging`=staging; auto-deploy per branch |
| Dependencies | `@supabase/supabase-js ^2.45`, `express ^4.18`, `express-rate-limit ^7.4`, `helmet ^7.1`, `dotenv ^16.4` |
| Layanan luar | FITCO API (login/register/SSO/reset + shop order Xendit), arena-api (jadwal/membership), Resend (email), Meta Pixel+CAPI, WAQI (AQI), Pexels (foto), Edge Functions AI (`my20fit-ai`, `my20fit-foodimg`) |

## B. Struktur repo
| Path | Isi | Catatan |
|---|---|---|
| `server.js` | Seluruh backend Express (~121+ route) | **RAPUH & besar — hati-hati.** Cek `node --check` |
| `*.html` (root) | Halaman (URL bersih tanpa `.html`) | Sering disentuh |
| `js/` | Logika frontend bersama (`auth.js`, `i18n.js`, `nav.js`, `admin-shell.js`, dll) | Shared lintas halaman — ubah hati-hati |
| `js/vendor-supabase.js` | Bundle supabase-js (vendored) | **JANGAN diedit** |
| `lib/` | Service email server-side (`email.js`, `comms.js`, `campaigns.js`, `blast.js`, `segments.js`) | Diblokir dari static-serve |
| `css/` | Design system + skin | Ikuti token, jangan hardcode |
| `db/` | Migration SQL (`00x…`, `01x…`) + setup + policies | Manual; lihat `docs/DATABASE.md` |
| `supabase/functions/` | Edge Functions (TS) | Deploy terpisah |
| `docs/` | Dokumentasi | Diblokir dari static-serve |
| `.github/workflows/secret-scan.yml` | CI: gitleaks + `node --check` | Gate merge |
| `archive/`, `design/` | Arsip / mockup | Jangan diutak-atik |

## C. Route / halaman (ringkas; detail & API di `docs/CODEBASE-MAP.md`)
**Publik/auth:** `/` (→`/login`), `/login`, `/code-login`, `/verify`, `/reset-password`, `/setpassword`, `/onboarding`, `/unsubscribe`, `/privacy`.
**Member (perlu login):** `/dashboard` (home 6-tile), `/calories`, `/progress`, `/profile`, `/medical`, `/diet`, `/classes` (Book Class, toggle Arena/Gym; `?venue=clinic`=Book Recovery), `/membership` (carousel — **data belum tersambung**), `/event` (**placeholder "Upcoming"**), `/payment/pending|success|failed`.
**Admin:** `/admin`(→`/admin-dashboard`), `/admin-dashboard` (lama), `/admin-v2` (redesign; staging default), `/admin-email`, `/corp-dashboard`.
**API:** `/api/*` (~121 route) — user (`/api/scan/*`, `/api/classes/schedule`, `/api/arena/history`, `/api/membership/packages`, `/api/photo/*`, `/api/weather`, `/api/aqi`, dll), admin (`/api/admin/*` ~53, semua lewat `requireAdmin`), corporate (`/api/corp/*`), cron (`/api/cron/*`, dilindungi `CRON_SECRET`), webhook (`/api/webhooks/resend`).
Tile **News** = eksternal `media.20fit.id` (same-tab, tanpa halaman).

## D. Auth & peran (ringkas)
- **Member:** login 20FIT via FITCO (`Auth.fitcoLogin`) atau OTP/Google; fallback password Supabase. Sesi Supabase (JWT) di localStorage. Fetch API pakai `Authorization: Bearer <await Auth.token()>`.
- **Admin:** master key `ADMIN_KEY` (`x-admin-key`/`?key=`) → superadmin; atau JWT admin yang punya baris di `my20fit_admin_roles`. Role: `marketing`(barred data kesehatan)/`viewer`/`staff`/`superadmin`. Ditegakkan **server-side** (`requireAdmin`) — bukan cuma UI.
- **Corporate:** login password Supabase (fallback FITCO), isolasi antar-perusahaan server-side (`requireCorpAdmin`).
- **Kelemahan diketahui:** lihat `docs/STATUS.md` §4 (admin-v2 #293 belum merge; `getAdminContext` menelan 503 jadi 401).

## E. Environment variable (NAMA + fungsi; **TANPA NILAI** — semua di Railway)
> Nilai rahasia TIDAK PERNAH di repo. Yang bertanda 🔒 = rahasia. "opsional" per `.env.example`.

| Variabel | Fungsi | Wajib? |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Koneksi Supabase (browser/auth) | wajib |
| `SUPABASE_SERVICE_KEY` 🔒 | Service key server (bypass RLS) | wajib |
| `FITCO_PARTNER_TOKEN` 🔒 | Bearer partner FITCO (shop order + status) | wajib (payment) |
| `FITCO_API_URL`, `FITCO_SSO_URL`, `FITCO_LOGIN_PATH`, `FITCO_GOOGLE_LOGIN_PATH`, `FITCO_PAID_STATUS` | Endpoint & config FITCO | opsional (ada default) |
| `ADMIN_KEY` 🔒 | Master key superadmin | opsional |
| `ARENA_API_KEY` 🔒, `ARENA_API_URL` | Akses arena-api (jadwal + membership) | key wajib utk arena/membership |
| `MEMBERSHIP_CATALOG_PATH` | Path katalog membership di arena-api | **belum di-set** (utk `/api/membership/packages`) |
| `EMAIL_RESEND_API` 🔒 | API key Resend | wajib (email) |
| `EMAIL_ENVIRONMENT`, `EMAIL_TEST_WHITELIST`, `MAIL_FROM`, `MAIL_REPLY_TO` | Mode & alamat email | config |
| `RESEND_WEBHOOK_SECRET` 🔒 | Verifikasi webhook Resend (Svix) | utk webhook |
| `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` 🔒, `META_CAPI_VERSION` | Meta Pixel + Conversions API | opsional |
| `GOOGLE_CLIENT_ID` | Google Identity Services (login Google, publik) | opsional |
| `WAQI_TOKEN` 🔒, `PEXELS_API_KEY` 🔒 | AQI (WAQI) & foto makanan (Pexels) | opsional |
| `PHOTO_APP_URL`, `PHOTO_API_URL`, `PHOTO_SSO_REDIRECT`, `PHOTO_OP_TIMEOUT_MS` | Integrasi photo.20fit.id (SSO) | opsional |
| `CRON_SECRET` 🔒 | Proteksi endpoint `/api/cron/*` | utk cron |
| `PARTNER_API_KEY` 🔒 | Auth endpoint partner | utk partner API |
| `DEV_MASTER_OTP` 🔒, `OTP_TTL_MINUTES` | OTP dev + masa berlaku OTP | dev/config |
| `XENDIT_ENABLED`, `APP_BASE_URL`, `NODE_ENV` | Flag & base URL & environment | config |

Daftar lengkap nama ada di `.env.example` (contoh, tanpa nilai asli).

## F. Cara menjalankan (dari `package.json` — jangan mengarang)
- **Install:** `npm install`
- **Jalan (dev = prod):** `npm start` (= `node server.js`) — butuh env terisi.
- **Build:** — tidak ada (HTML/JS statis disajikan langsung).
- **Test:** — belum ada test suite.
- **Lint/typecheck:** tidak ada tooling (vanilla JS). Yang dipakai CI & wajib sebelum push:
  `node --check server.js`, `node --check sw.js`, `node --check js/*.js` (kecuali `vendor-*`).
  HTML: cek sintaks **inline JS** manual per file yang diubah.
- **Migration:** manual di Supabase SQL Editor (lihat `docs/DATABASE.md`).

## G. Konvensi & aturan kerja (dari pola konsisten di kode)
- **Routing bersih:** file `<nama>.html` → route `/<nama>`; `/<nama>.html` redirect 302 ke `/<nama>`.
- **Design system:** pakai token `--fit-*` / var CSS dari `css/*.css`. **Jangan hardcode warna/spacing baru** satu per satu.
- **Dark mode:** class `theme-light` di `<html>` (light default; hapus class = dark). Tiap halaman punya script inline theme-init yang baca `localStorage 'theme'`. Pakai token adaptif, bukan hex tetap.
- **i18n EN/ID:** `js/i18n.js` (`window.I18N`, `window.L`; toggle EN/ID auto). Teks dinamis: `L({en,id})`/`Lx`; teks statis: `data-i18n` atau `data-en`/`data-id`. Default bahasa `id`.
- **NAVIGASI — dilarang tab baru:** JANGAN `target="_blank"` & JANGAN `window.open()` untuk navigasi tile/halaman, **termasuk** link eksternal `media.20fit.id` & `booking.20fit.id`. Pakai `<a href>` biasa (route internal / eksternal same-tab). **Grep `target="_blank"`/`window.open` setelah kerja.** (Pengecualian tercatat: promo-banner admin — lihat STATUS §4.)
- **State data:** tiap fetch API tangani **loading + empty + error (+retry)**, bukan happy-path saja. Contoh pola: `classes.html`, `membership.html`, `event.html`.
- **Auth fetch:** lampirkan `Authorization: Bearer <await Auth.token()>` (pola `apiFetch`). Admin: `x-admin-key` (master) atau Bearer JWT.
- **Layer data dipisah:** simpan fetch + teks di objek terpisah dari render (mis. `EventData`/`EVENT_TXT`, `MembershipData`/`TXT`) supaya mudah disambung API.

## H. Status ringkas
Fitur inti (auth, onboarding, dashboard, calorie, payment, email, admin, voucher, banner,
corporate, jadwal) **jalan**. **Setengah jadi:** carousel Membership (nunggu endpoint) &
halaman Event (nunggu API). **Detail + utang teknis + keputusan → `docs/STATUS.md`.**

## I. HAL YANG JANGAN DILAKUKAN (spesifik proyek)
- Jangan edit tabel Supabase **tanpa prefix `my20fit_*`** (milik app lain).
- Jangan jalankan migration otomatis — **manual**, minta pemilik (mis. 013 drop kolom).
- Jangan commit secret / nilai env (CI gitleaks memblokir).
- Jangan panggil **Xendit langsung** — selalu lewat API FITCO.
- Jangan bangun logika kredit di atas asumsi user kembali dari Xendit (dia tidak kembali).
- Jangan merge langsung ke `main` tanpa `staging`; jangan rewrite history ter-merge.
- Jangan tambah framework/bundler (tetap vanilla).
- Jangan pakai `target="_blank"`/`window.open` di area navigasi tile/halaman.
- Jangan hapus/putus **admin lama** (fallback) & **`js/vendor-supabase.js`** (vendored).
- File rapuh: `server.js` (besar), `js/auth.js`/`i18n.js`/`nav.js` (shared lintas halaman).

## J. Langkah berikutnya (urut prioritas)
1. **Membership berdata:** konfirmasi path katalog upstream + set env `MEMBERSHIP_CATALOG_PATH`, finalkan mapper `/api/membership/packages`.
2. **Event:** bangun API `/api/events` + sambungkan `event.html` (`EventData.fetch`).
3. **admin-v2 #293:** putuskan merge (sessionStorage master key + banner login).
4. **Verifikasi migration 013** sudah dijalankan di staging & produksi.
5. **Refresh `docs/CODEBASE-MAP.md`** yang stale (email consent, ref baris server.js).
6. (Opsional) promo-banner `_blank` → same-tab bila pemilik mau.

## K. Cara merawat dokumen ini
> **Untuk sesi Claude Code berikutnya:** Baca file ini di awal sesi. **Setelah**
> menyelesaikan pekerjaan yang mengubah **arsitektur, route, skema database, atau status
> fitur**, **perbarui bagian yang relevan** di `CLAUDE.md` + dokumen `docs/` terkait
> (`STATUS.md` untuk status, `DATABASE.md` untuk skema) **sebelum sesi berakhir**.
> **Perbarui tanggal & commit hash** di header atas (`CLAUDE.md`, `docs/STATUS.md`,
> `docs/DATABASE.md`). Kalau menemukan info yang belum pasti, tulis **BELUM
> TERVERIFIKASI** / **TANYA PEMILIK REPO** — jangan isi tebakan.
