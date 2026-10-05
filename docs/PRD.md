# PRD — my.20fit.id (20FIT Health Profile)

> **Dokumen:** Product Requirements Document (PRD) · **Versi:** 1.0 · **Tanggal:** 2026-10-05
> **Pemilik produk:** zidni@20fit.id · **Status:** Living document
> **Sumber:** disusun dari `CLAUDE.md`, `docs/STATUS.md`, dan pembacaan kode (`server.js`, `*.html`, `js/*.js`) per Okt 2026.
> Bagian bertanda **BELUM TERVERIFIKASI / TANYA PEMILIK** perlu konfirmasi sebelum dianggap final.

---

## 1. Ringkasan Produk (Executive Summary)

**my.20fit.id** adalah web app "20FIT Health Profile" — satu tempat bagi **member 20FIT** untuk
memantau kesehatan dan mengakses seluruh layanan ekosistem 20FIT. Aplikasi menyatukan: onboarding
profil, tracker kalori (scan makanan dengan AI), catatan kesehatan & aktivitas, jadwal & booking
kelas (Arena/Gym/Klinik), tiket event, paket membership, konten resep/berita, plus **console admin**
(RBAC) dan portal **corporate**.

**Proposisi nilai:** menggantikan pengalaman terpecah (data kesehatan, booking, event, foto, resep
tersebar di banyak kanal) dengan **satu dasbor terintegrasi** yang terhubung ke seluruh akun &
layanan 20FIT.

> ⚠️ **Bukan alat diagnosis medis.** Semua keterangan kesehatan bersifat informatif/suportif, bukan
> nasihat medis.

**Stack ringkas:** Vanilla HTML/CSS/JS (tanpa framework) + Node/Express (`server.js`) + Supabase
(Postgres + Auth + Edge Functions), deploy di Railway. Mobile-first, dwibahasa (EN/ID), light & dark mode.

---

## 2. Masalah & Visi

### 2.1 Masalah
- Member 20FIT berinteraksi dengan banyak produk terpisah (gym/arena, klinik, event ticketing,
  foto event, menu/resep, pembayaran) tanpa satu titik pandang kesehatan & akses.
- Data kesehatan pribadi (berat, BMI, tidur, hidrasi, kalori, aktivitas) tidak tercatat terpusat.
- Tidak ada "home" yang menyatukan jadwal, tiket, membership, dan progres kesehatan member.

### 2.2 Visi
Menjadi **health & lifestyle companion** resmi member 20FIT: satu login, satu profil, satu dasbor
yang menautkan kebugaran, nutrisi, jadwal/booking, event, dan komunitas 20FIT.

### 2.3 Prinsip produk
1. **In-app first** — fitur tampil di dalam my.20fit.id, bukan melempar user keluar (mis. resep,
   lihat §Recipe).
2. **Satu sumber kebenaran** — hindari duplikasi logika/data; satu komponen bersama dipakai lintas halaman.
3. **Mobile-first & inklusif** — EN/ID, light/dark, menangani loading/empty/error.
4. **Jujur soal batasan** — tidak mengarang data (QR, status, kuota); tampilkan fallback rapi.
5. **Aman by default** — RLS Supabase, akses admin ditegakkan server-side, rahasia hanya di env.

---

## 3. Tujuan & Non-Tujuan

### 3.1 Tujuan (Goals)
- Member bisa **onboarding** (profil kesehatan) dan melihat **dasbor** personal dalam < 1 menit.
- **Satu login** yang sama dengan akun 20FIT (FITCO), dengan Google & OTP sebagai alternatif.
- **Tracker harian** (kalori/scan AI, hidrasi, tidur, puasa, aktivitas) yang tersimpan per akun.
- **Akses layanan**: lihat & booking kelas, lihat tiket event + QR, jelajah membership, roster coach/dokter/fisio.
- **Console admin** untuk tim 20FIT mengelola konten, voucher, banner, email, laporan.
- **Portal corporate** untuk perusahaan memantau member mereka.

### 3.2 Non-Tujuan (Non-Goals)
- Bukan alat **diagnosis/terapi medis**.
- Bukan **payment gateway** sendiri — pembayaran diproses lewat API 20FIT (Xendit via FITCO), bukan Xendit langsung.
- Bukan **penerbit tiket/QR** — tiket & QR diterbitkan `ticket.20fit.id`; my.20fit.id hanya menampilkan.
- Tidak menambah **framework/bundler** (tetap vanilla JS) — keputusan arsitektur tetap.
- Tidak menyentuh tabel Supabase milik app lain (hanya namespace `my20fit_*`).

