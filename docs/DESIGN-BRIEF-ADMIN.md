# DESIGN BRIEF — Admin Dashboard my.20fit.id

> Dokumen konteks untuk **AI perancang UI yang tidak punya akses ke codebase**.
> Semua isi diambil dari kode & database nyata (per 2026-08-12). Bagian yang
> **belum ada** ditandai jelas — jangan dianggap ada. Bahasa Indonesia; istilah
> teknis & label UI dibiarkan dalam bahasa aslinya. Ini dokumen deskriptif, bukan kode.

---

## 1. Ringkasan produk
**my.20fit.id** adalah aplikasi web/PWA "Health Profile" untuk member ekosistem **20FIT** (gym/klinik/arena, mayoritas Jakarta). Fitur utama untuk user: **scan kalori makanan lewat foto**, tracker kalori/puasa (intermittent fasting), progress kesehatan, dan hasil medical check-up. **Produk revenue-nya = paket "scan credit"** (top-up kuota scan) yang dibayar via **Xendit lewat API 20FIT**. Saat ini ada **892 profil user**.

---

## 2. Siapa yang memakai admin dashboard

### Role (RBAC ditegakkan di server, tabel `my20fit_admin_roles`)
Ada **4 role** dengan hierarki rank (`ADMIN_RANK`):

| Role | Rank | Boleh | Tidak boleh |
|---|---|---|---|
| `superadmin` | 3 | Semua: kelola role, corporate, voucher, hapus data | — |
| `staff` | 2 | Baca semua + edit template email, kirim tes, tambah suppression | Kelola role, voucher create, corporate |
| `viewer` | 1 | Baca metrik, campaign, user (kontak & komersial), transaksi | Semua aksi tulis |
| `marketing` | 1 | Sama seperti viewer **TAPI DILARANG data kesehatan** (berat/tinggi/umur/gender/tujuan/kondisi/siklus/MCU) — dipangkas di level API, bukan cuma disembunyikan UI | Data kesehatan, aksi tulis |

- **Master `ADMIN_KEY`** (via `?key=` / header) = akses `superadmin` (bootstrap, dipakai `admin.html` lama).
- **Kenyataan sekarang:** hanya ada **4 baris role, semuanya `superadmin`**. Role `staff`/`viewer`/`marketing` **sudah didukung kode tapi belum dipakai** (0 user). Jadi hari ini praktis **±4 orang superadmin**.

### Perangkat (desktop/mobile)
**Belum ada data device eksplisit.** Tabel aktivitas (`my20fit_user_activity`) hanya menyimpan `last_page` & `ping_count` — tidak ada user-agent / flag device. Halaman admin saat ini **berorientasi desktop** (tabel lebar; `admin-email.html` tanpa `@media`, `admin-dashboard.html` hanya 2 query `@media`).

---

## 3. Pekerjaan utama admin (jobs to be done)
> **Catatan jujur:** frekuensi buka tiap halaman admin **belum terukur** — tidak ada instrumentation khusus untuk halaman admin. Urutan di bawah disimpulkan dari kekayaan fitur di kode, **bukan** dari data klik. Tandai untuk konfirmasi pemilik.

| Pekerjaan | Pertanyaan yang dijawab | Perkiraan frekuensi | Cara sekarang | Kesulitan sekarang |
|---|---|---|---|---|
| Pantau pertumbuhan & onboarding | Berapa user baru? Berapa yang selesai onboarding? | Harian | `/admin-dashboard` → Overview + Funnel konversi (`/api/admin/onboarding-recap`, `/onboarding-scan`) | Banyak angka tersebar di beberapa section |
| Pantau revenue & pembayaran | Berapa penjualan? Ada pembayaran gagal/nyangkut? | Harian | Section Metode pembayaran + Progress penjualan (`/api/admin/metrics`, `/transactions`, `/top-products`) | **26 order `pending` + 15 `failed`** menumpuk — tak ada alert |
| Kelola user | Cari user, lihat riwayat scan/kredit/bayar/email, ganti email | Harian/mingguan | Section Pengguna (`/api/admin/users`, `/user-detail`, `/user/change-email`, `/user/bulk-import`) | Daftar 892 user butuh cari/filter yang kuat |
| Analitik & atribusi marketing | Trafik dari sumber mana? Retensi cohort? | Mingguan | Section Analitik (`/api/admin/analytics`, `/attribution`) | Banyak tab; sulit lihat "yang penting" cepat |
| Kelola email/campaign | Campaign mana perform? Siapa klik? Matikan campaign? | Mingguan/sesekali | `/admin-email` (`/api/admin/email/*`) | Halaman terpisah dari dashboard utama |
| Approve menu diet | Menu AI mana yang perlu di-review? | Sesekali | Section Menu Review (`/api/admin/menu`) | — |
| Corporate & voucher | Kelola perusahaan mitra, buat voucher | Sesekali | Section Corporate + Voucher | — |

