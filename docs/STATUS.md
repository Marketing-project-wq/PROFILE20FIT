# STATUS — my.20fit.id

> **Pembaruan terakhir:** 2026-09-08 · **Commit staging:** `0d91062`
> Sumber: baca kode + `git log` (50 commit terakhir). Bagian bertanda
> **BELUM TERVERIFIKASI** / **TANYA PEMILIK** perlu dikonfirmasi pemilik.

Dokumen ini status hidup. Setelah mengubah fitur/arsitektur/route/skema, **perbarui
bagian yang relevan + tanggal & commit di atas** sebelum sesi berakhir.

---

## 0. Catatan insiden operasional (2026-08-21)

**Insiden:** ±13:00–14:40 WIB banyak widget staging (`/book-coach`, Ticket Wallet event,
Photo) tampil **"Couldn't load" bareng**. Widget yang baca **langsung** ke Supabase dari
browser (Fasting/Profil/Calories via `Auth.supabase.from`) tetap jalan; yang lewat
**server `/api/*`** (coaches/events/photo/tickets) gagal semua.

**Akar masalah (dari log Supabase):** BUKAN data hilang / service key / RLS / env.
Sepanjang insiden panggilan service-key server → Supabase tetap **200** (coaches/doctors/
ticket_events, error ≈ 0) dan datanya utuh (Event 3 on_sale; Coach/Dokter memang kosong
by design, roster via CMS; transaksi tiket ada). Karena server **dapat 200 dari Supabase
tapi balasannya gagal sampai ke browser** untuk **semua** `/api/*` sekaligus → penyebab =
**container Railway STAGING sempat tidak sehat** (crash/restart/kehabisan resource).
Bersamaan, edge fn `ticket-embed` sempat **404** (upstream, fail-safe) → **pulih 200**
±15:20 WIB. Container pulih sendiri (server-side hijau, 0 error) sejak sore.