---

## 4. Target Pengguna & Persona

| Persona | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Member 20FIT** (primary) | Anggota gym/arena/klinik 20FIT | Pantau kesehatan, scan kalori, lihat jadwal/tiket, booking kelas, foto event |
| **Pembeli event** | Beli tiket event 20FIT (sering sebagai tamu) | Lihat tiket + QR untuk check-in gerbang |
| **Admin / Marketing / Staff 20FIT** | Tim internal | Kelola konten, voucher, banner, email blast, lihat laporan & metrik (RBAC) |
| **Corporate admin** | PIC perusahaan mitra | Pantau roster & aktivitas member korporat, kirim pesan |
| **Calon member** | Pengunjung belum login | Lihat landing login, daftar akun |

---

## 5. Ruang Lingkup (Scope)

### 5.1 In-scope
Auth & onboarding, dashboard (home), calorie/scan, activity tracker, recipe in-app, classes/booking
link, ticket wallet (event), membership (carousel), roster coach/dokter/fisio, payment (via API 20FIT),
email system, admin console (RBAC), corporate portal, i18n & dark mode, integrasi cuaca/AQI/foto event.

### 5.2 Out-of-scope (ditangani sistem lain)
- Pemrosesan pembayaran & webhook invoice → **backend 20FIT**.
- Penerbitan tiket & QR gerbang → **ticket.20fit.id**.
- Proses booking kelas (checkout kursi) → **booking.20fit.id**.
- Konten berita → **media.20fit.id** (same-tab, tanpa halaman internal).
- Pengukuran tubuh (timbangan Visbody S20) → integrasi menyusul (lihat `docs/VISBODY-SETUP.md`).

---

## 6. Modul & Kebutuhan Fungsional

> Legenda status: ✅ selesai · 🟡 sebagian · 🔭 roadmap/menunggu dependensi

### 6.1 Autentikasi & Akun — ✅
- **Login member**: utama via **FITCO** (`Auth.fitcoLogin`), fallback ke **password Supabase** (`Auth.signIn`).
- **Login Google (web)**: **Supabase OAuth redirect** (`Auth.googleOAuth` → `signInWithOAuth('google')`),
  balik ke `/login` lalu `routeAfterAuth`. **Bukan** Google Identity Services. Konfigurasi di Google
  Cloud + Supabase (lihat `docs/GOOGLE_LOGIN_SETUP.md`). *(App mobile pakai jalur ID-token server
  `verifyGoogleIdToken` + env `GOOGLE_CLIENT_ID(S)`.)*
- **OTP passwordless**: `/code-login`, kode dikirim via Resend; OTP diproses server (`/api/send-otp`, `/api/verify-otp`).
- **Reset password**: OTP email sendiri → set password Supabase (`/api/reset/request` + `/api/reset/confirm`),
  independen dari FITCO.
- **SSO masuk/keluar**: token 20FIT dioper dari app utama (`Auth.tokenLogin`); SSO keluar ke photo.20fit.id.
- **Sesi**: JWT Supabase di localStorage; fetch API memakai `Authorization: Bearer <await Auth.token()>`.
- **Kebutuhan**: setiap user yang sudah login tidak boleh diminta verifikasi ulang untuk melihat datanya sendiri.

### 6.2 Onboarding — ✅
- Isi profil: gender, tanggal lahir, tinggi, berat, tujuan utama (lose/muscle/health/fit), kondisi kesehatan.
- Simpan ke `my20fit_profile`. Routing pintar: profil belum lengkap → onboarding; belum punya password web → setpassword.

### 6.3 Dashboard (Home) — ✅
- **Konteks harian**: cuaca (`/api/weather`) & AQI (`/api/aqi`) — bila AQI tinggi, rekomendasi beralih ke kelas indoor.
- **Recommended Workouts**: rekomendasi kelas berdasar `main_goal` (atau AQI), link ke booking.
- **Wellness trackers** (customizable; sebagian pinnable via sheet "Customize your trackers"):
  Breathing exercise (pola 4-7-8/box/relax), Intermittent Fasting (timer jendela), Sleep, Hydration/Water,
  Health snapshot (berat/BMI), Calories, Photo, Ticket, Rewards.