---

## 4. Halaman admin yang ada sekarang

### a. `/admin-dashboard` — `admin-dashboard.html` (dashboard utama, RBAC)
Halaman utama, banyak section (bukan multi-page — satu halaman panjang bertab/berkartu). Section nyata yang ada:
- **Overview / Ringkasan** — metrik agregat (`/api/admin/metrics`, `/config`, `/me`).
- **Analitik** — Funnel konversi, Per campaign, Per medium, Per `utm_source`, Per referrer, **Perbandingan bulan-ke-bulan (revenue)**, **Retensi & pembeli per cohort**, Progress penjualan (`/api/admin/analytics`).
- **Produk terlaris** — by revenue & by jumlah transaksi (`/api/admin/top-products`).
- **Metode pembayaran** — sebaran payment method.
- **Pengguna** — Data profil, **Email (timeline per user)**, Kelola akun (superadmin), **Import CSV**, ganti email (`/api/admin/users`, `/user-detail`, `/user/change-email`, `/user/create`, `/user/bulk-import`, `/user/audit`).
- **Menu Review / Minat Menu / Minat per tipe menu** — approve/reject menu diet (`/api/admin/menu`, `/menu-analytics`).
- **Corporate Health Program** — Daftar/Buat perusahaan, kelola admin corporate (`/api/admin/corporate`).
- **Admin & Role** — Kelola akun, **Log Aktivitas Admin** (`/api/admin/roles`, `/audit`).
- **Voucher** — buat/aktif/nonaktif (`/api/admin/vouchers`).
- **Attribution / Sumber Trafik** (`/api/admin/attribution`).
- **Export CSV** (`/api/admin/export-csv`).

**Data yang ditampilkan** (nama kolom nyata) — lihat §5. **Aksi:** filter window (hari), search user, export CSV, ganti/ tambah/import user, approve menu, buat voucher, assign role.
**Masalah yang terlihat:** satu halaman sangat padat (≥10 section) tanpa hierarki jelas; pembayaran `pending`/`failed` tidak dimunculkan sebagai peringatan; tidak responsif untuk mobile.

### b. `/admin-email` — `admin-email.html` (konsol Email & Campaign)
Fokus email. Isi: **Panel Kesehatan Email** (env, domain, scheduler, guardrail), Kirim Blast (wizard 6 langkah + segmen preset), Template Email (edit & preview), Kill switch campaign, statistik Onboarding & Meal reminder (30 hari), **Analitik per Campaign** (Kirim/Terkirim/Buka%/**Klik%**/Bounce%/Complaint%) dengan drill-down (Klik / Buka-tak-klik / Belum buka + **daftar link paling banyak diklik** + Export CSV), Suppression list.
`/api/admin/email/*` (overview, campaigns, campaign, campaign/links, health, suppression, segments, templates, sends, automations).
**Masalah:** tidak responsif (`@media` = 0); terpisah dari dashboard utama; open-rate sudah diberi label "tidak akurat" tapi visual masih setara click-rate.

### c. `/admin` — `admin.html` (admin lama)
Shell admin lama, di-gate `ADMIN_KEY`. `/admin` diarahkan ke `/admin-dashboard` (per CLAUDE.md). **Fungsinya sudah digantikan** oleh `admin-dashboard.html`; kandidat untuk dipensiunkan.

---

## 5. Data yang tersedia (untuk desainer — paling penting)

### Entitas & field nyata (dari schema `my20fit_*`)

**User — `my20fit_profile`** (35 kolom):
`id, auth_user_id, email, full_name, phone, email_verified_at, is_plus_member, age, gender, gender_selected_at, height_cm, weight_kg, activity_level, gym_experience, daily_schedule, onboarding_completed, onboarding_skipped_at, created_at, updated_at, cycle_last_period, cycle_length, notifications_enabled, avatar_url, migrated_v1, main_goal, health_conditions, scan_count, scan_period, scan_credits, last_period_date, period_length, fitco_user_id, fitco_linked_at, fitco_email_verified, home_prefs, home_prefs_updated_at`
> ⚠️ **Field kesehatan** (`age, gender, height_cm, weight_kg, activity_level, main_goal, health_conditions, cycle_*, period_*`) — role `marketing` DILARANG melihatnya. Jangan tampilkan lebih dari perlu (lihat §9).

