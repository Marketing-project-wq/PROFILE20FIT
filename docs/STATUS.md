# STATUS — my.20fit.id

> **Pembaruan terakhir:** 2026-08-13 · **Commit staging:** `8c31776`
> Sumber: baca kode + `git log` (50 commit terakhir). Bagian bertanda
> **BELUM TERVERIFIKASI** / **TANYA PEMILIK** perlu dikonfirmasi pemilik.

Dokumen ini status hidup. Setelah mengubah fitur/arsitektur/route/skema, **perbarui
bagian yang relevan + tanggal & commit di atas** sebelum sesi berakhir.

---

## 1. Fitur yang SUDAH SELESAI & jalan

| Area | Ringkas | Bukti (kode) |
|---|---|---|
| Auth | Login/daftar 20FIT (FITCO), fallback password Supabase, OTP passwordless, Google, SSO-token, reset | `/api/fitco-*`, `js/auth.js`, `login.html`, `code-login.html` |
| Onboarding | Isi profil (gender/dob/tinggi/berat/tujuan/kondisi) → `my20fit_profile` | `onboarding.html` |
| Dashboard | Cuaca/AQI, rekomendasi workout, breathing, fasting, cycle, achievements, progres Photo | `dashboard.html`, `/api/weather`, `/api/aqi`, `/api/photo/*` |
| Calorie tracker | Scan makanan (AI foto + teks), log, verdict per-item, IF, top-up kredit scan | `calories.html`, `/api/scan/*` |
| Pembayaran | Xendit **via API FITCO/20FIT** (shop order). Kredit masuk via polling + sapuan reconcile (tak ada webhook di sini) | `/api/scan/buy\|order-status\|reconcile` |
| Email | Resend (satu jalur `lib/email.js`); consent **dihapus** → kirim langsung, opt-out via unsubscribe/suppression/frequency; blast wizard, automations, kill switch, webhook | `lib/*.js`, `admin-email.html`, `/api/webhooks/resend` |
| Admin console | `admin-dashboard` (lama) + `admin-v2` (redesign). RBAC marketing/viewer/staff/superadmin. Section: Overview/Revenue/User/Scan/Marketing/Voucher/Menu/Corporate/Reports/Settings | `admin-v2.html`, `js/admin-shell.js`, `/api/admin/*` |
| Admin swap | `/admin-dashboard` auto → `/admin-v2` **di staging** (deteksi host). Produksi tetap admin lama sampai flag `admin_v2` ON | `server.js` (`adminV2Enabled`, `isStagingReq`) |
| Voucher / Banner / Corporate | Modul voucher (logging/tracking/bulk), banner/promo (render dashboard), corporate (roster, pesan) | migration 011/012, `corp-dashboard.html` |
| Jadwal kelas | `/api/classes/schedule?venue=arena\|gym\|clinic` (baca Supabase) → halaman `/classes` | `classes.html` |
| Riwayat arena | `/api/arena/history` proxy ke **arena-api** (`ARENA_API_KEY`), member-scoped | `progress.html` |
| **Homepage 6-tile → halaman** | Tile Baris 1 = 6 opsi, tiap tile navigasi ke route sendiri (bukan panel inline). Panel inline & pin Baris 2 **dihapus** | `dashboard.html` (PR #295) |
| **Book Class filter** | `/classes` punya toggle **Arena/Gym** in-page; `?venue=clinic` = Book Recovery (tanpa toggle) | `classes.html` (PR #295) |
| **Menu bar Event** | Item menu bar `Medical` → `Event`; `event.html` placeholder "Upcoming" | `js/nav.js`, `event.html` (PR #294) |

## 2. Fitur SEDANG dikerjakan / SETENGAH JADI

- **Membership catalog** (`/membership`): halaman + carousel + proxy `GET /api/membership/packages` **sudah dibuat** (PR #295), TAPI endpoint upstream katalog belum tersambung.
  - Proxy meneruskan ke arena-api pada path env `MEMBERSHIP_CATALOG_PATH` (default `/packages`), mapper defensif. Kalau path/shape belum cocok → balas `groups:[]` (halaman "empty", tanpa data karangan) dan **log `membership raw shape: …`** di server.
  - **TANYA PEMILIK:** path katalog upstream yang benar + bentuk response (Special Offer & Gym Membership) + set env `MEMBERSHIP_CATALOG_PATH` di Railway.
- **Halaman Event** (`/event`): placeholder "Upcoming". Layer data (`EventData.fetch`) & teks dipisah, siap disambung. **API Event BELUM ADA** (pemilik akan menyusulkan).

## 3. Fitur BARU direncanakan

- Sambungkan data Membership begitu endpoint dikonfirmasi.
- Bangun + sambungkan API Event (`/api/events`) ke `event.html`.

## 4. Bug / utang teknis diketahui

- **admin-v2 fix auth #293 BELUM ter-merge.** Branch `claude/admin-v2-fix-auth` (CI hijau) menambah: baca master key admin dari `sessionStorage.admin_master_key` + banner "login admin" saat belum terautentikasi. Saat ini admin-v2 autentikasi via `Authorization: Bearer <JWT>` (jika login app/admin password) atau `?key=ADMIN_KEY`. **TANYA PEMILIK** apakah mau di-merge.
- **`getAdminContext` menelan error infra jadi 401.** Kalau Supabase `getUser` timeout/mati (status 503 dari `getUserFromReq`), `getAdminContext` menangkap dan balas `null` → `requireAdmin` balas **401** (seolah sesi habis), bukan 503. Menyesatkan saat debug. (`server.js`.) Prioritas rendah.
- **Promo-banner masih pakai `target="_blank"`.** Di `dashboard.html` render `#promoBanner` (banner marketing admin, `cta_type==="external_link"`) — satu-satunya `_blank` tersisa. Terpisah dari tile navigation. **TANYA PEMILIK** apakah mau dijadikan same-tab.
- **`docs/CODEBASE-MAP.md` sebagian STALE.** Ditulis pada "TASK 0"; masih menyebut *email consent* di onboarding (sudah dihapus migration 013) dan referensi baris `server.js` lama (server.js kini lebih besar). Pakai untuk peta umum, tapi verifikasi ke kode untuk detail terkini.
- **Migration 013 (drop kolom email consent) — status eksekusi BELUM TERVERIFIKASI.** File `db/supabase-migration-013-drop-email-consent.sql` menghapus kolom consent; kode sudah tak memakainya. Harus dijalankan **manual** di Supabase. **TANYA PEMILIK** apakah sudah dijalankan di staging & produksi.

## 5. Keputusan penting & alasannya

- **Pembayaran: Xendit via API FITCO/20FIT, bukan Xendit langsung.** Akun Xendit dipakai bersama app lain; webhook invoice account-global → callback "paid" selalu ke backend 20FIT, tak pernah ke my.20fit.id. Maka **tak ada webhook di sisi kita**; kredit lewat polling + `/api/scan/reconcile` (idempoten via RPC `my20fit_credit_scan`). Lihat CLAUDE.md "Konteks penting".
- **Email consent dihapus** (PR #291, migration 013): kirim langsung, model opt-out (unsubscribe + suppression + frequency cap).
- **Admin swap staging-first** (PR #290): staging pakai `admin-v2` via deteksi host; produksi tetap admin lama sampai flag `admin_v2` ON (reversible).
- **Tile homepage → halaman sendiri** (PR #295): panel inline expand diganti navigasi per-route atas permintaan pemilik. Book Class/Recovery **reuse `/classes`** (hindari duplikasi), bukan halaman baru.
- **Membership tanpa data dummy**: placeholder "empty" sampai endpoint katalog asli tersedia (aturan: jangan karang data/endpoint).
- **Navigasi tile & 6 halaman WAJIB same-tab** (tanpa `target="_blank"`/`window.open`), termasuk link eksternal media.20fit.id & booking.20fit.id.