- **Checklist harian**: air 8 gelas, tidur ≥7 jam, log makanan, breathing, olahraga (auto-centang bila metrik terpenuhi).
- **Menstrual cycle** (khusus wanita): fase + anjuran latihan.
- **Roster**: rail coach / dokter / fisioterapis (lihat §6.10).
- **Achievements**: badge progres.
- **Kebutuhan non-fungsional**: tiap widget menangani loading/empty/error; QR tetap kotak putih di dark mode.

### 6.4 Calorie Tracker & Scan AI — ✅
- **Scan makanan**: foto (AI via Edge Function/OpenRouter) + input teks; verdict per-item; log harian.
- **Kredit scan**: top-up via pembelian (lihat §6.7); idempoten lewat RPC `my20fit_credit_scan`.
- **Intermittent Fasting**: pilih gaya (16:8/18:6/OMAD/dll), timer jendela makan/puasa, info kkal/makan.
- Data per akun di `my20fit_profile` / `my20fit_daily_log` / `my20fit_scan_orders`.

### 6.5 Activity — ✅
- Halaman `/activity`: upload/isi workout, zona heart-rate, rencana harian AI, nutrisi, kebiasaan, ringkasan mingguan.
- **Scan screenshot health tracker** (sampai 5 gambar untuk satu sesi) via OpenRouter → `/api/activity/scan`.
- `/progress` **redirect 302 → `/activity`** (halaman lama via `?legacy=1`).
- Data dari `/api/activity/*` (day/workout/upload/scan/plan/goal).

### 6.6 Recipe (in-app) — ✅ (keputusan pemilik: JANGAN dilempar keluar)
- Halaman `/recipe`: grid resep + modal detail (bahan, langkah, kalori, P/K/L), Like/Save, tombol **Log Food** ke Calories.
- **120 resep resmi** (dwibahasa) dibaca **server** dari `js/recipes.js` → `/api/menu/catalog` & `/api/menu/recommend`.
- **67 artikel** (9 kategori) dari `my20fit_recipe_article` (service key; RLS deny-public tetap).
- Kontribusi user (`my20fit_menu_contribution`) — alur ada, data masih 0.
- Foto resep lewat resolver tunggal `resolveMenuPhoto()`; `/diet` redirect 301 → `/recipe`.

### 6.7 Pembayaran — ✅ (via API 20FIT)
- POST `/api/v1/third-party/shop/order` (`payment_type:"xendit-invoices"`) → **20FIT** terbitkan invoice & balik `checkout.xendit.co`.
- **Tidak ada webhook di sisi kita.** Kredit masuk via: (a) polling `/api/scan/order-status`, (b) sapuan server `/api/scan/reconcile` (by `auth_user_id`) — menyelamatkan pembayaran lintas-device.
- `success_redirect_url` di luar kendali kita → user tidak kembali ke my.20fit.id (jangan bangun logika kredit atas asumsi user kembali).

### 6.8 Ticket Wallet (Event) — 🟡
- Halaman `/event` + widget bersama (`js/ticket-wallet.js`, dipakai juga di dashboard): tab **"Tiket Saya"** + **"Upcoming"**.
- **Upcoming**: katalog event on_sale dari `my20fit_ticket_events` (`/api/events/upcoming`).
- **Tiket Saya** (`/api/tickets/mine`): TANPA OTP. Jalur partner server-ke-server (email sesi → embed ticket.20fit.id).
  Email yang dikenal penerbit → tiket + **QR** asli; email belum dikenal → **arsip** `event_transaction` (tanpa QR).
- **Halaman E-Ticket**: kartu event (cover, nama, badge status VALID/USED/EXPIRED/CANCELLED, tanggal WIB) + satu kartu per tiket (label, QR besar, kode + salin, Holder, jenis tiket). Cover event dilengkapi dari katalog bila cocok (event yang sama).
- **🔭 Gap**: pembeli yang emailnya belum dikenal penerbit hanya dapat arsip **tanpa QR**. Hanya tim ticket.20fit.id yang bisa menutup ini (lihat `docs/TICKET-API-REQUEST.md §5`).

### 6.9 Classes / Booking & Membership — 🟡
- `/classes`: toggle **Arena/Gym** in-page; `?venue=clinic` = Book Recovery. Jadwal dibaca dari Supabase (`arena_class_schedules`/`gym_class_schedules`) via `/api/classes/schedule`. Checkout kursi di `booking.20fit.id`.
- Riwayat arena: `/api/arena/history` proxy ke arena-api (member-scoped).
- **Membership** (`/membership`): carousel — **data belum tersambung** (butuh `MEMBERSHIP_CATALOG_PATH` + finalisasi `/api/membership/packages`).