**Kredit scan:** `my20fit_profile.scan_credits` (saldo) + `my20fit_scan_ledger` (`delta`, `reason` = `purchase|voucher|consume_free|consume_paid|admin_adjust|refund`, `balance_after`, `reff_no`, `created_at`).

**Scan / catatan harian — `my20fit_daily_log`:** `log_date, cal_items` (JSON hasil scan kalori: makanan + kalori + waktu), plus wellness (`mood, energy, stress, soreness, sleep_hours, water_glasses, weight_kg`, dst). `my20fit_profile.scan_count`/`scan_period`.

**Transaksi — `my20fit_scan_orders`:** `reff_no, auth_user_id, credits, amount` (gross), `net_amount` (setelah voucher), `provider, status` (`pending|paid|failed|expired|cancelled`), `order_type, voucher_id, payment_method, gateway_reference_id, payment_link_id, created_at, paid_at`.

**Email:** `my20fit_message_log` (per kirim: status, sent/delivered/opened/clicked/bounced/complained timestamps, campaign_id, channel, subject, language), `my20fit_email_events` (per event webhook: `event_type, clicked_url, occurred_at, raw_payload`), `my20fit_suppression_list`, `my20fit_campaign_enrollments`, `my20fit_email_sends`/`_recipients`, `my20fit_email_templates`, `my20fit_email_automations`, `my20fit_user_comm_prefs` (consent + `lang`).

### Tabel ketersediaan metrik

| Metrik | Data tersedia? | Sumber |
|---|---|---|
| Total user terdaftar (892) | **Ya** | `my20fit_profile` |
| User baru per hari/minggu | **Ya** | `my20fit_profile.created_at` |
| Funnel onboarding (selesai vs skip) | **Ya** | `onboarding_completed`, `onboarding_skipped_at` |
| Scan per hari | **Ya** | `my20fit_daily_log.cal_items`, `scan_count` |
| Saldo & riwayat kredit scan | **Ya** | `scan_credits`, `my20fit_scan_ledger` |
| Revenue / order (paid/pending/failed) | **Ya** | `my20fit_scan_orders` |
| Revenue per paket / produk terlaris | **Ya** | `my20fit_scan_orders` + `/api/admin/top-products` |
| Metode pembayaran | **Ya** | `my20fit_scan_orders.payment_method` |
| Atribusi trafik (utm/referrer) | **Ya** | `my20fit_signup_attribution` |
| Retensi / cohort pembeli | **Ya** | `/api/admin/analytics` |
| Email: terkirim/delivered/open/click/bounce | **Ya (baru)** | `my20fit_message_log` + `my20fit_email_events` |
| **Click rate email** | **Ya (baru)** | `my20fit_email_events` (`event_type='clicked'`, `clicked_url`) |
| Link mana paling banyak diklik | **Ya (baru)** | `/api/admin/email/campaign/links` |
| Bahasa user | **Ya** | `my20fit_user_comm_prefs.lang` |
| **Akurasi kalori / koreksi user atas hasil scan** | **BELUM** | Tak ada field koreksi di `daily_log`/`scan_ledger`. Perlu instrumentasi baru |
| **Device admin (desktop/mobile)** | **BELUM** | `user_activity` tak simpan user-agent |
| **Frekuensi buka halaman admin** | **BELUM** | Tak ada instrumentation khusus admin |
| **Waktu/latency scan berhasil vs gagal** | **BELUM** (parsial) | Status scan tak dilog terstruktur di admin |

---

## 6. Halaman baru yang direncanakan (yang perlu didesain)

**a. Dashboard utama (5 detik pertama).** Pertanyaan: "Apakah bisnis sehat hari ini?" Tampilkan: user baru hari ini, scan hari ini, **revenue realized + jumlah `paid`**, dan **peringatan**: order `pending`/`failed` menumpuk, email bounce/complaint tinggi. Data: `profile`, `daily_log`, `scan_orders`, `message_log`. (Saat ini info ini tersebar; belum ada satu "hero" ringkas.)

**b. Manajemen user.** Pertanyaan: "Siapa user X, apa yang dia lakukan?" Daftar + cari + filter (onboarding, plus member, punya kredit, pembeli) + detail per user (profil kontak, **riwayat scan**, **ledger kredit**, **pembayaran**, **timeline email**). Data: `profile`, `scan_ledger`, `daily_log`, `scan_orders`, `message_log`. (Sebagian **sudah ada** di section Pengguna + `/api/admin/user-detail`.)