**Tindakan:** redeploy staging (restart container bersih). **Fix durable** (kalau
berulang) = cek **Railway staging → Metrics/Deploy logs** untuk OOM/restart/disk penuh &
naikkan resource — **butuh akses dashboard Railway (di luar agent).**

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
| **Roster home (coach/dokter/fisioterapis)** | Tiga rail di bawah home: `/api/coaches`, `/api/doctors`, `/api/physiotherapists`. Terisi: 4 coach (+23 alias instructor), 5 dokter, 3 fisioterapis. Kartu tanpa `photo_url` — atau yang `<img>`-nya gagal dimuat — ditandai "Foto belum ada" | `dashboard.html`, `server.js` (PR #412) |

## 2. Fitur SEDANG dikerjakan / SETENGAH JADI

- **Tiket user tidak muncul — akar masalahnya DI LUAR repo ini (PR #417).** Tiket **tidak disimpan di Supabase kita**: sapuan `pg_stat_user_tables` menunjukkan tak ada tabel yang menerima pembelian tiket baru, dan `my20fit_orders` berisi **nol** `kind='ticket'`. Tiket hidup di **ticket.20fit.id**, dibaca lewat edge function `ticket-embed`.
  - **Titik gagal:** `POST /api/embed/v1/partner/user-token` balas **404 pada 141 dari 143 panggilan** (log edge fn 24 jam; action dipisah lewat ukuran body request — `user_token`=23 B, `events`=19 B, `my_tickets`=282–321 B). Langkah `my_tickets` sendiri **selalu 200** saat tokennya terbit, termasuk mengembalikan tiket asli. Jadi pipeline utuh; yang gagal penukaran email→token.
  - **Sudah disingkirkan:** `TICKET_EMBED_KEY` terpasang (`events` → 200); email profil vs `auth.users` **0 beda** dari 1374; email di `my20fit_buyer_identities` **0 beda** dari 921.
  - **Sudah diperbaiki di PR #417:** `/api/tickets/mine` kini membawa `reason` + `source` saat kosong, dan widget membedakan "belum beli" / "akun tak dikenali penerbit" / "gagal memuat". Sebelumnya semua kegagalan tampil sama sebagai "Belum ada tiket" sehingga masalah tak pernah terlihat. `?debug=1` (superadmin) membuka respons mentah upstream.
  - **Sebab 404-nya terukur (bukan salah data kami):** `/partner/user-token` menjawab "email ini punya AKUN?", **bukan** "punya TIKET?". **8 dari 8** pembeli asli → 404; **3 user yang belum pernah beli** → 200; email **fiktif** → 404 yang identik. Pencocokan case-**insensitive** (HURUF BESAR pun 200). Jadi pembeli **tamu** (guest checkout, tanpa akun) tak pernah bisa ditampilkan lewat jalur ini.
  - **Jalur OTP penerbit (PR #419, baru di `staging`).** `/otp/request` menerima email apa pun — termasuk yang tanpa akun — jadi ini satu-satunya jalur tersisa untuk pembeli tamu. Widget kini menawarkan "Kirim kode ke emailku"; token hasilnya disimpan di `my20fit_ticket_tokens`. **BELUM TERVERIFIKASI:** kami belum bisa memastikan `/otp/verify` benar-benar menerbitkan `userToken` untuk email **tanpa akun** — itu hanya bisa dibuktikan dengan pembeli asli. **Belum dipromosikan ke production**; production masih PR #418 (pesan sebab saja, tanpa tombol verifikasi).
  - **Tidak ada webhook pembelian sama sekali.** `sync-ticket-events` hanya menarik `/events` dan menyimpan `sold_count` **agregat**, tak pernah identitas pembeli. Terukur 2026-09-08: Sports Summit live `sold`=**1233** vs `my20fit_ticket_events.sold_count`=**1162** (sync 2026-09-07 21:00) → **+71 terjual sejak sync**, sementara di DB kami **nol baris hari itu**. Pembayaran berhasil dan tercatat di ticket.20fit.id, tapi kami tak punya cara tahu siapa pembelinya — **tidak ada baris yang bisa "diperbaiki" di sisi kami.**
  - **TANYA PEMILIK ticket.20fit.id:** permintaan teknisnya sudah ditulis lengkap di **`docs/TICKET-API-REQUEST.md`** — intinya minta **webhook pembelian** atau **endpoint partner baca pesanan per email**. Sampai salah satunya ada, tiket pembeli tamu hanya bisa muncul lewat verifikasi OTP manual.
  - **Arsip `event_transaction` bukan data hidup** — impor batch invoice, `paid_at` terbaru 2026-08-11, impor terakhir 2026-08-18. Tetap disajikan (isinya pembelian nyata; 242 dari 1374 user app punya email di sana) tapi ditandai `source:"archive"`. Pembelian baru tak akan pernah muncul di sana.
- **CMS admin fisioterapis BELUM ADA.** `my20fit_physiotherapists` sudah dipakai frontend, tapi belum punya seksi di `/admin-v2` seperti dokter & coach — untuk sekarang hanya bisa diedit lewat SQL. Endpoint `/api/admin/physiotherapists` juga belum dibuat.
- **Ikon 3D: latar menyatu di dalam file PNG.** Kotak CSS sudah transparan (`.s2-ic.s2-ic3d` → `background rgba(0,0,0,0)`, terverifikasi via computed style), jadi latar yang terlihat berasal dari file di `media.20fit.id`. **TANYA PEMILIK:** perlu PNG versi transparan. Ikon 3D **Reward** juga belum ada filenya — tile Rewards masih SVG (`ic:"gift"`).
- **dr. Ande belum ada foto.** URL yang diberikan menunjuk file dr. Anna; tidak dipasang demi menghindari salah orang. Sementara pakai placeholder inisial + penanda.
- **~15 instruktur lain belum masuk roster coach** (Elsen, Andro, Brian, YoKae, Gilang, Mae, Ista, dll). Kelas mereka tetap jalan, hanya tak punya kartu coach.

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