### 6.10 Roster Coach / Dokter / Fisioterapis — ✅
- Tiga rail di home + halaman `/team` ("all coaches"): `/api/coaches`, `/api/doctors`, `/api/physiotherapists` (CMS `my20fit_coaches`/`my20fit_doctors`/`my20fit_physiotherapists`).
- Coach bisa **duo** (mis. "Josea & Ade"); kelas terkait ditautkan lewat `my20fit_coach_instructor_aliases` (match verbatim ke kolom `instructor` jadwal) → halaman "Classes by …" seperti di app.
- Kartu tanpa `photo_url`/gambar gagal dimuat → fallback inisial/"Foto belum ada".

### 6.11 Admin Console — ✅
- `/admin-dashboard` (lama) + `/admin-v2` (redesign; default di staging). **RBAC** (`my20fit_admin_roles`): `marketing` (dibatasi data kesehatan)/`viewer`/`staff`/`superadmin`. `ADMIN_KEY` = master key opsional.
- Section: Overview/Revenue/User/Scan/Marketing/Voucher/Banner/Menu/Corporate/Reports/Settings.
- Ditegakkan **server-side** (`requireAdmin`), bukan hanya UI. `/api/admin/*` (~53 route).

### 6.12 Email System — ✅
- Satu jalur `lib/email.js` (Resend). Consent dihapus → kirim langsung; opt-out via unsubscribe/suppression/frequency.
- Blast wizard, automations, kill switch, webhook Resend (`/api/webhooks/resend`, verifikasi Svix).

### 6.13 Corporate Portal — ✅
- `/corp-dashboard`: login password Supabase (fallback FITCO); isolasi antar-perusahaan server-side (`requireCorpAdmin`). Roster member + pesan.

### 6.14 Voucher / Banner / Rewards — ✅
- Voucher (logging/tracking/bulk), promo banner (render dashboard + `GET /b/:id` standalone), Rewards (voucher aktif user + kode klaim).

---

## 7. Alur Pengguna Utama (Key Flows)

1. **Login → Dashboard:** buka `/login` → FITCO/Google/OTP → `routeAfterAuth` cek kelengkapan profil → onboarding/setpassword bila perlu → `/dashboard`.
2. **Scan kalori:** `/calories` → scan foto/teks → verdict per-item → log → kredit scan berkurang (top-up bila habis).
3. **Lihat tiket + QR:** `/event` → "Tiket Saya" → buka E-Ticket → QR per tiket untuk check-in (tanpa OTP).
4. **Booking kelas:** `/classes` → pilih Arena/Gym → pilih jadwal → checkout di booking.20fit.id.
5. **Admin:** `/admin-v2` → login (password Supabase/master key) → kelola section sesuai role.

---

## 8. Arsitektur Teknis & Stack

| Layer | Pilihan |
|---|---|
| Runtime | Node.js ≥18, Express 4 (`server.js`, ~123 route) |
| Frontend | **Vanilla HTML/CSS/JS** (tanpa framework/bundler). Halaman `.html` di root (URL bersih), logika bersama di `js/*.js` (`window.*`). Chart = inline SVG |
| Styling | `<style>` per halaman + `css/20fit-design-system.css` (token `--fit-*`) + `css/glass-app.css` (skin + dark mode) |
| DB/Auth | **Supabase** (Postgres + Auth + Edge Functions), project `cpvzwqptzcxnwzfzgrmt` (shared "20FIT ALL DATA") |
| Deploy | **Railway** — `main`=produksi (my.20fit.id), `staging`=staging; auto-deploy per branch |

**Konvensi kunci:** routing bersih (`<nama>.html` → `/<nama>`); design token (jangan hardcode warna);
dark mode via class `theme-light`; i18n `js/i18n.js`; **dilarang `target="_blank"`/`window.open`** untuk
navigasi; tiap fetch tangani loading/empty/error.

**File rapuh (hati-hati):** `server.js` (besar), `js/auth.js` / `i18n.js` / `nav.js` (shared), `js/vendor-supabase.js` (JANGAN diedit).

---

## 9. Integrasi Eksternal