**c. Email analytics.** Per campaign: terkirim, delivered, **open rate, click rate**, bounce. Klik campaign → daftar siapa yang klik + link terpopuler. Data: `message_log`, `email_events`. **CATATAN DESAINER: buat click rate lebih menonjol dari open rate** — open rate tidak akurat (pemblokiran gambar + Apple Mail Privacy Protection). (**Sudah ada** di `/admin-email`, tinggal dinaikkan hierarki visual click-rate.)

**d. Manajemen email.** Tambah user, ganti email user, import CSV, **audit log** perubahan. Data: `profile`, Supabase Auth, `my20fit_admin_audit_log`. (**Sudah ada** di section Pengguna + `/user/change-email`, `/create`, `/bulk-import`, `/user/audit`.)

**e. Monitoring akurasi kalori.** Pertanyaan: "Seberapa akurat scan? Mana yang meleset jauh?" Daftar scan yang dikoreksi user, sebaran error. **Data BELUM ADA** — perlu bangun dulu pelacakan koreksi (mis. simpan nilai asli vs nilai setelah user edit di `cal_items`). Tandai ke pemilik sebelum didesain.

**f. Transaksi & revenue.** Daftar pembayaran + filter status/tanggal, **revenue per paket**, **pembayaran gagal/pending**. Data: `scan_orders`. (**Sudah ada** sebagian di section Metode pembayaran + `/api/admin/transactions`, `/top-products`.)

---

## 7. Prioritas & hierarki informasi

**Paling menonjol (urutan):**
1. **Revenue & pembayaran** — realized revenue, jumlah `paid`, dan **alert `pending`(26)/`failed`(15)**. Ini uang; harus paling atas.
2. **Pertumbuhan & onboarding** — user baru + % selesai onboarding.
3. **Aktivitas scan** — scan/hari (produk inti).
4. **Kesehatan email** — bounce/complaint rate, scheduler jalan.

**Butuh perhatian segera (alert di dashboard utama):**
- Order `pending`/`failed` menumpuk (kondisi nyata sekarang).
- Email bounce/complaint melewati ambang (complaint >0.1%, bounce >2%).
- (Kalau §6e dibangun) lonjakan scan error / koreksi.

**Cukup di halaman dalam:** analitik cohort/atribusi, menu review, corporate, voucher, template email, suppression list, audit log.

---

## 8. Batasan teknis & desain

- **Stack UI: vanilla HTML/CSS/JS — TIDAK ada framework** (tanpa React/Vue/Tailwind/Bootstrap/shadcn). Chart = **inline SVG**. Backend Node/Express, DB Supabase, deploy Railway.
- **Design system: `css/20fit-design-system.css`** ("Glass Minimalist", glassmorphism) + `css/glass-app.css`. Token brand (light / dark):
  - **Merah brand (`--fit-red`): `#E4002B`** (light) / `#FF3B57` (dark) — CTA, nav aktif, urgent.
  - Status: biru `#0068C9` (in progress), amber `#C77A00` (review), hijau `#1C8A4B` (done).
  - Ink: `#1D1D1F` (teks utama) / `#6E6E73` (sekunder) / `#9A9A9E` (faint).
  - Background gradient hangat→dingin: `#F2E9E6` → `#E9EEF3`. Garis: `rgba(29,29,31,.08)`.
  - Glass surface: `rgba(255,255,255,.55)`; blur `28px`; radius `22px` (kartu) / `14px` (kecil); shadow `0 8px 30px rgba(29,29,31,.07)`.
  - **Dark mode ada** (varian token kedua). Merah & hitam memang dominan — dikonfirmasi.
  - ⚠️ **Inkonsistensi:** template EMAIL memakai merah berbeda (`#D62828`, `#C41101`) — bukan `--fit-red`. Untuk admin, pakai `#E4002B`.
- **Font (3 peran, jangan ditukar):** `Barlow Condensed` (display: heading, nav, tombol, **angka statistik** — UPPERCASE), `Manrope` (body: nama, deskripsi), `JetBrains Mono` (**tanggal, uang, email, ID**). Anton dipakai di template email saja.
- **Bilingual ID & EN** (`js/i18n.js`, toggle tersimpan di `localStorage "lang"`). Teks Indonesia 15–30% lebih panjang — desain harus toleran label memanjang (jangan truncate agresif).
- **Volume data:** ~**892 user** (tabel user butuh **pagination/search**, belum perlu virtual scroll). Order 56, ledger 145, daily_log 489 — kecil. Skala akan tumbuh.
- **Mobile:** admin sekarang **desktop-first** (minim `@media`). Konfirmasi ke pemilik apakah admin perlu jalan di mobile — kalau ya, ini pekerjaan baru.