| Layanan | Fungsi |
|---|---|
| **FITCO API** | Login/register/SSO/Google, shop order (Xendit via 20FIT) |
| **ticket.20fit.id** (embed API) | Katalog event, tiket + QR per user (butuh user-token); tidak ada list-by-email/webhook |
| **arena-api** | Jadwal kelas + membership + riwayat member (`ARENA_API_KEY`) |
| **Resend** | Email transaksional + blast (webhook Svix) |
| **Meta Pixel + CAPI** | Tracking konversi |
| **WAQI** | Air Quality Index |
| **Pexels / TheMealDB** | Foto makanan (resolver tunggal) |
| **Edge Functions** | AI (`my20fit-ai`, `my20fit-foodimg`), `ticket-embed`, `sync-ticket-events` |
| **booking.20fit.id / photo.20fit.id / media.20fit.id** | Booking kelas, foto event (SSO), berita |

---

## 10. Model Data (ringkas — hanya `my20fit_*` yang kita miliki)

Prefiks **`my20fit_*`** = milik app ini (boleh diubah). Tabel tanpa prefiks milik app lain (JANGAN disentuh).
Contoh tabel inti: `my20fit_profile`, `my20fit_daily_log`, `my20fit_scan_orders`/`my20fit_scan_ledger`,
`my20fit_coaches` (+`my20fit_coach_instructor_aliases`), `my20fit_doctors`, `my20fit_physiotherapists`,
`my20fit_ticket_events`, `my20fit_recipe_article`, `my20fit_menu_contribution`, `my20fit_vouchers`,
`my20fit_promo_banners`, `my20fit_admin_roles`, `my20fit_corporate*`, `my20fit_email_*`.
**RLS deny-public**; akses admin lewat service key (bypass RLS) di server. Detail skema → `docs/DATABASE.md`.

---

## 11. Auth & Peran (ringkas)

- **Member:** FITCO/Google/OTP → sesi Supabase (JWT).
- **Admin:** master key `ADMIN_KEY` (superadmin) atau JWT admin dengan baris di `my20fit_admin_roles` (role `marketing`/`viewer`/`staff`/`superadmin`). Ditegakkan `requireAdmin`.
- **Corporate:** password Supabase (fallback FITCO), isolasi per-perusahaan (`requireCorpAdmin`).

---

## 12. Kebutuhan Non-Fungsional

- **Keamanan:** rahasia hanya di Railway env (CI gitleaks + `node --check` memblokir commit rahasia); RLS deny-public; akses admin server-side; QR = kredensial (jangan buka ke user lain).
- **Privasi/medis:** bukan alat diagnosis; keterangan bersifat suportif.
- **Mobile-first & responsif:** target utama perangkat mobile (dibuka sambil antre di gerbang, dll).
- **i18n:** EN/ID (default `id`), toggle otomatis.
- **Dark mode:** adaptif via token; elemen kontras-kritis (QR) tetap putih.
- **Reliabilitas:** tiap fetch tangani loading/empty/error + retry; tahan-gagal (fallback rapi, bukan crash).
- **Performa:** hindari bundel besar di browser (mis. katalog resep 291KB dipindah ke server).
- **Observability:** incident playbook di `docs/STATUS.md §0` (container Railway staging bisa unhealthy → redeploy/raise resource).

---

## 13. Metrik Keberhasilan (Success Metrics) — usulan, TANYA PEMILIK

- **Aktivasi:** % user baru yang menyelesaikan onboarding; waktu login→dashboard.
- **Engagement:** DAU/MAU, jumlah scan kalori/hari, checklist harian terpenuhi, hidrasi/tidur tercatat.
- **Konversi layanan:** klik booking kelas, lihat tiket, beli membership/kredit scan.
- **Retensi:** return rate mingguan, streak achievements.
- **Operasional:** error rate `/api/*`, keberhasilan pembayaran (reconcile), deliverability email (Resend).

---

## 14. Lingkungan & Deploy

- **Branch:** fitur → PR `staging` → merge → PR `staging` → `main` → merge. **JANGAN** langsung ke `main`. Tunggu CI hijau.
- **Railway:** `main` = produksi (my.20fit.id), `staging` = staging; auto-deploy per branch.
- **Verifikasi sebelum push:** `node --check server.js` + cek sintaks inline JS tiap HTML; grep `target="_blank"`/`window.open`.
- **Migration:** manual di Supabase SQL Editor (lihat `docs/DATABASE.md`); perubahan env diminta ke pemilik (agent tak bisa set Railway env).

---

## 15. Status Saat Ini & Roadmap

**Jalan (✅):** auth, onboarding, dashboard, calorie/scan, activity, recipe in-app, email, admin, voucher/banner/rewards, corporate, jadwal kelas, roster coach/dokter/fisio, ticket wallet (dasar), Google login (Supabase OAuth), reset password mandiri.

**Setengah jadi / menunggu dependensi (🟡/🔭):**
1. **Membership berdata** — set `MEMBERSHIP_CATALOG_PATH` + finalkan `/api/membership/packages`.
2. **QR tiket untuk pembeli tak dikenal penerbit** — butuh endpoint partner dari tim ticket.20fit.id (`docs/TICKET-API-REQUEST.md §5`).
3. **admin-v2 #293** — putuskan merge (sessionStorage master key + banner login).
4. **Integrasi Visbody S20** (timbangan komposisi tubuh) — `docs/VISBODY-SETUP.md`.
5. **CMS fisioterapis di admin-v2** — baru bisa via SQL.
6. **Refresh `docs/CODEBASE-MAP.md`** yang sebagian stale.

---

## 16. Risiko, Asumsi, Ketergantungan

| Risiko / Asumsi | Dampak | Mitigasi |
|---|---|---|
| Ketergantungan ke backend 20FIT (pembayaran, redirect) di luar kendali | Alur bayar/redirect bisa berubah tanpa kabar | Tidak membangun logika kredit atas asumsi user kembali; reconcile server-side |
| QR tiket di luar kendali (ticket.20fit.id) | Pembeli tamu tak dapat QR | Permintaan endpoint partner; tampilkan arsip + arahkan ke penerbit |
| Supabase shared antar banyak app | Perubahan salah tabel bisa rusak app lain | Hanya sentuh `my20fit_*`; RLS |
| Container Railway staging bisa unhealthy | Semua `/api/*` gagal bareng | Redeploy; naikkan resource (butuh dashboard Railway) |
| Vanilla JS, file `server.js` besar & rapuh | Mudah regresi | `node --check`, grep referensi, perubahan kecil & fokus |
| Env/kredensial dikelola pemilik | Fitur mati bila env kosong (mis. Google, Arena) | Dokumen setup per fitur; minta pemilik isi |

---

## 17. Lampiran

### 17.1 Peta route (ringkas)
- **Publik/auth:** `/` (→`/login`), `/login`, `/code-login`, `/verify`, `/reset-password`, `/setpassword`, `/onboarding`, `/unsubscribe`, `/privacy`.
- **Member:** `/dashboard`, `/activity` (`/progress`→302), `/calories`, `/profile`, `/medical`, `/recipe` (`/diet`→301), `/classes`, `/membership`, `/event`, `/team`, `/payment/*`.
- **Admin:** `/admin`(→`/admin-dashboard`), `/admin-dashboard`, `/admin-v2`, `/admin-email`, `/corp-dashboard`.
- **API:** `/api/*` (~123) — user, admin (`/api/admin/*`), corporate (`/api/corp/*`), cron (`/api/cron/*`), webhook.

### 17.2 Variabel environment utama
Lihat `CLAUDE.md §E` / `.env.example`. Wajib: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`🔒,
`FITCO_PARTNER_TOKEN`🔒, `EMAIL_RESEND_API`🔒, `ARENA_API_KEY`🔒. Opsional/kondisional: `GOOGLE_CLIENT_ID(S)`
(login Google app mobile), `META_*`, `WAQI_TOKEN`, `PEXELS_API_KEY`, `CRON_SECRET`, dll.

### 17.3 Glosarium
- **FITCO** = sistem akun/API 20FIT (login, shop order).
- **Arena / Gym / Klinik** = jenis venue kelas 20FIT.
- **E-Ticket** = tampilan tiket event + QR per pemegang (diterbitkan ticket.20fit.id).
- **Customize trackers** = sistem pin/urut kartu widget di dashboard.
- **RBAC** = Role-Based Access Control console admin.

### 17.4 Dokumen terkait
`docs/STATUS.md` (status hidup), `docs/DATABASE.md` (skema), `docs/CODEBASE-MAP.md` (arsitektur/route),
`docs/TICKET-API-REQUEST.md` (permintaan ke ticket.20fit.id), `docs/GOOGLE_LOGIN_SETUP.md`,
`docs/VISBODY-SETUP.md`, `docs/PRODUCTS-MENU-SSO.md`, `docs/EMAIL-*.md`.

---

*PRD ini living document — perbarui saat arsitektur/route/skema/status fitur berubah (lihat `CLAUDE.md §K`).*