---

## 9. Yang harus dihindari
- **Jangan pamerkan data kesehatan** (`weight_kg`, `height_cm`, `health_conditions`, `cycle_*`, detail makanan `cal_items`) lebih dari yang diperlukan admin untuk bekerja. Role `marketing` bahkan diblokir total dari field ini di API — desain harus menghormati itu (jangan bikin kartu yang bocor data kesehatan ke role yang tak berhak).
- **Jangan dashboard penuh metrik hiasan** tanpa aksi. Setiap kartu harus menjawab pertanyaan nyata (§3) atau memicu tindakan (§7).
- **Jangan grafik cantik tanpa pertanyaan.** Open-rate besar-besar = menyesatkan; utamakan click-rate & angka revenue/alert yang bisa ditindaklanjuti.

---

## 10. Lampiran: contoh bentuk data (disintesis dari bentuk nyata — BUKAN user asli)
> Nama & email disamarkan/disintesis. Angka & format mengikuti data nyata.

**User (`my20fit_profile`):**
| full_name | email | created_at | onboarding_completed | scan_count | scan_credits | is_plus_member |
|---|---|---|---|---|---|---|
| Nadia Pratiwi (14 char) | n***@gmail.com | 2026-08-12 | true | 0 | 0 | false |
| Yusuf Rahman (12 char) | y***@uob.co.id | 2026-08-12 | false | 3 | 8 | false |

**Transaksi (`my20fit_scan_orders`):**
| reff_no | credits | amount | net_amount | status | payment_method | created_at | paid_at |
|---|---|---|---|---|---|---|---|
| SCAN… | 150 | 150000 | 0 | paid | voucher | 2026-07-29 | 2026-07-29 |
| SCAN… | 10 | 25000 | 25000 | expired | – | 2026-07-24 | – |
| SCAN… | 150 | 150000 | 150000 | pending | – | 2026-07-24 | – |
> Paket nyata: **150 kredit = Rp150.000**, **10 kredit = Rp25.000**. Banyak `paid` lewat **voucher** (`net_amount` = 0) → **realized cash revenue masih sangat kecil**; mayoritas order `pending`/`failed`.

**Ledger kredit (`my20fit_scan_ledger`):**
| delta | reason | balance_after | created_at |
|---|---|---|---|
| −1 | consume_free | 0 | 2026-08-11 |
| −1 | consume_paid | 1142 | 2026-08-11 |
| +150 | purchase | 150 | 2026-07-29 |

**Email (`my20fit_message_log` / `email_events`):** struktur siap, tapi **0 baris** (sistem email baru live, belum mengirim). Contoh bentuk: `{ status:"clicked", campaign_id:"onboarding_no_scan", clicked_url:"https://my.20fit.id/calories.html#camera", occurred_at:"2026-08-12T..." }`.

---

## LAMPIRAN A — Hal yang TIDAK saya temukan di kode (perlu kamu jawab)
1. **Frekuensi buka tiap halaman admin** — tak ada instrumentation; urutan prioritas di §3/§7 adalah dugaan dari fitur, bukan data. Konfirmasi mana yang benar-benar sering dipakai.
2. **Admin pakai desktop atau mobile?** Tak terekam (tak ada device data). Perlu jawabanmu apakah admin wajib jalan di mobile.
3. **Apakah role `staff`/`viewer`/`marketing` akan benar-benar dipakai?** Sekarang 0 (semua superadmin). Kalau ya, desain butuh state "role terbatas".
4. **Target angka bisnis** (mis. target revenue/bulan, target scan/user) untuk konteks kartu — tak ada di kode.
5. **Apakah `admin.html` lama mau dipensiunkan** atau tetap sebagai fallback key-gated?

## LAMPIRAN B — Metrik yang DATANYA BELUM ADA (bangun dulu sebelum bisa didesain)
1. **Akurasi kalori / koreksi user atas hasil scan** (§6e) — tidak ada pelacakan nilai asli vs koreksi. Perlu skema baru sebelum halaman ini bisa didesain.
2. **Device/kanal admin** (desktop vs mobile) — perlu simpan user-agent di `user_activity`.
3. **Frekuensi & alur pemakaian halaman admin** — perlu instrumentation halaman admin.
4. **Latensi & tingkat kegagalan scan** terstruktur — status scan belum dilog untuk analitik admin.
5. *(Catatan: metrik email — open/click/bounce/click-rate/link terpopuler — **sudah tersedia** sejak tabel `email_events` dibangun; tidak lagi jadi blocker.)*
