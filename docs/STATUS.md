# STATUS — my.20fit.id

> **Pembaruan terakhir:** 2026-10-01 · **Commit staging:** `e298aa2` · **Production:** `cb621dc`
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
| Admin swap | `/admin-dashboard` auto → `/admin-v2`. **Flag `admin_v2` kini ON di PRODUKSI** (2026-09-25) → produksi & staging sama-sama pakai admin-v2. Admin lama tetap bisa dibuka via `?legacy=1`. Reversible: set flag OFF di `my20fit_admin_feature_flags` | `server.js` (`adminV2Enabled`, `isStagingReq`) |
| Voucher / Banner / Corporate | Modul voucher (logging/tracking/bulk), banner/promo (render dashboard), corporate (roster, pesan) | migration 011/012, `corp-dashboard.html` |
| Jadwal kelas | `/api/classes/schedule?venue=arena\|gym\|clinic` (baca Supabase) → halaman `/classes` | `classes.html` |
| Riwayat arena | `/api/arena/history` proxy ke **arena-api** (`ARENA_API_KEY`), member-scoped | `progress.html` |
| **Homepage 6-tile → halaman** | Tile Baris 1 = 6 opsi, tiap tile navigasi ke route sendiri (bukan panel inline). Panel inline & pin Baris 2 **dihapus** | `dashboard.html` (PR #295) |
| **Book Class filter** | `/classes` punya toggle **Arena/Gym** in-page; `?venue=clinic` = Book Recovery (tanpa toggle) | `classes.html` (PR #295) |
| **Menu bar Event** | Item menu bar `Medical` → `Event`; `event.html` placeholder "Upcoming" | `js/nav.js`, `event.html` (PR #294) |
| **Roster home (coach/dokter/fisioterapis)** | Tiga rail di bawah home: `/api/coaches`, `/api/doctors`, `/api/physiotherapists`. Roster coach diperluas (solo + pasangan co-teach) & foto diperbarui (2026-09). Kartu tanpa `photo_url` — atau yang `<img>`-nya gagal dimuat — ditandai "Foto belum ada" | `dashboard.html`, `server.js` (PR #412) |
| **Halaman Team `/team`** | "Meet Our Doctors & Coaches": grid coach+dokter+fisio dari `/api/team`. Frame foto **seragam 170px** (aspect-ratio box, `object-fit:cover object-position:top`), nama compact. Di bawahnya section **Upcoming Classes** | `team.html` (PR #502/#506) |
| **Coaches strip Book Class (FASE 2)** | Strip coach di `/classes`: **hanya coach yang punya kelas** di jadwal yang tampil (match teks instructor PERSIS via `my20fit_coach_instructor_aliases`) + klik coach → filter jadwal. Endpoint `GET /api/coaches/aliases` | `classes.html`, `server.js` (PR #498/#501), `COACH-LOGIC.md` |
| **Book Coach FASE 2** | `/book-coach` list = **hanya coach ber-kelas** (`/api/coaches?active=1`). Frame foto 170px | `book-coach.html`, `server.js` (PR #504/#505) |
| **Upcoming Classes** | Section daftar kelas mendatang (flat, lintas arena+gym, sisa kursi + Book) di `/team` & **row scroll di home (bawah AQI)**. Endpoint `GET /api/classes/upcoming?days&limit` (map instructor→coach via alias) | `team.html`, `dashboard.html`, `server.js` (PR #506) |
| **Book Class filter periode** | `/classes` punya pill **Minggu Ini / Minggu Depan / 2 Minggu / Semua** (+ toggle venue + filter coach). "See All" home → `/classes?period=this_week` | `classes.html`, `dashboard.html` (PR #508) |
| **Perf foto coach** | `preconnect` + `decoding="async"` di halaman coach; upload foto admin **auto-resize ≤512px + kompres JPEG** sebelum simpan ke Storage | `team.html`/`book-coach.html`/`classes.html`/`dashboard.html`/`admin-v2.html` (PR #507) |
| **Recipe data via API** | `js/recipes.js` (~291KB, 120 resep) **tidak lagi dimuat di browser**. Halaman `recipe.html` dan `calories.html` kini fetch dari `/api/menu/catalog` (daftar lengkap) dan `/api/menu/recommend` (rekomendasi berdasar sisa makro). Utilitas foto diekstrak ke `js/recipe-photos.js` (~2KB, `window.RecipePhotos`). `js/recipes.js` tetap ada untuk dipakai server-side (`loadMenuCatalog`). | `recipe.html`, `calories.html`, `js/recipe-photos.js`, `server.js` (PR #442/#443) |

## 1b. Recipe: IN-APP, jangan dilempar keluar lagi

**Keputusan pemilik (2026-09-16): fitur resep tampil DI DALAM my.20fit.id.** User tidak boleh
ke-lempar ke `recipe.20fit.id` / `recepie.20fit.id`.

Yang sudah ada dan dipakai — **jangan dibangun ulang**:

| Bagian | Sumber sebenarnya | Jumlah (terukur 2026-09-16) |
|---|---|---|
| Halaman | `recipe.html` (grid + modal detail: bahan, langkah, kalori, P/K/L, like/save, tombol **Log Food** ke Calories). `/diet` redirect 301 ke `/recipe` | 1 halaman |
| Resep resmi | `js/recipes.js` **di repo ini**, dwibahasa EN/ID — dibaca **server** lalu disajikan `/api/menu/catalog`. Sejak PR #442 browser tidak lagi memuat filenya; detail di baris **Recipe data via API** (§1) | **120** |
| Artikel | `my20fit_recipe_article` di Supabase bersama, dibaca **server** pakai service key (RLS deny-public tetap utuh) | **67 published**, 9 kategori |
| Kontribusi user | `my20fit_menu_contribution` — alurnya jalan, datanya masih kosong | **0 baris** |

**TIDAK ADA API resep terpisah di Railway** yang perlu disambungkan, dan **tidak ada tabel konten
resep lain** di Supabase ini (`recipe_admin_role`/`recipe_admin_audit_log` cuma tabel admin;
`cf_menu` itu menu kafe — ada harga & stok, bukan resep). Membaca tabel resep **langsung dari
browser** akan menuntut pelonggaran RLS yang dipakai bareng recipe.20fit.id — **jangan**.

**Riwayat bolak-balik (supaya tidak terulang ketiga kalinya):**
- `f087920` (2026-09-08) — "rename Diet → Recipe + jadikan menu/resep in-app (bukan SSO keluar)". Tile → `/recipe`.
- PR #423 / `94b4a68` (2026-09-15, **di-merge langsung ke `main` tanpa lewat staging**) — tile diubah jadi SSO keluar ke `recepie.20fit.id`.
- **2026-09-16** — tile dikembalikan ke `/recipe`; blok handoff `openRecipeGo` + `MENU_ORIGIN` di `dashboard.html` dihapus karena jadi dead code.

**JANGAN hapus `Auth.menuSso()` di `js/auth.js`** — itu bukan sisa PR #423. Masih terpakai untuk
arah **masuk**: `login.html` / `code-login.html` menerima `?next=menu`, lalu mengembalikan user ke
app menu setelah login.

## 1c. Foto resep: satu resolver untuk my.20fit & recipe.20fit

**Gejala (2026-09-16):** di `/recipe` my.20fit foto kartu tampak abu-abu/pucat, padahal di
recipe.20fit.id foto yang sama muncul bagus.

**Akar masalah — BUKAN jaringan.** Filenya sehat (diunduh langsung: `beef-burger-v8.png` →
HTTP 200, 1024×1024, 1519 KB, gambarnya tajam). Penyebabnya CSS: placeholder dirender dengan
**shorthand** `style="background:linear-gradient(...)"`. Shorthand `background` me-reset
sub-properti yang tak disebut, jadi `background-size:cover` + `background-position:center` di
stylesheet **ikut ter-reset** ke `auto` / `0% 0%` — dan karena inline, ia menang atas stylesheet.
`_setBg()` hanya menyetel `backgroundImage`, sehingga foto 1024×1024 tampil pada ukuran ASLI
menempel di pojok kiri-atas kotak ~275 px → yang terlihat cuma latar blur foto.
Terbukti lewat computed style (`background-size=auto` vs `cover`) dan render Chromium headless
halaman `recipe.html` asli, sebelum vs sesudah.

**Diperbaiki:** `recipe.html` (`.rthumb`, `.pm-hero`) dan `calories.html` (`.mrec-thumb`) memakai
`background-image:` bukan shorthand; `.mrec-thumb` diberi `background-size:cover` (sebelumnya tak
punya sama sekali); `_setBg()` di `js/recipe-photos.js` kini menyetel size/position eksplisit.

**Sumber foto DISATUKAN.** Dulu `/api/foodphoto` (my.20fit) dan `/api/menu/photo`
(recipe.20fit.id) punya logika sendiri-sendiri yang berbeda hasil: `-v8` + Pexels `medium`
(~350px) + TheMealDB `/small` (~312px) vs `-ai-id` + syarat sisi terpendek ≥1024px. Terukur di
`my20fit_foodimg`: **120 baris `-ai-id`** tapi hanya **102 baris `-v8`** — 18 resep tak punya foto
di jalur my.20fit. Sekarang keduanya memanggil satu fungsi `resolveMenuPhoto()`; hasilnya identik
dan `server.js` berkurang ~49 baris.

**MASIH ADA, di luar cakupan:** `dashboard.html` `paintAva()` memakai pola yang sama
(`el.style.background = ...` lalu `backgroundImage`), jadi **foto avatar kemungkinan ikut
kepotong**. `profile.html` aman. Belum disentuh — tanya pemilik dulu.

## 1d. Recipe disamakan dgn recipe.20fit.id — BERTAHAP (Tahap 1 selesai)

Sumber acuan: repo **`Marketing-project-wq/MENU`** (= recipe.20fit.id, `public/version.json`
menyebut dirinya `20fit-menu (recepie.20fit.id)`). Stack-nya **React + Vite + TypeScript +
Tailwind** — jadi fiturnya DITULIS ULANG dengan vanilla JS di sini, bukan disalin (CLAUDE.md §5
melarang menambah framework/bundler).

Halaman di sana: `home`, `browse (/resep)`, `detail`, `articles`, `article`, `submit`, `mine`,
`saved`, `eatnow`, `admin`. Di my.20fit semuanya masih menyatu di `recipe.html`.

**Tahap 1 (2026-09-16) — SELESAI:** `/recipe` jadi browse resep penuh dan **artikel dibuang
dari halaman ini** (keputusan pemilik).
- Cari (nama + bahan), filter **kategori** (16 kategori diambil dari data, bukan daftar tebakan),
  **diet** (chip lama), **kalori** (<300 / 300–500 / 500–700 / 700+), **urutkan** (kalori
  terendah/tertinggi, protein tertinggi, tercepat dimasak, nama A–Z) — nilai & label mengikuti
  `KCAL_RANGES`/`SORT_OPTIONS` di repo MENU, termasuk **batas kalori yang inklusif**.
- Muat bertahap 15 per klik; bar "N resep + filter aktif + Atur ulang"; filter tersimpan di URL
  (`?q=&category=&diet=&kcal=&sort=`) jadi bisa dibagikan/di-refresh.
- Kartu: badge waktu masak, "oleh <pembuat>", chip kalori + 2 tag diet, batang proporsi makro.
- **Detail resep** (klik kartu) mengikuti `DetailPage.tsx`: panel gizi, kontrol porsi 1..12,
  batang makro dengan persen dihitung dari **kalori** (4/4/9 kkal per g), dua kolom Bahan | Cara buat.
- **Jumlah bahan ikut porsi** (2026-09-17): aturan di-port dari `src/lib/scaleIngredients.ts` di repo
  MENU — hanya kuantitas di awal baris yang diskalakan; rentang (`2-3` → `4-6`), pecahan, dan unicode
  didukung; baris tanpa kuantitas awal (`garam secukupnya`) dibiarkan. Ini **best-effort dari teks
  bebas** (bahan disimpan sebagai string, bukan data terstruktur) — batasan yang sama dengan
  recipe.20fit.id, dan UI memberi catatan eksplisit ke user. Akurasi 100% butuh perubahan struktur
  data bahan di kedua app — **TANYA PEMILIK REPO** sebelum menempuh itu.

**Artikel: DITUNDA, bukan dihapus dari sistem.** 67 artikel `my20fit_recipe_article` dan seluruh
endpoint-nya (`/api/menu/articles`, `article-categories`, `article-readtimes`, `articles/:slug`)
**tetap utuh di server** — yang dibuang hanya UI-nya di `recipe.html`. Konsekuensi jujur: untuk
sementara artikel **tidak bisa dibaca dari my.20fit** sampai halaman artikel dibuat. Kunci i18n
`rec_articles_h`/`rec_art_*`/`rec_all` sengaja DIBIARKAN di `js/i18n.js` karena akan dipakai lagi.

**Belum dikerjakan (tahap berikutnya, urut):** halaman artikel · tersimpan · punyaku · kirim resep
(sudah ada sebagian di `/recipe`, perlu dipisah) · eat-now (direktori katering).

## 2. Fitur SEDANG dikerjakan / SETENGAH JADI
- **Analisa performa per workout + halaman detail riwayat (2026-10-01, Fase 1–4, staging dulu, TANPA migration).**
  - **Fase 1 — ekstraksi:** `my20fit_workout` jadi satu sumber data workout (riwayat tak lagi membaca kalimat deskripsi
    AI). Judul kartu dari angka (`js/workout-metrics.js`, dipakai browser & server), mis. "Lari 5 km · 33:45 · 6:45/km".
    Tanggal hasil baca divalidasi: tahun tak tercetak / masa depan / > N hari dari upload → dialog **wajib** konfirmasi
    tanggal (temuan nyata: "Oct 5" dibaca AI jadi `2023-10-05`). Dialog: tanggal, jam mulai, HR maks, catatan (nyeri dll.),
    jenis walk/hiit. Edit setelah simpan: `PATCH /api/activity/workout/:id`. Screenshot disimpan sebagai path (dulu signed
    URL 7 hari). Hapus = workout + screenshot + baris upload tertaut. Prompt `WORKOUT_SYS` di edge `my20fit-ai` diperluas
    (tanggal hanya kalau tahun tercetak, jam mulai, kecepatan, cadence, split, confidence per field) — **edge belum
    di-deploy (TANYA PEMILIK)**; tanpa deploy, tanggal diambil dari bacaan upload-analyze dan jam mulai diisi manual.
  - **Fase 2 — mesin faktor** (`lib/workout-analysis.js`, ambang `lib/workout-analysis-config.js` PERLU DIVALIDASI):
    baseline = ≤5 workout sejenis (jarak ±30%) dlm 120 hari, < 3 → "baseline belum cukup"; faktor tidur (malam sebelum,
    vs rata-rata 7 hari & target), nutrisi kemarin (vs target `js/nutrition.js`, kini juga di-require server), jeda makan
    terakhir → jam mulai (`cal_items.t`), hidrasi kemarin & sebelum mulai, beban 7 hari vs 4 minggu, Visbody. Status
    baik/kurang/berlebih/**tidak_ada_data**; pengaruh tinggi/sedang/rendah hanya kalau performa turun. Halaman
    `/activity/history/:id` (`activity-workout.html`): metrik, zona HR, split, performa vs biasanya + grafik, kartu faktor
    + isi data langsung (tidur semalam, minum kemarin, jam mulai) → dihitung ulang.
  - **Fase 3 — narasi coach:** `POST /api/activity/workouts/:id/narrative` — AI hanya menerima hasil hitungan + daftar
    angka yang boleh; angka lain → ulang 1x → template. Disimpan per (hash input, bahasa) di `raw_data.analysis`
    (hemat biaya; data berubah → dibuat ulang). Keamanan (HR maks tak wajar / catatan nyeri) → tanpa analisa performa
    & tanpa AI, CTA Book Doctor; nomor darurat `safety.emergency_number` = null (TANYA PEMILIK, tidak dikarang).
    "Balas Coach" → chat coach dengan isian awal soal workout ini.
  - **Fase 4 — insight lintas workout:** muncul di riwayat hanya kalau ≥ 8 workout bisa dibandingkan & ≥ 5 sesi lambat
    berdata faktor itu, dengan jumlah datanya disebut.
  - **Belum:** diuji dengan AI asli & data nyata (DB baru punya 1 workout; tabel tidur & hidrasi kosong). Contoh analisa di
    laporan memakai DATA UJI.
- **/activity dirapikan (2026-09-30, staging dulu).**
  - **Kartu "AI Coach — Analisis keseluruhan" DIHAPUS** (Buat rencana / Tentukan targetmu), beserta turunannya di
    halaman: kartu skor harian `#scoreTop`, checklist "Rencana AI Coach" (`#goalBox`), quiz `js/goal-quiz.js` (file
    dihapus), dan refresh rencana otomatis setelah simpan workout (diganti hitung ulang Health Score). Skor utama
    halaman = **Health Score**.
  - **Satu kartu upload** (`#uploadCard`) menggantikan kartu "Upload Progress" + "Upload hasil workout". 1–5 gambar:
    gambar pertama → `/api/activity/upload-analyze` (jenis + Today's Plan + riwayat upload untuk Health Score), semua
    gambar → `/api/activity/scan` (pembaca workout) — **paralel**. Dialog catat workout hanya terbuka kalau jenisnya
    workout (atau jenis tak dikenali tapi pembaca workout berhasil); foto asli disimpan ke Storage hanya untuk workout.
    Tombol: Kamera / Galeri-file / Isi workout manual. Konsekuensi: tiap upload non-workout tetap memanggil pembaca
    workout sekali (biaya AI ekstra, demi user tidak menunggu dua kali).
  - **Hidrasi = 8 gelas yang bisa diketuk** (8 × 250 ml = target 2 L), animasi air naik/turun (mati kalau
    `prefers-reduced-motion`). Ketuk gelas ke-n = total n gelas; ketuk gelas terisi terakhir = kurang satu (catatan
    terbaru dihapus, selisihnya ditambah lagi). Tombol "+1 gelas" untuk lewat target. Tetap `my20fit_hydration` +
    sinkron `daily_log.water_glasses`. Tombol cepat kopi/teh/ml-bebas dihapus; catatan lama tetap tampil di
    "Catatan minum".
  - **Belum diputuskan (TANYA PEMILIK):** `POST /api/activity/plan`, `PATCH /api/activity/goal`, dan field `plan` di
    `/api/activity/day` (tabel `my20fit_daily_plan`) kini **tak dipanggil halaman web mana pun**. Tidak dihapus karena
    BELUM TERVERIFIKASI apakah app mobile memakainya — hapus kalau pemilik memastikan tidak.
- **Visbody Journey — Fase 2 & 3: landing, Health Journey, hasil lengkap, tur fitur, nudge, funnel (2026-09-30,
  staging dulu).** Migration 029. Config di `lib/journey-config.js` (landing, rescan, nudge, info alat, min grup corporate).
  - **Landing setelah login** (`Auth.routeAfterAuth`): link claim tertunda → tujuan internal yang diminta (`?next=/path`
    di login, atau halaman yang dibuka sebelum login via `requireAuth`) → **/activity untuk user dengan scan ter-claim**
    (mode `always`/`new_scan`/`off`, dihitung server di `/api/journey/state`) → dashboard. Redirect lama di dashboard
    (`goActivityIfNewVisbody`, localStorage) DIHAPUS.
  - **/activity:** banner "Hasil Visbody kamu sudah masuk!" (4 angka + Lihat hasil lengkap) selama hasil belum DIBUKA
    (`viewed_at` di DB, ditandai saat /activity/visbody dibuka — bukan saat banner tampil); checklist **Health Journey**
    6 langkah (lihat hasil, analisa coach, buat plan, target kalori dari BMR, book kelas, jadwalkan rescan) — langkah
    yang bisa dibaca dari data (viewed, chat, plan) tidak disimpan ulang; kartu "Langkah berikutnya" + daftar ringkas.
    Target kalori dari BMR = rumus yang sama dgn target otomatis (`Nutrition.goalFromBmr`), baru disimpan setelah user
    menekan "Pakai target ini" (`my20fit_profile.calorie_target_kcal`, min 1200); bisa kembali ke otomatis.
    **Book kelas** hanya tercatat sebagai "user membuka booking" (booking.20fit.id tak bisa diverifikasi dari sini).
    **Pengingat rescan** = nudge di /activity (belum ada email/WA — TANYA PEMILIK kalau mau kanal lain).
  - **/activity/visbody:** penjelasan awam per parameter (tanpa diagnosis; rentang normal hanya dari data Visbody),
    perbandingan dgn scan sebelumnya (sudah ada), unduh PDF kalau Visbody memberi `pdf_url`. Belum pernah scan →
    halaman ajakan: manfaat, contoh hasil berlabel "Contoh", **ajakan scan di 20FIT Arena** (tombol Maps = link pemilik,
    tombol Kunjungi 20FIT Arena = arena.20fit.id — asumsi agent), biaya/persiapan/tombol jadwal dari config — **masih null
    sehingga TIDAK tampil**; tanpa tombol jadwal teksnya "datang ke 20FIT Arena dan minta scan ke tim". Klik CTA lokasi
    tercatat sebagai `visbody_booking_clicked` (from: location_maps / location_site).
  - **Nudge** (batas frekuensi per user di `my20fit_health_journey.nudges`): belum scan + ≥3 workout → ajakan Visbody;
    scan terakhir > 30 hari → ajakan rescan. AI Coach: ajakan Visbody maks 1x per sesi (server menambah pengingat).
    **Belum dibuat:** pengingat "sekalian scan setelah kelas" — tidak ada data booking kelas per user di my.20fit
    (booking di booking.20fit.id).
  - **Tur fitur — satu mesin `js/tour.js` + isi di `js/tours-config.js`** (menggantikan tour.js lama yang, karena mencocokkan
    `*.html`, tak pernah jalan otomatis di URL bersih). Tur: `welcome` (F2: semua menu + fitur unggulan, user tanpa scan,
    di /dashboard), `activity` (F1: user ber-scan, pakai skor asli), `activity_intro` (tur mini /activity tanpa data),
    `home`/`calories`/`medical` (F3, pindahan tur lama; tanda localStorage lama dihormati). Status per user di
    `my20fit_tour_state` (lintas device, lanjut dari langkah terakhir, versi naik → hanya langkah baru). Ulang: tombol "?"
    di /activity, "Tur fitur" di Profil (`/dashboard?tour=welcome`). Menunggu modal lain tertutup; Esc/←/→, fokus terkunci
    di tooltip, reduced-motion. **Teks tur = draf agent, PERLU DITINJAU; daftar fitur unggulan PERLU DIPUTUSKAN.**
  - **Funnel:** `my20fit_event_log` (event di-whitelist server; event server: scan masuk/claim/rescan/plan/chat/HS terbuka).
    Admin-v2 → **Funnel Visbody**: user unik per event per minggu (8 minggu) + event tur per langkah.
  - **Corporate:** `/api/corp/visbody-summary` + kartu di /corp-dashboard — hanya jumlah peserta & rata-rata; rata-rata
    disembunyikan kalau peserta < 5 (config). TIDAK ada data Visbody per karyawan untuk HR.
  - Diuji: 15 skenario server journey + 14 skenario claim (kode asli server.js + DB tiruan) + Chromium (tur F2 12 langkah
    di HP tanpa menutupi sorotan, lewati/ulang/lanjut/antre modal, F1 skor asli & versi "belum punya plan", dialog
    kalori, halaman ajakan & hasil lengkap).
- **Visbody Journey — Fase 1: claim scan + gating Health Score (2026-09-30, staging dulu).**
  Angka/kebijakan di `lib/journey-config.js` (default agent, ditandai PERLU DIPUTUSKAN/DIVALIDASI).
  - **Kondisi data asli saat audit:** 7 scan (1 timbangan, 27–28 Sep) semua unclaimed, `measured_items`
    masih `processing` (event "completed" tak pernah tercatat — BELUM TERVERIFIKASI penyebabnya),
    identitas dari timbangan kosong; `my20fit_visbody_body` = 0 baris.
  - **Claim:** QR timbangan / link staf = `/visbody-claim?t=<token>` (token acak, hash di
    `my20fit_visbody_claim_token`, sekali pakai, TTL config). Belum login → token disimpan
    (`my20fit_pending_claim`) dan `Auth.routeAfterAuth` mengembalikan member ke claim setelah
    login/daftar. Persetujuan data (UU PDP) wajib → `my20fit_data_consent`. Sukses →
    `/activity?welcome=visbody` (tampilan welcome = Fase 2). Endpoint: `GET /api/visbody/claim/info`,
    `POST /api/visbody/claim`. Semua claim/penolakan/link/bind tercatat di `my20fit_visbody_claim_audit`.
  - **Webhook:** event berikutnya untuk scan yang sama tak lagi menimpa pemilik/status (bug lama: upsert
    penuh bisa mengosongkan pemilik saat event "completed" datang setelah claim); scan ber-pemilik +
    "completed" → data ukur diambil.
  - **Admin-v2 → Claim Visbody** (staff; marketing diblokir): daftar scan unclaimed tanpa angka ukur, buat
    link claim baru (salin / WhatsApp `api.whatsapp.com/send`), ikat ke member by email (wajib centang
    persetujuan disaksikan staf → consent `source=staff`). Endpoint `/api/admin/visbody/unclaimed|claim-link|bind`.
  - **Health Score gating (`hsCompute`, satu fungsi — juga dipakai chat coach & achievements):** terbuka
    hanya kalau ada ≥1 scan Visbody ter-claim ATAU ≥1 workout (log/upload) sepanjang waktu; terkunci →
    `total:null` + `filled` (komponen terisi) tanpa angka. Workout: jendela bergulir 7 hari (config);
    belum pernah workout → komponen "belum ada data" (dulu selalu dihitung → user kosong melihat
    "0/100 Kritis"). Body: scan > 60 hari → ditandai "lama" & bobot ×0.5 (config). Ambang BMI/body fat
    komponen Body masih angka lama — PERLU DIVALIDASI tim klinik. UI `/activity`: kartu terkunci
    (2 jalur: Scan Visbody / Upload workout + komponen terisi ✓), kartu terbuka ("Berdasarkan n dari 6
    komponen", CTA per komponen kosong, label "bukan penilaian medis").
  - Diuji: 14 skenario server (kode asli server.js + DB tiruan in-memory — npm registry diblokir di
    container, server utuh tak bisa dijalankan) + Chromium (halaman claim 7 state, kartu HS, admin).
    **Belum diuji ke timbangan/API Visbody asli.**
- **Ekosistem Activity: AI Coach chat + alur Visbody (2026-09-30, staging dulu).** Aturan chatbot: `RULES.md`.
  - Route baru (tanpa halaman duplikat): `/activity/chat`, `/activity/chat/:coach`, `/activity/plan[/:id]` →
    `coach.html`; `/activity/visbody` → `body-scan.html`. `/coach` & `/body-scan` tetap hidup.
    `/activity/plan` = plan aktif (checklist per hari) + **Semua plan**; `/activity/plan/:id` = detail plan
    lama + tombol "Jadikan plan aktif" (`GET /api/coach/plans`, `GET /api/coach/plans/:id`,
    `POST /api/coach/plan/activate`). Kartu Active Plan di `/activity`: "oleh Coach X", durasi per hari
    (plan dari chat), penanda "← hari ini" kalau label hari = nama hari.
  - Chat: balasan berisi blok JSON `workout_plan` → otomatis jadi plan aktif (`my20fit_workout_plan`,
    `source="ai"` + `plan.origin="chat"` — lihat catatan 2026-10-01 di §4); kelas upcoming milik coach persona masuk konteks (rekomendasi kelas coach sendiri);
    ajakan Visbody scan kalau user belum punya data; token tombol `[[BOOK_CLASS]]` `[[BOOK_DOCTOR]]`
    `[[ARENA_MAPS]]` `[[VISBODY]]` `[[TRACK_MEAL]]`, kartu `[[WORKOUT_PLAN]]` (tabel). Header chat: streak + level.
    Balasan singkat & **tanpa sapaan pembuka** (pengingat gaya ditaruh setelah riwayat).
  - **Meal plan dari coach (migration 027, dijalankan 2026-09-30):** blok JSON `meal_plan` di balasan →
    kartu di chat + tombol **"Terapkan meal plan"** (`POST /api/coach/meal-plan/apply`, divalidasi ulang di server)
    → tersimpan di `my20fit_coach_meal_plan` (1 baris/user) → bagian Meal Plan di `/calories` berganti jadi
    "Meal plan dari Coach X" (tombol "Catat" per menu → masuk log hari ini; karbo/lemak 0 karena coach hanya memberi
    kkal & protein) + tombol "Kembali ke rekomendasi otomatis" (`POST /api/coach/meal-plan/clear`).
  - Gamifikasi (XP, level, streak aktivitas, 7 badge baru) **dihitung dari data yang ada** di
    `/api/coach/achievements` — tabel `user_gamification`/`health_scores` dari spec SENGAJA tidak dibuat.
  - **Kotak profil coach (carousel)** — satu modul `js/coach-profiles.js` + `css/coach-profiles.css`, dipakai
    `/activity` (menggantikan baris 4 avatar kecil) dan picker `/activity/chat`: foto bulat, tagline, sifat, lokasi &
    kelas terdekat (data asli), tombol "Chat dengan <coach>" ("Gaya ngobrol", "Cocok kalau" & contoh ucapan dihapus
    atas permintaan pemilik). Isi persona dari deskripsi pemilik; kolom `speciality` roster masih kosong → tidak ditampilkan.
    Baris "Kelas terdekat" punya tombol **Book kelas** (1 Okt 2026) → `/book-class?source=&schedule=` (alur in-app yang
    sama dengan `/book-coach`, tab yang sama); hanya muncul untuk kelas yang `selectable`.
  - **Tanpa emoji di UI Activity/Chat** — semua ikon = `js/fiticons.js` (ditambah: chat, clipboard, calendar, pin,
    camera, folder, scan, clinic, star, box, boxcheck, scale). Ikon "What You Need" dari server kini NAMA ikon
    (`moon`/`meal`/`water`/`dumbbell`/`rest`); frontend tetap menampilkan emoji lama kalau server belum versi baru.
    Emoji di balasan AI coach (gaya persona) tidak diubah.
  - `/activity`: alert "Hasil Visbody kamu sudah masuk!" (scan ≤30 hari, tanda "dilihat" per user di
    localStorage — di perangkat lain bisa muncul sekali lagi), Quick Actions, Today's Summary.
    `/dashboard` mengarahkan ke `/activity` SEKALI per scan baru. Calories & Medical punya tombol
    "tanya coach" (`?ask=` hanya mengisi kotak pesan, tidak auto-kirim).
  - Model chat: server kirim `tier:"complex"` untuk plan/analisa; edge `my20fit-ai` memakai env
    `AI_MODEL_CHAT_COMPLEX` (default = `AI_MODEL_CHAT`). **Perubahan edge fn BELUM di-deploy** (v55 live =
    versi repo sebelum perubahan ini, sudah dicek 2026-09-30) dan env belum di-set — **TANYA PEMILIK** model apa
    yang mau dipakai (biaya OpenRouter); deploy bareng pengisian env. Sampai itu, `model_used` tersimpan null.
  - **TANYA PEMILIK:** URL "Book Visit" untuk Visbody scan (sekarang chatbot memakai Google Maps Arena + Book Class).
- **Hotfix (2026-09-30, sudah di production):** halaman di path bertingkat (`/auth/callback`,
  `/activity/history`, `/payment/*`) memuat `js/*.js` relatif → diminta di `/auth/js/...` → catch-all
  `index.html` → skrip tak jalan (login Google via `/auth/callback` ikut rusak). Semua halaman path
  bertingkat kini WAJIB `<base href="/">` (catatan di `server.js`).
- **Health Score ikut data upload + dashboard `/activity` versi ringkas (2026-09-29, staging dulu).**
  - `GET /api/activity/health-score` kini membaca juga `my20fit_activity_uploads` (screenshot
    jam/app kesehatan), `my20fit_sleep`, `my20fit_hydration` selain workout/daily_log/Visbody/MCU.
    Prioritas tidur per tanggal: `my20fit_sleep` > upload > daily_log. Hidrasi per tanggal =
    max(gelas×250, total ml). Respons membawa `gaps` (What You Need: tidur/RHR naik, nutrisi,
    hidrasi, workout kurang/berlebih) + `week` (Sen–Min, sesi/menit/kcal). Target sementara:
    4 hari workout, 7,5 jam tidur, 2 L air, 2000 kcal — **TANYA PEMILIK** kalau mau per-user.
  - `upload-analyze` memakai tanggal dari hasil analisa (≤30 hari, tidak di masa depan) sebagai
    `upload_date`, jadi skor minggu itu ikut terhitung ulang.
  - `/api/coach/plan/adjust` op baru `done` (`day_key`, `done`) → centang hari di Active Plan
    (disimpan di `plan.days[i].done`, jsonb yang sama; tanpa migration).
  - `activity.html`: coach bar ringkas, Health Score (angka + bar + label GOOD/NEEDS WORK/CRITICAL,
    breakdown 2 kolom + N/A, pills What You Need), kartu ganda Upload Progress + Weekly Recap
    (2 kolom juga di mobile), Today's Plan 4 kartu mini (Book Class/Track/+250ml/Balas),
    Active Plan satu baris bisa dicentang. Teks `data-en/data-id` kini ikut toggle bahasa.
    Tombol "Track →" ke `/calories` in-app. **Belum dites di perangkat nyata/staging.**
- **Tabrakan nama "Activity" SELESAI (2026-09-21).** Item nav berlabel "Activity"/"Aktivitas"
  (`nav_progress`) dulu menunjuk `/progress`, sehingga pemilik mengklik "Activity" dan mendarat
  di halaman LAMA — bagian baru tak pernah terlihat. Sekarang: item nav menunjuk `activity.html`,
  dan `/progress` **redirect 302** ke `/activity`.
  - **302, bukan 301** — sengaja. Selama masa verifikasi ini masih bisa dibalik tanpa tersangkut
    cache permanen di browser user. Naikkan ke 301 setelah `/activity` terbukti beres.
  - **Pintu darurat `/progress?legacy=1`** menyajikan halaman lama, mengikuti pola yang sudah
    dipakai repo untuk `/admin-dashboard?legacy=1`. Karena itu `progress.html` BUKAN file mati.
  - **Utang yang diakui:** isi `progress.html` kini ADA DI DUA TEMPAT (aslinya + salinan di
    `activity.html`). Itu melanggar §2 (satu sumber kebenaran). Sengaja dibiarkan satu putaran
    sebagai jalan mundur selagi `/activity` belum terverifikasi di perangkat nyata.
    **HAPUS `progress.html` + pintu daruratnya** begitu pemilik memastikan `/activity` beres.
- **Pesan error jujur saat migration 017 belum jalan.** `/api/activity/day` memang tetap 200
  (error tabel `my20fit_daily_plan` yang belum ada ditelan -> `plan:null`), tapi "Buat rencana"
  dan centang goal akan gagal. Dulu balasannya generik; sekarang `isMissingSchema()` mengenali
  Postgres 42P01/42703 dan membalas **503** + pesan "migration 017 belum dijalankan", bukan
  "Gagal membuat rencana harian" yang tidak memberi petunjuk apa pun.

- **Foto avatar di dashboard tampil salah — DIPERBAIKI 2026-09-21.** `paintAva()` menyetel
  `a.style.background = <warna>` (shorthand) sebelum `backgroundImage`. Shorthand inline
  me-reset `background-size` ke `auto` dan `background-position` ke `0% 0%`, dan gaya inline
  menang atas `.hpx-av{background-size:cover}` di stylesheet. Terbukti lewat computed style:
  `size:auto, pos:0% 0%, rep:repeat` — foto tampil ukuran asli, rata kiri-atas, DAN berulang;
  di lingkaran 26px user cuma melihat secuil pojok fotonya. Diperbaiki jadi `backgroundColor`
  + `backgroundSize/Position/Repeat` eksplisit, dan `backgroundImage` dikosongkan saat user
  tak punya foto (dulu foto user sebelumnya bisa tertinggal). Diverifikasi dengan menjalankan
  fungsi `paintAva` ASLI dari `dashboard.html` di Chromium.
  Pola yang sama disapu ke seluruh repo: hanya SATU kejadian. `profile.html` `setAva()` aman
  (tak pakai shorthand inline, CSS `.ava` sudah `cover`), `js/nav.js` sudah menyetel `cover`
  sendiri, `js/recipe-photos.js` sudah diperbaiki di PR #447.
- **`js/recipes.js` BUKAN dead code — jangan hapus.** Tidak dimuat halaman mana pun di browser,
  tapi `server.js:4865` mem-`require`-nya untuk katalog resep resmi (`/api/menu/catalog`), dan
  `scripts/backfill-menu-photos.js` juga. Yang diekspor hanya `LIST` + `DIET_TYPES`.
  **Catatan:** fungsi browser di dalamnya (`_setBg`, `applyThumb` di ~baris 1283-1289) otomatis
  jadi tak pernah jalan karena file ini kini murni dipakai server. `_setBg` di sana masih punya
  bug `background-size` yang sama. TIDAK disentuh: file ini di-`require` server, mengubahnya
  berisiko ke katalog resep. **TANYA PEMILIK REPO** sebelum membersihkannya.

- **Halaman Activity (`/activity`) — BARU 2026-09-21, belum dites di staging.** Upload/isi workout,
  zona HR, rencana harian AI, nutrisi, kebiasaan, ringkasan minggu.
  - **Spesifikasi awal minta React+Vite+Tailwind dan 3 tabel baru; keduanya DITOLAK** karena
    melanggar CLAUDE.md §5/§I (vanilla) dan §2/§4 (duplikasi + prefix). Dibangun vanilla, dan
    dua dari tiga tabel dipakai ulang: `my20fit_workout` (dorman, 0 baris → diperluas) dan
    `my20fit_daily_log` (hidup, 679 baris → hanya `steps` yang ditambah). Lihat
    `db/supabase-migration-017-activity.sql` untuk daftar kolom yang SENGAJA tidak dibuat.
  - **AI lewat jalur tunggal yang sudah ada** (`callAiEdge` → edge `my20fit-ai`, aksi baru `plan`),
    bukan edge function terpisah. Provider tetap **OpenRouter + Gemini**, bukan Anthropic —
    spesifikasi menyebut "Anthropic Claude API", repo memakai yang lain sejak awal.
  - **Ada rencana cadangan tanpa AI** (`fallbackPlan` di `server.js`): dihitung dari angka yang ada,
    ditandai "TANPA AI" di UI. Jadi halaman tetap berguna sebelum edge fn di-deploy.
  - **Baca screenshot health tracker (21 Sep 2026).** Upload menerima **sampai 5 gambar**
    untuk SATU sesi latihan (layar ringkasan + zona HR + split), dibaca AI lewat jalur yang
    sama: `POST /api/activity/scan` → `callAiEdge({action:"workout"})` → edge `my20fit-ai` →
    **OpenRouter** (model `AI_MODEL_MCU`, default `google/gemini-3-flash-preview`).
    - Endpoint scan **tidak menyimpan apa pun** — hasilnya mengisi dialog supaya user
      memeriksa dulu. Angka yang tidak terbaca dibalikan **null**, tidak ditebak; kolom yang
      kosong di dialog memang tidak terbaca.
    - Gambar **diperkecil di browser** (maks sisi 1400px, JPEG 0.82) sebelum dikirim ke scan —
      batas body Express 8MB tak muat untuk lima screenshot ukuran penuh. Yang diunggah ke
      Storage tetap berkas aslinya.
    - `my20fit_workout.uploaded_file_url` cuma muat SATU url, jadi daftar lengkap + jejak
      bacaan AI (confidence, kolom yang dibaca) disimpan di **`raw_data`** (jsonb, sudah ada
      di migration 017). **Tidak perlu migration baru.**
    - Daftar jenis workout di prompt edge, validasi server, dan `<select id="fType">`
      SENGAJA sama persis (`run/cycling/gym/hyrox/swimming/other`) supaya tak perlu lapisan
      pemetaan yang bisa melenceng.
    - Kalau bucket belum ada, pembacaan AI **tetap jalan** dan user diberi tahu gambarnya
      tidak tersimpan — supaya fitur bisa diuji sebelum bucket dibuat.
    - **BELUM TERVERIFIKASI:** akurasi bacaan pada screenshot tracker ASLI. Diuji dengan
      respons AI tiruan; ketepatan OCR baru bisa dinilai setelah edge fn di-deploy ulang.
- **"Today's Food" di `/calories`: seret makanan antar waktu makan (1 Okt 2026).**
  Item bisa diseret ke Breakfast/Lunch/Dinner/Snack (Pointer Events di `calories.html`,
  `moveItemMeal()`): mouse dari seluruh baris, sentuh hanya dari pegangan titik-titik di
  kiri supaya gulir halaman tetap normal. Yang berubah cuma field `m` item (sama dengan
  pilihan "Waktu makan" di dialog Ubah), lalu disimpan lewat `save()` → `cal_items`.
  Ikon di judul waktu makan & tombol tambah cepat dihapus (properti `e` di `MEAL_TX`
  ikut dihapus). **BELUM TERVERIFIKASI:** apakah app calorietracker native membaca `m`
  saat mengelompokkan (kalau tidak, item yang dipindah tampil di grup jam-nya di sana).
- **"Today's Food": ketuk makanan = buka analisanya (1 Okt 2026).**
  Hasil scan foto sebelumnya TIDAK pernah disimpan (hanya di memori sampai popup ditutup).
  Sekarang `addScanned()` menyimpan ringkasan analisa ke `cal_items` (aditif, tanpa
  migration): semua item satu batch dapat `sid` sama, ringkasannya (`sa`, dipangkas ±1KB:
  kalori+rentang, keyakinan, makro, skor kenyang/sehat, tag, analisa, rekomendasi, insight,
  porsi per item) cukup di SATU item; `del()` memindahkan `sa` ke saudaranya kalau item
  pembawanya dihapus. Ketuk baris → `openItemAnalysis()` memakai `renderScanDetail()` yang
  sama dengan popup scan (mode baca saja, tanpa tombol koreksi/tambah) + tombol "Ubah makanan
  ini". **Item TANPA `sa`** (scan sebelum fitur ini, dari app lain) dianalisa SEKALI saat
  dibuka lewat `POST /api/scan/food-analyze` (aksi AI "food" mode teks yang sama dengan
  `/api/scan/food-text`, gratis, kena `aiUserLimiter`): kalori & makro TETAP angka tercatat
  (hasil AI ditimpa server), rentang/keyakinan foto dibuang, label "Analisa dari nama & angka
  makanan yang tercatat (bukan dari foto)"; hasilnya disimpan sebagai `sa` (`basis:"logged"`).
  Makanan yang **diketik manual** (`estimateFood`) kini juga menyimpan analisa AI-nya
  (`basis:"text"`; hasil dari kamus koreksi 20FIT hanya angka, jadi tidak). Mengubah
  nama/angka item lewat dialog Ubah membuang `sa` ber-`basis` (dibuat ulang saat dibuka);
  analisa scan foto tetap. Kalau AI gagal: penilaian dari angka + tombol Coba lagi.
- **Bagian "Riwayat" di `/calories` dihapus (1 Okt 2026, permintaan pemilik).** Yang tersisa
  kartu "Minggu Ini" (chart 7 hari); `loadWeek()` kini hanya mengambil 7 hari, bukan 14.
  **BELUM TERVERIFIKASI:** apakah app calorietracker native mempertahankan kunci `sid`/`sa`
  saat ia menulis ulang `cal_items` (kalau tidak, analisanya hilang untuk hari itu).
- **`/calories` disamakan dengan home calorietracker.20fit.id (21 Sep 2026).**
  Hasil pembandingan repo `Marketing-project-wq/Calories.20fit` terhadap `calories.html`:
  - **API-nya SUDAH tersambung sejak awal.** `constants.ts` di calorietracker menyetel
    `API_BASE = MY20FIT` dan memanggil `/api/scan/ai`, `/api/scan/food-text`,
    `/api/scan/food-correction`, `/api/scan/quota`, `/api/scan/buy` — semuanya endpoint
    milik repo INI dan sudah ada di `server.js`. Jadi calorietracker adalah KLIEN
    my.20fit.id, bukan layanan terpisah yang perlu di-proxy.
  - **Panel 1-9 sudah ada** di `/calories`: target+termometer, makro, scan foto, ketik
    manual, health meter, cek per-item, nutrient gap, saran makan berikutnya (semuanya
    di `fsum*` dalam `calories.html`), puasa (`js/fasting.js`), dan daftar "Today's Food"
    lengkap dengan tombol hapus (`#log` + `del(i)`).
  - **Yang BENAR-BENAR kurang cuma satu: Rencana Makan harian.** Sudah dibuat:
    `js/meal-plan.js` — port vanilla dari `src/lib/mealPlan.ts`. Aturan pemilihannya
    disalin apa adanya: porsi 25/35/30/10 persen, PRNG mulberry32 ber-seed (seed =
    hari ke-n dalam setahun, "Acak lagi" menaikkan seed), toleransi jarak
    `budget*0.35+40`, shortlist 4, dan satu resep tak dipakai dua kali sehari.
  - Sumber datanya `/api/menu/catalog` (120 resep, sudah ada) — sama dengan sumber yang
    dipakai calorietracker. Tidak ada API baru.
  - **Tautan resep pakai `/recipe?q=<nama>`**, karena `/recipe` BELUM punya deep-link per
    resep (hanya filter `q`/`category`/`diet`/`kcal`/`sort`). Kalau deep-link per resep
    dibuat nanti, tautan ini sebaiknya diarahkan ke sana.
  - **BELUM DIKERJAKAN:** `js/fasting.js` di sini 93 baris, `src/lib/fasting.ts` di
    calorietracker 231 baris — fitur puasanya lebih dangkal. Selisihnya belum
    diperiksa baris-per-baris. **TANYA PEMILIK REPO** apakah perlu disamakan juga.
  - **CATATAN:** calorietracker membaca tabel `ct_meal` (tanpa prefix `my20fit_`).
    Tabel itu milik app tersebut; repo ini TIDAK menyentuhnya (CLAUDE.md §4).

- **`/calories`: kelompok waktu makan + ubah item + chart mingguan + riwayat (21 Sep 2026).**
  Menjawab permintaan "pasang semua fitur calorietracker.20fit.id di /calories".
  Semuanya di atas `my20fit_daily_log.cal_items` yang SUDAH dipakai bersama — nol tabel baru,
  nol endpoint baru.
  - **Waktu makan** (sarapan/siang/malam/cemilan): aturan disalin dari calorietracker
    (`src/lib/memberTracker.ts` — `inferMeal`/`itemMeal`). Kunci `m` bersifat aditif di
    dalam `cal_items`; item lama tanpa `m` dikelompokkan dari JAM-nya dengan batas yang
    sama persis (<10 sarapan, <15 siang, <21 malam, sisanya cemilan), jadi satu item
    jatuh di ember yang sama di kedua app.
  - **Ubah item**: nama/kalori/P/C/F/waktu makan. `saveEdit()` MENYALIN item lalu menimpa
    field yang diedit saja — kunci `mid`/`cid` milik calorietracker (tautan ke `ct_meal`
    untuk breakdown kaya di History-nya) TIDAK ikut terhapus. Diuji.
  - **Chart mingguan & riwayat 14 hari** (riwayat dihapus 1 Okt 2026, lihat di atas): `Auth.getDailyRange()` (baru di `js/auth.js`),
    query-nya sengaja sebentuk dengan `src/lib/memberHistory.ts` milik calorietracker
    (select `log_date,cal_items` dari `my20fit_daily_log`, filter `auth_user_id`, urut
    turun), jadi angkanya pasti sama di kedua app. Hari ini dibaca dari state di layar,
    bukan dari DB, supaya tidak tertinggal.
  - **BELUM dikerjakan, dan alasannya:**
    - **Favorit** — butuh penyimpanan sendiri. `cal_items` per-hari, jadi tidak muat.
      Perlu tabel `my20fit_*` + migration manual. Lagipula **calorietracker belum punya
      fitur favorit**, jadi tidak ada lawan sinkronnya sekarang. **TANYA PEMILIK REPO.**
    - **Artikel nutrisi** — tabel `nutrition_articles` ADA (12 baris) tapi TANPA prefix
      `my20fit_` alias milik app lain (CLAUDE.md §4). Rencananya dibaca lewat endpoint
      proxy read-only di `server.js` supaya kredensial tetap di server; belum dibuat.
    - **Field fiber/gula/catatan/satuan porsi** di form tambah — belum ada di bentuk
      `cal_items` yang dipakai bersama; menambahkannya aman (aditif) tapi calorietracker
      tidak akan menampilkannya. **TANYA PEMILIK REPO** apakah tetap mau.
  - **Dokumen permintaannya keliru di dua titik, dicatat supaya tidak diulang:**
    (a) `calorie-service.js` **tidak ada** di repo calorietracker (`Marketing-project-wq/
    calories.20fit`) — lib-nya TypeScript (`memberTracker.ts` dkk), jadi tak ada yang bisa
    "di-copy persis"; (b) tabel `calorie_logs`/`calorie_profiles`/`calorie_favorites`/
    `calorie_daily_summary` **tidak ada** di DB live, dan membuatnya justru MEMUTUS sinkron
    (calorietracker menulis ke `cal_items`), sehingga TEST 2-5 di dokumen itu malah gagal.

- **Visbody tersambung ke Activity + bisa ditemukan (22 Sep 2026).**
  - `js/body-scan.js` — SATU pembaca bersama (`BodyScan.latest/all/count/latestWithPrev`),
    dipakai `/body-scan` dan `/activity` supaya tidak ada dua salinan query.
  - **`/activity` kartu "Status Tubuh"**: kalau ada hasil timbangan, angka TERUKUR
    (berat, lemak %, massa otot, BMI) menggantikan BMI perkiraan dari profil, lengkap
    dengan selisih terhadap scan sebelumnya dan tautan ke `/body-scan`. Tanpa hasil
    timbangan ATAU kalau tabelnya belum ada, kartu lama yang tampil — tanpa error.
  - **`/dashboard`**: item "Body Scan" ditambahkan ke menu produk (sebelumnya
    `/body-scan` tidak tertaut dari mana pun).
  - Diuji headless 3 keadaan: ada scan (kartu terukur + delta + tautan), belum ada scan
    (kartu BMI lama), dan tabel belum ada / query gagal (kartu BMI lama, nol error JS —
    ini keadaan produksi sekarang).
  - **BELUM dikerjakan:** BMR dari timbangan belum dipakai untuk target kalori di
    `/calories`. Itu mengubah angka target milik user, jadi perlu keputusan pemilik dulu
    (disarankan: tampilkan sebagai referensi, bukan menimpa target diam-diam).

- **`/body-scan` RUSAK TOTAL sejak dibuat, diperbaiki (23 Sep 2026).** Halaman itu punya
  `function L(o){ return (window.L?window.L(o):…) }` di level teratas script inline.
  Deklarasi fungsi top-level bernama `L` **menimpa** `window.L` milik `js/i18n.js:403`,
  jadi `window.L(o)` memanggil dirinya sendiri → `RangeError: Maximum call stack size
  exceeded` pada pemanggilan `L()` pertama. Dibuktikan dijalankan di Chromium, bukan
  dibaca: sebelum script inline `L()` mengembalikan `"Berat"`, sesudahnya melempar, dan
  `window.L === L` bernilai `true`. Tidak pernah ketahuan karena tabelnya masih 0 baris
  sehingga halaman selalu berhenti di keadaan kosong. **Halaman lain tidak kena** — hanya
  `body-scan.html` yang punya pembungkus ini (`grep`: 0 di `activity/calories/event/
  classes`). Perbaikannya: pembungkus dihapus, pakai `window.L` langsung seperti halaman lain.
- **Rentang acuan & status Visbody sekarang ditampilkan (23 Sep 2026).** Tiap metrik dari
  Visbody berbentuk `{name,value,unit,extra:{status_info:{description},reference:{low,
  standard,high}}}`. Selama ini `extra` ikut tersimpan di `raw_data` tapi **tidak pernah
  dibaca** — member cuma melihat angka telanjang. Sekarang `/body-scan` menampilkan chip
  Normal / Di atas normal / Di bawah normal + rentang normalnya. `raw_data` sengaja TIDAK
  masuk daftar kolom daftar (satu baris bisa puluhan KB × 50 baris); diambil per scan lewat
  `BodyScan.detail()`. Status yang tidak dikenali tidak ditebak, dan rentang hanya digambar
  kalau `low < high` — contoh resmi `visceral_fat_grade` punya `standard:"0"` padahal
  `low:"0.90"`.
- **Duplikasi query dihapus (23 Sep 2026).** `body-scan.html` ternyata punya query
  `my20fit_visbody_body` **sendiri** dan tidak pernah memuat `js/body-scan.js`, padahal
  komentar di modul itu mengklaim jadi satu-satunya pembaca (CLAUDE.md §2). Sekarang
  halaman memakai `BodyScan.state()/reset()`; sisa query di repo: 1 di server (tulis),
  1 pembaca bersama.
- **Visbody S20 (timbangan body composition) — KODE SIAP, BELUM BISA JALAN (22 Sep 2026).**
  `db/supabase-migration-019-visbody.sql`, `lib/visbody.js`, 4 route `/api/visbody/*`,
  halaman `/body-scan`.
  - **Nama tabel `my20fit_visbody_scan` + `my20fit_visbody_body`**, bukan `visbody_scans` /
    `visbody_body_composition` seperti spesifikasi (CLAUDE.md §4). Dicek ke DB live:
    belum ada tabel apa pun berawalan `visbody` maupun `my20fit_visbody`.
  - **Scan TIDAK dicocokkan otomatis ke akun.** Identitas yang diketik di layar timbangan
    tidak terverifikasi, jadi mencocokkannya otomatis = menyerahkan data komposisi tubuh
    seseorang ke akun yang belum tentu dia. **(2026-09-30: alur claim diganti — lihat "Visbody
    Journey Fase 1" di §2. `bind-user` + jendela 30 menit sudah DIHAPUS.)** Klaim tetap atomik
    (`.is("auth_user_id", null)`) supaya dua orang yang memindai QR sama tidak sama-sama dapat.
  - **QR dibuat di server** pakai `js/qrcode-generator.js` yang sudah ada di repo, BUKAN
    dikirim ke `api.qrserver.com` seperti contoh spesifikasi — scan_id tidak perlu bocor
    ke layanan pihak ketiga.
  - **TIGA KEKELIRUAN SPESIFIKASI yang diperbaiki, bukan disalin:**
    1. `timingSafeEqual` tanpa cek panjang → MELEMPAR (dibuktikan:
       `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`), jadi signature palsu berbuah 500, bukan 401.
    2. HMAC dihitung atas `JSON.stringify(req.body)` — itu hasil serialisasi ULANG, bukan
       byte yang ditandatangani Visbody, jadi verifikasi akan selalu gagal. Sekarang
       memakai `req.rawBody` (penangkapnya diperluas ke `/api/visbody/`).
    3. Alur bind-lewat-QR di spesifikasi tidak pernah mengambil data ukurnya, dan endpoint
       `/api/visbody/bind-user` yang dipanggil halaman bind tidak pernah ditulis.
  - **`my20fit_profile` TIDAK punya kolom `birthdate`** (dicek ke DB live: yang ada `age`).
    Kode awal saya meminta kolom itu dan akan membuat bind gagal diam-diam; sudah diperbaiki.
  - **BELUM DIUJI KE API ASLI** — kredensial `VISBODY_*` belum ada dan tidak ada timbangan.
    Yang sudah diuji: `lib/visbody.js` unit (20/20: signature, anti-replay, device creds,
    pemetaan nilai null vs 0) + pembuatan QR beneran jalan di Node. Route express-nya
    **belum pernah dijalankan** — `npm install` diblokir registry di lingkungan ini.
  - **TUGAS PEMILIK → langkah lengkapnya sekarang di `docs/VISBODY-SETUP.md`** (pesan siap
    kirim ke Visbody, nama variabel Railway, URL yang didaftarkan, cara uji, cara baca
    kegagalan). Ringkasnya: (1) ~~migration 019~~ **SUDAH dijalankan 22 Sep 2026** — kedua
    tabel ada, RLS aktif, **0 baris**; (2) minta `VISBODY_ACCOUNT_KEY`,
    `VISBODY_ACCOUNT_SECRET`, `VISBODY_WEBHOOK_SECRET` + serial timbangan ke Visbody;
    (3) buat sendiri `VISBODY_DEVICE_KEY`/`VISBODY_DEVICE_SECRET` lalu berikan ke Visbody;
    (4) daftarkan ke Visbody: webhook `https://my.20fit.id/api/visbody/webhook`,
    token `/api/visbody/token`, qrcode `/api/visbody/qrcode`.
    **Selama (2) dan (4) belum selesai, nol data bisa masuk** — bukan karena kodenya, tapi
    karena webhook tidak pernah dikirim dan tanda tangannya tidak bisa diverifikasi.
  - **BELUM TERVERIFIKASI — TANYA VISBODY:** bentuk persis body webhook (`scan_id`,
    `event_id`, `device_sn`, `user_info.third_uid`, `measured_items`) dan nama header
    (`x-visbody-timestamp`, `x-visbody-signature`) diambil dari rangkuman di prompt, bukan
    dari dokumen/respons asli. Kalau berbeda, yang perlu disesuaikan cuma pemetaan di
    route webhook + `verifyWebhook()`.

- **Sinkronisasi ekosistem (calorie / recipe / MCU) — SUDAH JALAN, jangan dibuat ulang.**
  Diperiksa ke DB LIVE + kode calorietracker pada 21 Sep 2026, setelah ada dokumen yang
  mengusulkan 8 tabel baru (`calorie_logs`, `calorie_profiles`, `calorie_daily_summary`,
  `calorie_favorites`, `recipe_bookmarks`, `recipe_meal_plans`, `mcu_scans`,
  `mcu_scan_results`). **Usulan itu TIDAK dijalankan**, dan ini alasannya:
  - **Kalori sudah sinkron lewat `my20fit_daily_log.cal_items`.** Bukan dugaan — komentar
    di kode calorietracker sendiri menyatakannya: `src/lib/memberTracker.ts:20` "ADDITIVE
    to the cal_items shape **my.20fit.id shares**", dan `src/lib/scanMeal.ts:3` menulis ke
    `my20fit_daily_log.cal_items` "**so my.20fit.id stays consistent**". Kedua app
    membaca DAN menulis kolom yang sama.
    Membuat `calorie_logs` = penyimpanan KETIGA → justru memutus sinkron yang sudah jalan,
    dan itu persis "tabel duplikat" yang dilarang dokumen itu sendiri.
  - **Resep juga menulis kalori ke kolom yang sama.** recipe.20fit.id (repo
    `Marketing-project-wq/MENU`) punya `src/lib/calorieLog.ts` yang menambah entri ke
    `my20fit_daily_log.cal_items` dengan bentuk `{name,kcal,p,c,f,t}` dan komentar
    "POLA PERSIS my.20fit (`Auth.saveDaily`)". Jadi kolom itu dipakai TIGA app.
    Di DB live ada **153 baris** `my20fit_daily_log` dengan `cal_items` terisi.
  - **MCU SUDAH SINKRON DUA ARAH — terverifikasi 21 Sep 2026** (dulu ditulis BELUM
    TERVERIFIKASI di sini; sekarang sudah dibaca). medicalscanner.20fit.id = repo
    `Marketing-project-wq/MEDICAL-CHECK-UP-`. Browser-nya menyimpan hasil scan ke
    **`my20fit_mcu_result`** di bawah RLS (`src/client/app.js:508` insert
    `{auth_user_id, result, analyzed_at}`), membaca riwayat dari tabel yang sama
    (`:593`) dan menghapus dari situ (`:577`). Tabel yang sama dibaca `/medical` di repo
    ini dan `server.js:4295`, serta sudah masuk `USER_DATA_TABLES` (`server.js:4411`).
    DB live: **18 baris**. Jadi `mcu_scans` + `mcu_scan_results` tidak diperlukan.
  - **`my20fit_mcu_pending_scan` sekarang YATIM — TANYA PEMILIK REPO.** 0 baris, dan
    tidak ada satu pun referensi ke tabel itu di repo ini (cek: `grep -rn
    mcu_pending_scan` cuma ketemu dokumen ini). Kolomnya (`anon_id`, `teaser`) cocok
    dengan alur "tahan hasil sampai daftar" yang di repo MCU sudah DIHAPUS —
    komentarnya: "no teaser, no anonymous hold-until-signup — those violated §0.1 and
    are gone". Kandidat kuat untuk di-drop, TAPI jangan di-drop sebelum pemilik
    konfirmasi tak ada app lain yang memakainya. (Baris lama di sini menulis tabel ini
    "sudah dipakai server.js" — itu KELIRU.)
  - **Bookmark resep: tabelnya ada, tapi sinkronnya SATU ARAH.** `my20fit_menu_save`
    (`id, auth_user_id, source, menu_id, created_at`, 2 baris) ditulis & dibaca
    `server.js` (`POST /api/menu/:id/save`, `GET /api/menu/saved`). recipe.20fit.id
    **belum punya fitur simpan sama sekali** — `grep` di repo MENU tidak menemukan
    `my20fit_menu_save` maupun bookmark; yang ada cuma `my20fit_menu_reaction` (love),
    dan komentarnya sendiri mencatat "save = 0". Jadi `recipe_bookmarks` bukan cuma
    duplikat, tak ada yang perlu disinkronkan dari sisi sana. Kalau mau bookmark
    lintas-app, yang benar: recipe.20fit.id memakai endpoint `/api/menu/:id/save`
    yang SUDAH ada — bukan tabel baru.
  - **`recipe_meal_plans` tidak dibuat, dan memang tak perlu tabel.** Rencana makan di
    `/calories` (`js/meal-plan.js`) deterministik dari seed hari-ke-N + katalog
    `/api/menu/catalog`, hasilnya sama tiap kali dihitung ulang, jadi tak ada state
    yang perlu disimpan.
  - **Semua nama tabel usulan melanggar CLAUDE.md §4** (tanpa prefix `my20fit_`, di project
    Supabase yang dipakai bersama ratusan tabel app lain). Bukan kekhawatiran teoretis:
    di project yang sama SUDAH ADA `mcu_articles`, `mcu_quiz_api_keys`,
    `recipe_admin_role`, `recipe_admin_audit_log` — tanpa prefix, milik app lain.
    `mcu_scans` / `recipe_bookmarks` akan duduk persis di sebelahnya.
  - **`ct_meal` / `ct_meal_component` / `ct_meal_audit`** milik calorietracker (detail menu,
    ditautkan dari `cal_items.mid`). Repo ini TIDAK menyentuhnya.
  - Yang DIKERJAKAN dari dokumen itu: (a) penyelarasan nama URL `/recipes` → `/recipe`
    dan `/mcu` → `/medical` (301); (b) seksi **"Resep tersimpan"** di `/recipe` — lihat
    butir berikutnya. Halamannya tidak diduplikasi, tabel baru tidak dibuat.
  - **TANYA PEMILIK REPO — `MY20FIT_ORIGIN` di app MCU.** `/api/analyze-mcu` yang dipanggil
    medicalscanner.20fit.id **tidak ada di repo ini**; endpoint itu ada di repo
    `my20fit-dashboard` (`artifacts/api-server/src/routes/mcu.ts:21`). Tapi default di
    kode MCU adalah `https://my.20fit.id` (`src/server.js:34`), jadi kalau env
    `MY20FIT_ORIGIN` di Railway-nya tidak di-set ke host dashboard, scan-nya kena 404.
    Perlu dicek pemilik — repo itu di luar repo ini, tidak diubah dari sini.

- **`/recipe`: seksi "Resep tersimpan" (21 Sep 2026).** `GET /api/menu/saved` sudah ada
  sejak lama di `server.js:5727` dan terdaftar di OpenAPI, tapi **tidak ada satu pun
  pemanggil di frontend** — tombol Simpan menulis ke `my20fit_menu_save`, lalu tak ada
  halaman yang membacanya kembali. Sekarang `/recipe` menampilkannya di atas daftar resep.
  Tanpa tabel baru, tanpa endpoint baru.
  - Resep resmi di-resolve dari katalog yang sudah dimuat; menu member yang tersimpan tapi
    tak terbawa `/api/menu/published` di-hydrate dari payload `members` endpoint itu sendiri.
  - Entri yang resepnya sudah tidak ada di katalog TIDAK dikarang atau disembunyikan diam-diam
    — dihitung dan ditulis apa adanya ("N resep tersimpan sudah tidak tersedia").
  - Seksinya disembunyikan kalau user belum pernah menyimpan apa pun.
  - Tombol Simpan/Batal simpan di detail resep langsung memperbarui seksi ini tanpa reload.
  - Diuji headless (Chromium) untuk 3 keadaan: ada simpanan (kartu tampil + catatan hilang),
    `/api/menu/saved` gagal 500 (pesan + tombol coba lagi), dan belum ada simpanan
    (seksi hidden). Termasuk un-save → kartu hilang, save lagi → kartu balik.
  - Ikut diperbaiki: `toggleLike`/`toggleSave` dulu meninggalkan tombol `disabled` selamanya
    kalau request-nya gagal (pola bug yang sama dengan `genPlan` di /activity).

- **[DIGANTI 2026-09-30 — quiz & kartu analisis dihapus dari /activity, lihat §2]** **Quiz "Set Your Goal" SEKARANG TERPASANG di `/activity` (21 Sep 2026).** Sebelumnya
  `js/goal-quiz.js` sudah ada tapi tak dipanggil dari mana pun (dead code menurut
  CLAUDE.md §8). Sekarang: tombol **"Tentukan targetmu"** di kartu "Belum ada rencana"
  membuka quiz di dalam `#aiBox`; `onComplete` mengembalikan kartu analisis lalu lanjut
  ke `genPlan()` — lewat gerbang `hasWorkout()` yang sudah ada, jadi kalau belum ada
  workout yang muncul tetap pemandu upload, bukan API call yang gagal.
  - Komponennya sendiri HANYA menyimpan + memanggil `onComplete`; pembuatan rencana
    tetap milik `activity.html`.
  - Perbaikan tata letak: 3 kotak jadwal harian dulu **menumpuk di bawah 400px** —
    melanggar spesifikasi ("3 kotak sejajar") persis di lebar sasaran ~390px. Sekarang
    tetap 3 kolom (`repeat(3,minmax(0,1fr))`), yang mengecil huruf & padding-nya.
    Diukur di viewport 390px: tiga kotak sama lebar (84px), satu baris, nol teks
    terpotong, nol overflow horizontal.
  - **Tanpa migration 018, tombol simpannya GAGAL** — dan itu ditampilkan apa adanya:
    "Tabel goal belum ada di database (migration 018). Hubungi admin.", quiz tetap
    terbuka, tombol bisa dicoba lagi. Diuji headless.

- **Migration 017, 018, 020–025 SUDAH DIJALANKAN (2026-09-29).** Dijalankan agent lewat
  koneksi Supabase atas izin eksplisit pemilik, berurutan 017→025 (semuanya aditif, hanya
  tabel `my20fit_*`). Terverifikasi ke DB live: 14 tabel baru ada + RLS aktif + 1 policy
  masing-masing, `my20fit_workout` kini 20 kolom, `my20fit_daily_log.steps` ada.
  (Catatan lama: per 21 Sep 017 & 018 dipastikan belum jalan — sudah tidak berlaku.)

  - **TUGAS PEMILIK sebelum fitur ini utuh:** (1) ~~jalankan migration 017~~ selesai 2026-09-29; (2) ~~buat bucket
    Storage `workout-uploads` (PRIVAT)~~ **selesai 2026-09-29** (privat, maks 5 MB, png/jpeg/webp —
    sama dengan validasi `/api/activity/upload`); (3) ~~deploy ulang edge fn `my20fit-ai`~~ **tidak
    perlu** — versi 55 yang live (deploy 2026-09-28) sudah memuat aksi `plan`/`workout`/`chat`/`activity`
    dari repo; diuji langsung 2026-09-29: `chat` membalas normal; (4) Strava OAuth (Client ID/Secret di Railway + redirect URI di
    dashboard Strava) — tombol tracker sekarang jujur bilang "belum tersambung".
  - **TANYA PEMILIK REPO — tabrakan nama:** item nav `nav_progress` berlabel **"Activity"/"Aktivitas"**
    tapi menuju `/progress`. Sekarang ada dua hal bernama Activity. Nav SENGAJA tidak diubah
    (menyentuh semua halaman); `/activity` diakses dari tile dashboard.
  - **BELUM TERVERIFIKASI:** OCR screenshot workout (belum ada — angka diisi user), sinkronisasi
    tracker (belum ada satupun), dan perilaku di perangkat nyata.

- **OpenAPI/Scalar untuk Recipe App API + Content API v1 (PR #454, #455) MERGE LANGSUNG KE `main`.**
  Dikerjakan sesi lain dan **melewati `staging`** — melanggar CLAUDE.md §1. Tidak di-revert (sudah
  jalan di produksi, tidak ada tanda kerusakan), tapi dicatat di sini supaya tidak terulang:
  `openapi/openapi.json`, `openapi/openapi.yaml`, `scripts/generate-openapi.js`, +44 baris di
  `server.js`. `staging` disinkronkan menyusul lewat rilis 2026-09-19. **BELUM TERVERIFIKASI:**
  apakah endpoint dokumentasinya sudah dites di produksi.


- **Tiket user tidak muncul — akar masalahnya DI LUAR repo ini (PR #417).** Tiket **tidak disimpan di Supabase kita**: sapuan `pg_stat_user_tables` menunjukkan tak ada tabel yang menerima pembelian tiket baru, dan `my20fit_orders` berisi **nol** `kind='ticket'`. Tiket hidup di **ticket.20fit.id**, dibaca lewat edge function `ticket-embed`.
  - **Titik gagal:** `POST /api/embed/v1/partner/user-token` balas **404 pada 141 dari 143 panggilan** (log edge fn 24 jam; action dipisah lewat ukuran body request — `user_token`=23 B, `events`=19 B, `my_tickets`=282–321 B). Langkah `my_tickets` sendiri **selalu 200** saat tokennya terbit, termasuk mengembalikan tiket asli. Jadi pipeline utuh; yang gagal penukaran email→token.
  - **Sudah disingkirkan:** `TICKET_EMBED_KEY` terpasang (`events` → 200); email profil vs `auth.users` **0 beda** dari 1374; email di `my20fit_buyer_identities` **0 beda** dari 921.
  - **Sudah diperbaiki di PR #417:** `/api/tickets/mine` kini membawa `reason` + `source` saat kosong, dan widget membedakan "belum beli" / "akun tak dikenali penerbit" / "gagal memuat". Sebelumnya semua kegagalan tampil sama sebagai "Belum ada tiket" sehingga masalah tak pernah terlihat. `?debug=1` (superadmin) membuka respons mentah upstream.
  - **Sebab 404-nya terukur (bukan salah data kami):** `/partner/user-token` menjawab "email ini punya AKUN?", **bukan** "punya TIKET?". **8 dari 8** pembeli asli → 404; **3 user yang belum pernah beli** → 200; email **fiktif** → 404 yang identik. Pencocokan case-**insensitive** (HURUF BESAR pun 200). Jadi pembeli **tamu** (guest checkout, tanpa akun) tak pernah bisa ditampilkan lewat jalur ini.
  - **Jalur OTP penerbit (PR #419) — terbukti bekerja, tapi SUDAH DIHAPUS dari produk.** `/otp/verify` memang menerbitkan `userToken` untuk email tanpa akun (baris nyata `my20fit_ticket_tokens`, dibuat 2026-09-08 14:04:32, token 248 karakter) — jadi pertanyaan "apakah OTP menolong pembeli tamu" terjawab **ya**. Tapi atas keputusan pemilik (TANPA OTP), commit `d1c2a38` (2026-09-09) **membuang seluruh jalur itu**: endpoint `/api/tickets/verify/*` hilang, `getTicketToken` hilang, dan tabel `my20fit_ticket_tokens` **tidak lagi disentuh kode mana pun** — tabelnya masih ada di DB, hanya menganggur.
  - **Token penerbit hanya hidup 900 detik (15 menit) — TERVERIFIKASI 2026-09-09.** Baris nyata: `expires_at` = 14:19:32, tepat 900 detik setelah dibuat. Token itu dikirim ulang ke `/me/tickets` ~16 jam kemudian dan dibalas **`401 {"error":"user_unauthorized","message":"Missing/invalid X-Embed-User-Token"}`** (diuji lewat `pg_net` dari dalam Postgres supaya nilai tokennya tidak pernah keluar dari database). **Sekarang bukan lagi masalah user:** token tidak disimpan lagi, jadi `/api/tickets/mine` mint ulang lewat `/partner/user-token` pada **setiap** permintaan. Permintaan "TTL lebih panjang / refresh token" karena itu **dicabut** dari `docs/TICKET-API-REQUEST.md` dan turun jadi catatan terukur di sana — bukan permintaan.
  - **Desain yang HIDUP sekarang (`d1c2a38`, sudah di production sejak `5a406ec` 2026-09-11): TANPA OTP, tanpa gate.** `/api/tickets/mine` ambil email dari sesi login → `my20fit_profile` → tukar jadi token lewat jalur **partner server-ke-server**. Tiga hasil:
    - Email **dikenal** penerbit → tiket asli + **QR gerbang** (`attachQrs`, paralel — N+1 hilang), plus `event_qty` (dihitung dari pengelompokan; skema penerbit flat 1 baris = 1 tiket) dan cover/tanggal dilengkapi dari katalog. `source:"embed"`.
    - Email **tidak dikenal** penerbit → jatuh ke arsip `event_transaction` (read-only, tabel app lain): nama event, jenis, tanggal, "Lunas" — **tanpa QR** (`qr:null`, `qr_pending:true`). QR tidak pernah dikarang, dan status gerbang tidak pernah ditulis "valid". `source:"archive"`.
    - Dua-duanya kosong → `source:"none"` + `reason` (`no_tickets` / `upstream_unavailable` / `server_error` / dst.) supaya kegagalan nyata tidak tersamar jadi "belum beli".
  - **Gate konfirmasi: TIDAK ADA — dan sekarang tombol verifikasinya pun tidak ada.** Diselidiki 2026-09-09: tidak pernah ada modal, route guard, checkbox, atau flag `isVerified`/`claimed` di kode kita. Tombol "verifikasi" yang dulu muncul saat hasil = 0 ikut terhapus bersama jalur OTP.
  - **Production sudah sejajar `staging`** (`bb259f4`, 2026-09-16) — catatan lama "main tertinggal PR #419/#421" **sudah tidak berlaku**.
  - **Auto-retry + recovery (PR #438, `bb259f4`):** `ticket-wallet.js` kini retry otomatis sekali (3s delay) saat `loadUpcoming()` atau `loadTickets()` gagal — menghindari error permanen akibat server restart saat deploy. Ditambah listener `visibilitychange` + `online` yang memuat ulang data otomatis saat tab aktif kembali atau koneksi pulih. Retry hanya sekali; kalau masih gagal, tampil error + tombol "Coba lagi" manual seperti biasa.
  - **Tidak ada webhook pembelian sama sekali.** `sync-ticket-events` hanya menarik `/events` dan menyimpan `sold_count` **agregat**, tak pernah identitas pembeli. Terukur 2026-09-08: Sports Summit live `sold`=**1233** vs `my20fit_ticket_events.sold_count`=**1162** (sync 2026-09-07 21:00) → **+71 terjual sejak sync**, sementara di DB kami **nol baris hari itu**. Pembayaran berhasil dan tercatat di ticket.20fit.id, tapi kami tak punya cara tahu siapa pembelinya — **tidak ada baris yang bisa "diperbaiki" di sisi kami.**
  - **TANYA PEMILIK ticket.20fit.id:** permintaan teknisnya sudah ditulis lengkap di **`docs/TICKET-API-REQUEST.md`** — intinya minta **webhook pembelian** atau **endpoint partner baca pesanan per email**. Sampai salah satunya ada, pembeli yang emailnya belum dikenal penerbit hanya bisa melihat pembeliannya dari **arsip, tanpa QR**.
  - **Arsip `event_transaction` bukan data hidup** — impor batch invoice, `paid_at` terbaru 2026-08-11, impor terakhir 2026-08-18. Tetap disajikan (isinya pembelian nyata; 242 dari 1374 user app punya email di sana) tapi ditandai `source:"archive"`. Pembelian baru tak akan pernah muncul di sana.
- **Login Google — diagnosis dari log Supabase (2026-09-29).** Login Google terakhir yang BERHASIL di
  `auth.identities` = **2026-08-18**; sejak itu nol. Log auth 24 jam terakhir: ±15 kali `/authorize`
  (user dikirim ke Google) tapi hanya 1 `/callback` (gagal "OAuth state parameter missing") → user
  **tidak pernah dikembalikan Google**. Dugaan kuat (belum bisa dilihat langsung — `accounts.google.com`
  diblokir dari container agent): redirect URI `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback`
  belum terdaftar di OAuth client **`883349921349-4efr…`** (client yang kini dipakai Supabase).
  - **Redirect URLs Supabase (terukur dari field `referer` di log `/authorize`):** `https://profile.20fit.id/auth/callback`
    **diizinkan**; `https://my.20fit.id/auth/callback` dan `https://my.20fit.id/login` **DITOLAK** → jatuh ke
    **Site URL = `https://profile.20fit.id` (domain STAGING)**. Artinya user PRODUKSI yang login Google akan
    dipulangkan ke staging. **TUGAS PEMILIK sebelum rilis production:** (a) Google Cloud → client
    `883349921349-4efr…` → Authorized redirect URIs tambah URL callback Supabase di atas; (b) Supabase →
    Authentication → URL Configuration: Site URL = `https://my.20fit.id`, Redirect URLs tambah
    `https://my.20fit.id/**` (dan pertahankan `https://profile.20fit.id/**`).
- **Login Google web MATI — sebabnya di Google Cloud Console + Supabase, bukan di kode.** Gejala TERBARU (2026-09-17, screenshot pemilik): **`Error 400: redirect_uri_mismatch`**. Gejala lama (sebelum jalur GIS dibuang): `Access blocked: Authorisation error` · `no registered origin` · `Error 401: invalid_client`. **Panduan klik-per-klik untuk pemilik ada di `docs/GOOGLE_LOGIN_SETUP.md`.**
  - **Sebab terukur:** `server.js` memakai default hardcoded `26509397037-8d1s0c39hb31738fcl816b8jrv7fdt6i` yang komentarnya menyebut "Client ID web app 20FIT". Client ID yang **sama persis** terdaftar di repo app mobile sebagai reversed-client-id **iOS** (`20FIT_MOBILEAPP/ios/Runner/Info.plist` → `CFBundleURLTypes`/`CFBundleURLSchemes`). Client bertipe iOS **tidak punya kolom "Authorized JavaScript origins"**, jadi GIS di web selalu ditolak — menambah origin tidak akan menolong.
  - **Data:** `auth.identities` provider `google` = 287 (Jun 122, Jul 118, Ags 47, **Sep 0**); terakhir dibuat & terakhir login sama-sama **2026-08-18 05:22 UTC**. Provider `email` masih aktif harian. Tombol Google di web sendiri **baru masuk `main` hari ini** lewat `d041061` — sebelum itu tag SDK `accounts.google.com/gsi/client` tak pernah ada di `main` (`git log --full-history -S`). Dugaan (**BELUM TERVERIFIKASI**): 287 identitas itu dari app mobile, yang memang memakai `google_sign_in` v7 + `serverClientId`.
  - **Sudah diperbaiki di kode (PR #421):** default Client ID iOS dibuang (kosong → tombol disembunyikan); daftar audiens kosong pada `verifyGoogleIdToken` ditolak 503 supaya cek `aud` tak bisa dilewati; tombol cadangan yang memicu One Tap dihapus — kalau tombol resmi ditolak, One Tap ditolak juga, dan user diantar ke halaman error Google seolah app-nya rusak. Kini muncul pesan "Login Google sedang tidak tersedia" + arahan ke email/password.
  - **JALUR WEB SUDAH BUKAN GIS LAGI (diverifikasi 2026-09-17).** `login.html` memanggil `Auth.googleOAuth()` → `supabase.auth.signInWithOAuth({provider:"google", redirectTo:<origin>/login})`. Grep seluruh repo: **nol** referensi `accounts.google.com/gsi/client` / `google.accounts.id`, dan **nol** halaman web yang memanggil `Auth.googleSignIn` atau `Auth.googleClientId`. **Update 2026-09-29:** `Auth.fitcoGoogleLogin` + `Auth.googleSignIn` (sisa jalur GIS, tanpa pemanggil) **dihapus** dari `js/auth.js` atas persetujuan pemilik; endpoint server `/api/fitco-google-login` tetap (dipakai app mobile). Konsekuensi penting: **`GOOGLE_CLIENT_ID` di Railway TIDAK memengaruhi tombol Google di web** — env itu hanya dipakai `verifyGoogleIdToken` untuk `POST /api/fitco-google-login`, yaitu jalur **app mobile**. Catatan lama di sini yang menyuruh mengisi Railway untuk memperbaiki web **KELIRU** dan sudah diganti.
  - **Sebab `redirect_uri_mismatch` (terukur dari kode):** alur Supabase OAuth memulangkan user ke `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback`. Kalau URL itu tidak terdaftar di **Authorized redirect URIs** OAuth client yang dipasang di Supabase, Google menolak dengan pesan tersebut. Client bertipe iOS tidak punya kolom itu sama sekali.
  - **TUGAS PEMILIK (tidak bisa dari repo — butuh akses dashboard):** (A) Google Cloud project `26509397037` → OAuth client tipe **Web application**, Authorized redirect URI = `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback`; (B) Supabase → Authentication → Providers → Google: enable + isi Client ID & Secret client Web (client iOS lama JANGAN dihapus, tambahkan dipisah koma), lalu URL Configuration → Redirect URLs diisi `https://my.20fit.id/login` + URL staging; (C) **opsional, hanya untuk app mobile** → Railway `GOOGLE_CLIENT_ID` = client Web, `GOOGLE_CLIENT_IDS` = client iOS. Langkah persisnya di `docs/GOOGLE_LOGIN_SETUP.md`.
  - **Angka pembanding sebelum perubahan (diukur 2026-09-17):** `auth.users` = **2569**, email dobel = **0**, user punya identitas Google = **286**, user >1 provider = **20**. Dipakai untuk membuktikan ganti Client ID tidak membuat akun kembar. Supabase mencocokkan identitas lewat `sub` Google (bukan Client ID) sehingga seharusnya aman — **BELUM TERVERIFIKASI** sampai ada user lama yang login ulang.
  - **Token callback tidak nyangkut di URL (diverifikasi di bundle):** `js/vendor-supabase.js` = supabase-js **2.108.2**, `flowType` default `implicit` dan klien kita tidak menimpanya, jadi token datang di **fragment** (`#access_token=...`) yang tidak pernah dikirim ke server; cabang implicit di bundle menutup dengan `window.location.hash = ""` sehingga fragment langsung dibersihkan. Pindah ke **PKCE** (token tak pernah muncul di URL) **belum** ditempuh karena callback photo/calorietracker/menu masih bergantung fragment implicit — **TANYA PEMILIK REPO** kalau mau, itu pekerjaan terpisah.
- **CMS admin fisioterapis BELUM ADA.** `my20fit_physiotherapists` sudah dipakai frontend, tapi belum punya seksi di `/admin-v2` seperti dokter & coach — untuk sekarang hanya bisa diedit lewat SQL. Endpoint `/api/admin/physiotherapists` juga belum dibuat.
- **Ikon 3D: latar menyatu di dalam file PNG.** Kotak CSS sudah transparan (`.s2-ic.s2-ic3d` → `background rgba(0,0,0,0)`, terverifikasi via computed style), jadi latar yang terlihat berasal dari file di `media.20fit.id`. **TANYA PEMILIK:** perlu PNG versi transparan. Ikon 3D **Reward** juga belum ada filenya — tile Rewards masih SVG (`ic:"gift"`).
- **dr. Ande belum ada foto.** URL yang diberikan menunjuk file dr. Anna; tidak dipasang demi menghindari salah orang. Sementara pakai placeholder inisial + penanda.
- **Roster coach & alias diperluas (2026-09-25/26).** Ditambahkan coach solo (Brian, Elsen, Gilang, Andrew, Josea) + alias exact-name (`Brian`,`Elsen`,`Gilang`,`Andrew`,`Ista`,`YoKae`) dan **`Andro` (gym) → Coach Andrew** (ejaan jadwal gym). Foto 11 coach diperbarui.
  - **Belum dipetakan (TANYA PEMILIK):** gym `Chynthia`; co-teach `Kiki, Mae` / `Asa & Mae` (kalau mau Kiki/Mae muncul saat mengajar berdua). **Asumsi `Andro`=Coach Andrew** — koreksi kalau ternyata beda orang.

- **Membership catalog** (`/membership`): halaman + carousel + proxy `GET /api/membership/packages` **sudah dibuat** (PR #295), TAPI endpoint upstream katalog belum tersambung.
  - Proxy meneruskan ke arena-api pada path env `MEMBERSHIP_CATALOG_PATH` (default `/packages`), mapper defensif. Kalau path/shape belum cocok → balas `groups:[]` (halaman "empty", tanpa data karangan) dan **log `membership raw shape: …`** di server.
  - **TANYA PEMILIK:** path katalog upstream yang benar + bentuk response (Special Offer & Gym Membership) + set env `MEMBERSHIP_CATALOG_PATH` di Railway.
- **Halaman Event** (`/event`): placeholder "Upcoming". Layer data (`EventData.fetch`) & teks dipisah, siap disambung. **API Event BELUM ADA** (pemilik akan menyusulkan).

## 3. Fitur BARU direncanakan

- Sambungkan data Membership begitu endpoint dikonfirmasi.
- Bangun + sambungkan API Event (`/api/events`) ke `event.html`.

## 4. Bug / utang teknis diketahui
- **Coach membalas dalam bahasa tombol EN/ID, bukan bahasa yang diketik user — DIPERBAIKI 2026-10-01.** Sekarang server
  mendeteksi bahasa pesan (`coachDetectLang`, kata penanda ID/EN; istilah dua bahasa seperti plan/workout tak dihitung),
  fallback ke pesan user sebelumnya lalu bahasa UI, dan menaruh pengingat bahasa tepat sebelum pesan user. Tombol cepat
  chat versi EN dulu mengirim kalimat Indonesia — sekarang kalimat Inggris. Deteksi berbasis daftar kata → pesan campur
  (Indo-English) diputuskan oleh mayoritas kata penanda; **belum diuji dengan AI asli**.
- **Pencapaian & Riwayat 20FIT pindah dari /activity ke /profile (1 Okt 2026, permintaan pemilik).**
  Dua modul bersama baru/diperluas supaya satu sumber: `js/arena-history.js` (`ArenaHistory.load/html/badge/time`
  — fetch `/api/arena/history` sekali per halaman + render booking kelas/paket/venue) dan `js/achievements.js`
  (`Ach.weekDates/weekDays/gridHTML` — minggu berjalan + grid lencana). `/profile` menampilkan section
  "Pencapaian" + "Riwayat 20FIT" (di atas Kontribusi Menu). `/activity` tidak lagi merender keduanya; popup lencana
  (`Ach.check`) tetap jalan di sana, dan `/api/arena/history` hanya dipanggil kalau flag `SHOW_UPCOMING_BOOKINGS`
  (kartu Booking Terdekat) dinyalakan. `progress.html` (legacy, `/progress?legacy=1`) tidak diubah.
- **Analisa workout v3 — "bacaan coach" tanpa wajib log + bahasa EN/ID konsisten — 2026-10-01.** Permintaan
  pemilik: coach membaca HR & pace langsung (kurang tidur? kurang nutrisi?) tanpa reminder "log semuanya".
  (1) `lib/workout-signals.js` `causes()`: skor pola sinyal per kandidat (`config.causes.signature`, mengganti tabel
  `causes.map`); dari performa saja maks "sedang" (`perf_medium_score`), log/check-in mendukung → naik satu tingkat,
  membantah → dikeluarkan. Contoh: HR lebih tinggi di pace yang sama → "kurang tidur/belum pulih" (sedang); pace jatuh
  di akhir sesi panjang → "kurang bahan bakar/karbohidrat"; HR terus naik di pace stabil → "kurang cairan".
  (2) `lib/workout-analysis.js` `sessionRead()`: intensitas (HR rata-rata ÷ HR maks; HR maks = tertinggi antara 220−umur
  dan HR maks tercatat; ambang `config.intensity`) & relevansi bahan bakar dari durasi (`config.fuel.relevant_min` 60).
  Hash input naik ke v3 → narasi AI lama yang berisi ajakan mencatat otomatis dibuat ulang.
  (3) Narasi (`lib/workout-narrative.js`): `readSentences()` (intensitas, tidur & pemulihan, bahan bakar), kalimat
  "belum ada data" netral (tanpa perintah), tips & `nextSession` tanpa ajakan log, prompt AI + `NAG_RE` menolak narasi
  yang menyuruh mencatat. **Tidak pernah** zat gizi mikro (zat besi/vitamin) — tetap ditolak `BANNED_RE`.
  (4) UI: detail → kartu "Bacaan coach" (tanpa tombol catat/check-in), check-in jadi `<details>` opsional, "Dari
  catatanmu" hanya faktor yang ADA datanya (form catat tidur/minum di halaman ini dihapus); Riwayat & log upload →
  chip intensitas + dugaan coach, chip "belum dicatat" & ajakan check-in dihapus (`woCard`: `reads`, `effort`,
  `needs_checkin` dihapus). (5) **i18n:** `js/i18n.js` kini menerapkan `data-en`/`data-id` di SEMUA halaman (dulu hanya
  /activity & /dashboard punya kode sendiri — dihapus); judul "Riwayat Upload" dll. ikut bahasa. **Ambang & bobot =
  DEFAULT AGENT, PERLU DIVALIDASI COACH 20FIT.**
- **Analisa workout v2 — sinyal heart rate & pace ala coach — 2026-10-01 (semua fase, default agent).** Audit &
  keputusan: PR terkait. (1) **Data:** `pace_data.splits` kini {km, sec, hr, elev} + `raw_data.readiness`; level data
  Basic/Detailed/Full (`WorkoutMetrics.dataLevel`) tampil di dialog upload, riwayat, detail + ajakan upload layar
  Splits/zona/pemulihan. (2) **Sinyal** (`lib/workout-signals.js`): efisiensi (m per detak) vs workout sejenis, cardiac
  drift paruh 1 vs 2, pace turun di akhir (HR tidak turun), HR maks sulit naik, % zona 4–5, kesiapan (resting HR/HRV/
  sleep score) — tiap sinyal `detected` true/false/insufficient_data + alasan data yang kurang. (3) **Penyebab:** tabel
  sinyal→kandidat di config, dicek silang dengan faktor log & check-in → keyakinan tinggi/sedang/rendah, yang dibantah
  data dikeluarkan; verdict `signals_explained|signals_unclear|better|normal|limited|safety`. (4) **Check-in** opsional
  4 pertanyaan (`POST /api/activity/workouts/:id/checkin`) muncul kalau ada sinyal tapi data pendukung kurang.
  (5) **Narasi** v2 + cek angka + tolak klaim zat gizi spesifik. (6) **Halaman detail:** grafik pace & HR per split
  (bagian drift/fade disorot), Apa yang terlihat, Kemungkinan penyebab, check-in, cek silang log, Kata Coach, latihan
  berikutnya, "Bagaimana analisa ini dibuat?". (7) **Insight lintas workout** kini berbasis sesi dengan tanda kelelahan.
  **BELUM AKTIF PENUH:** splits ber-HR & metrik kesiapan baru terbaca setelah **edge fn `my20fit-ai` di-deploy** (v55 live
  belum membaca splits) — TANYA PEMILIK; sebelum itu sebagian besar workout = Basic (sinyal B2/B3/B4/B5 =
  insufficient_data). Staging baru punya 2 workout tanpa splits, jadi contoh skenario a–f memakai DATA UJI berlabel.
  **TANYA PEMILIK / PERLU DIVALIDASI:** semua ambang `signals` & `causes` (mis. decoupling 5%, fade 8%, jam panas
  10–16); `pre_meal.long_gap_min` = 6 jam sedangkan contoh prompt memakai "> 5 jam"; `/api/weather` **mengembalikan suhu
  palsu** (dihitung dari jam) — tidak dipakai analisa, perlu diperbaiki/dihapus terpisah; contoh gambar per aplikasi
  belum ada (pakai teks petunjuk, tanpa logo merek). **Fase 4 integrasi Strava/Garmin/.FIT TIDAK dikerjakan:** butuh
  akses API resmi (pendaftaran aplikasi Strava; program developer Garmin dengan persetujuan — syarat BELUM TERVERIFIKASI).
- **Kartu Health Score bergaya kartu target kalori — 2026-10-01.** Judul tengah, **lingkaran progres** (SVG, penuh
  saat skor 100, warna per level), angka besar, "N poin lagi sampai lingkaran penuh", status; komponen jadi bar gaya
  makro (nama + skor/100, 2 kolom di desktop, 1 di HP). What You Need, tombol isi komponen, dan Chat Coach tetap.
  Hanya tampilan (`activity.html`), data dari `/api/activity/health-score` tidak berubah.
- **Kartu Upload progress dirapikan — 2026-10-01.** Hanya tampilan (`activity.html`): header ikon gradien + judul +
  badge "AI · maks 5", chip jenis yang dibaca (Workout/Tidur/Langkah/Berat; di HP jadi 4 kotak kecil), 3 tombol berikon
  (Kamera utama bergradien; ikon di atas label di HP, di samping label di desktop), tips analisa jadi baris info, dan
  baris "Terakhir:"/log hari ini dalam kotak lembut. ID & alur JS (`#upDrop`, `#upCam`, `#upFile`, `#upManual`, `#upProg`,
  `#upLast`, `.busy`/`.over`) tidak berubah.
- **Log upload hari ini + "Latihan berikutnya" + "Implement plan" — BARU 2026-10-01.** (1) Di bawah kartu Upload di
  /activity: daftar upload HARI INI (dari `/api/activity/history`, kini ada `created_at` + `next`): workout menampilkan
  headline analisa, latihan berikutnya, "Lihat selengkapnya" (→ `/activity/history/:id`) dan "Implement plan"; belum ada
  upload hari ini → satu baris "Terakhir:". (2) Riwayat & halaman detail menampilkan **latihan berikutnya** per workout
  — deterministik `woNarrative.nextSession()` (keamanan → istirahat & dokter, tidak bisa diterapkan; tidur kurang /
  beban tinggi → recovery `today.template_minutes.recovery`; performa turun → sesi santai durasi sama; lebih baik →
  durasi +`next.progress_pct`% (config, PERLU DIVALIDASI); selain itu → ulangi). (3) **Implement plan** =
  `POST /api/activity/workouts/:id/implement`: rekomendasi itu jadi `workout_plan` di Plan Hari Ini (dengan
  `from_workout`), bagian makan/tidur/minum yang sudah ada dipertahankan, lalu tampil otomatis di /activity
  (`/activity#today-plan`). Tanpa AI, tanpa migration. **TANYA PEMILIK:** `GET /api/activity/upload-history` kini tidak
  dipakai halaman web mana pun — hapus kalau app mobile juga tidak memakainya.
- **Plan & Rekomendasi Hari Ini + tombol "Generate plan" — BARU 2026-10-01.** Sebelumnya Today's Plan hanya terbentuk
  setelah upload screenshot. Sekarang `POST /api/activity/today-plan/generate` (aiUserLimiter) membuat plan tanpa upload.
  Isi kartu (analisa DETERMINISTIK `lib/today-brief.js`, dihitung ulang tiap GET `/api/activity/today-plan?lang=` jadi
  ikut berubah saat user mencatat tidur/minum/makan): (1) **Kondisi hari ini** — tidur semalam, makan & minum kemarin,
  beban 7 hari, tubuh (faktor sama persis dengan analisa workout, `woAnalysis.readiness()`), + progres hari ini;
  (2) **Naikkan Health Score hari ini** — per komponen: poin maksimal = (100 − skor) × bobot / total bobot (Health Score
  rata-rata 7 hari, jadi dijelaskan naiknya bertahap); komponen tanpa data = "belum dihitung"; (3) **Dari workout
  terakhir** (≤ 14 hari) — performa vs biasanya + faktor kurang/berlebih + tips + link analisa lengkap; (4) plan
  workout/makan/tidur/minum + Coach says dari AI (persona coach pilihan) dengan **target angka dikunci server**
  (kalori = rumus Calorie Tracker, minum 2 L & tidur 7,5 jam dari config). AI gagal → plan template sederhana
  (durasi di config `today.template_minutes`, PERLU DIVALIDASI coach). Disimpan di `my20fit_today_plans` (tanpa
  migration; generate menimpa plan hari itu). Catatan: `plan_date` memakai jam server (`ymd(new Date())`) seperti
  sebelumnya, sedangkan analisa memakai Asia/Jakarta — di luar scope, BELUM TERVERIFIKASI zona waktu server Railway.
- **Catat tidur di /activity — Health Score tidak ikut berubah — DIPERBAIKI 2026-10-01.** Data tidur sebenarnya
  tersimpan (`my20fit_sleep`, dicek di DB), tapi Health Score tidak di-fetch ulang setelah simpan, jadi baris "Sleep"
  tetap "+ Log sleep" sampai halaman dimuat ulang. Sama untuk gelas air. Sekarang simpan tidur & ubah air memanggil
  `loadHealthScore()`. **Dialog dirombak:** tanpa ketik manual — jam/menit pakai tombol ▲▼ (menit kelipatan 5),
  toggle **AM/PM**, pilihan cepat (9 PM–12 AM / 5–8 AM), stepper "berapa kali terbangun", ringkasan durasi; durasi
  > 14 jam memunculkan peringatan "cek AM/PM" (tidak memblokir). Isi awal = catatan hari itu → catatan terakhir →
  10 PM–6 AM. Kartu tidur menampilkan jam 12-jam. Penyimpanan (kolom & format) tidak berubah.
- **`/activity/plan` untuk plan dari chat coach — dirapikan 2026-10-01.** Halaman ini sudah membaca plan aktif
  (`GET /api/coach/plan`) + daftar (`/api/coach/plans`), jadi plan hasil chat (setelah fix di bawah) tampil di sini.
  Yang diperbaiki: reps teks dari coach ("20 menit", "AMRAP") tidak lagi ditempeli satuan ("20 menit rep") dan tidak
  menjepit nama latihan di layar HP; tombol "ganti" disembunyikan untuk plan `origin="chat"` (latihannya bukan dari
  library quiz, jadi swap selalu no-op) dan diganti "Ubah plan" → editor `/activity#edit-plan`; daftar kosong kini
  menjelaskan bahwa plan dari chat tersimpan otomatis di sini + tombol "Minta coach buatkan plan". **Catatan data:**
  permintaan plan yang dikirim SEBELUM fix (mis. 1 akun member, 30 Sep & 1 Okt pagi) tidak tersimpan dan balasan
  chat-nya tidak memuat JSON plan → tidak bisa dipulihkan; user perlu minta ulang ke coach.
- **Workout plan dari chat TIDAK PERNAH tersimpan — DIPERBAIKI 2026-10-01.** Plan dari chat disimpan dengan
  `source="chat"`, padahal CHECK `my20fit_workout_plan_src_chk` (migration 021) hanya mengizinkan `ai|rule|adjusted`
  → insert selalu ditolak, blok JSON dibuang, user melihat ruang kosong di balasan (dan plan aktif lama sudah lebih dulu
  dinonaktifkan). Dicek di DB 2026-10-01: tabel masih kosong — artinya SEMUA permintaan plan lewat chat sebelum fix hilang (lihat entri di atas). Sekarang: disimpan
  `source="ai"` + `plan.origin="chat"` (tanpa migration), plan baru disimpan DULU baru plan lama dinonaktifkan; balasan
  memuat `[[WORKOUT_PLAN]]{json}` → **tabel** di chat (hari · fokus · latihan set×rep · menit) + "Ubah di Activity";
  balasan yang terpotong di tengah JSON diganti catatan "minta ulang". **/activity:** kartu Workout Plan kini tabel per
  hari (centang selesai) + **editor** (`POST /api/coach/plan/adjust` op `edit`: nama plan, hari, fokus, durasi, latihan,
  set/rep/satuan, tambah/hapus; dinormalisasi ulang server lewat `coachValidateProgram`) + "Plan baru via coach" +
  "Semua plan". Batas token balasan chat tetap 2048 (edge fn) — plan sangat panjang bisa terpotong; prompt membatasi
  maks 6 latihan/hari.
- **Chat coach membalas "Terlalu banyak permintaan" — DIPERBAIKI 2026-09-30.** Penyebab: limiter umum `apiLimiter`
  50 request/10 menit **per IP** untuk SEMUA `/api/*` (satu putaran dashboard ±15 + activity ±8 + chat ±8 panggilan),
  apalagi member berbagi IP (Wi-Fi kantor/gym, NAT seluler); `/api/banners/*` juga terhitung dua kali. Sekarang:
  kunci = user login (hash token Bearer; tanpa login = IP) 400/10mnt (tanpa login 100), pagar per IP `ipGuard`
  3000/10mnt, dan `aiUserLimiter` 40 POST/10mnt per user untuk endpoint AI (chat, upload-analyze, scan,
  quick-analysis, plan). Di chat, gagal kirim tampil sebagai catatan + tombol "Coba lagi" (bukan bubble coach), 429
  menyebut perkiraan menit dari `Retry-After`. Angka limit = default agent, **PERLU DIVALIDASI** dengan trafik nyata.
- **Jadwal Arena keliru: instruktur kelas HYROX Youngstar (12-15) tercatat "Nando"** (semua jadwal Rabu 16:00, 3 Sep–29 Okt
  2026, tabel `arena_class_schedules` milik sistem Arena — bukan my.20fit, tidak boleh diubah dari sini). Pemilik
  mengonfirmasi Coach Nando TIDAK mengajar Youngstar (2026-09-30). **Perbaikan sebenarnya: tim Arena mengganti instruktur
  di sistem Arena/booking.** Sementara itu `lib/class-overrides.js` + `classInstructor()` di server.js membuat my.20fit tidak
  menampilkan/menghubungkan "Nando" ke Youngstar (profil coach, Book Coach, Upcoming Classes, filter coach Book Class,
  jadwal, rekomendasi AI Coach). **Hapus aturan itu setelah jadwal Arena diperbaiki.**

- **admin-v2 auth: sebagian #293 sudah ada.** admin-v2 kini baca master key dari `?key=` / `sessionStorage.admin_master_key` + pesan panduan "Buka dengan ?key=ADMIN_KEY atau login admin" per-seksi. Autentikasi: `Authorization: Bearer <JWT>` (login app/admin password) atau `?key=ADMIN_KEY`. **Flag `admin_v2` ON di produksi (2026-09-25).** Yang mungkin masih kurang dari branch `claude/admin-v2-fix-auth`: **banner login penuh** saat belum terautentikasi — kalau login UX dirasa kurang mulus, pertimbangkan merge branch itu.
- **`getAdminContext` menelan error infra jadi 401.** Kalau Supabase `getUser` timeout/mati (status 503 dari `getUserFromReq`), `getAdminContext` menangkap dan balas `null` → `requireAdmin` balas **401** (seolah sesi habis), bukan 503. Menyesatkan saat debug. (`server.js`.) Prioritas rendah.
- **Promo-banner masih pakai `target="_blank"`.** Di `dashboard.html` render `#promoBanner` (banner marketing admin, `cta_type==="external_link"`) — satu-satunya `_blank` tersisa. Terpisah dari tile navigation. **TANYA PEMILIK** apakah mau dijadikan same-tab.
- **`docs/CODEBASE-MAP.md` sebagian STALE.** Ditulis pada "TASK 0"; masih menyebut *email consent* di onboarding (sudah dihapus migration 013) dan referensi baris `server.js` lama (server.js kini lebih besar). Pakai untuk peta umum, tapi verifikasi ke kode untuk detail terkini.
- **Migration 013 (drop kolom email consent) — status eksekusi BELUM TERVERIFIKASI.** File `db/supabase-migration-013-drop-email-consent.sql` menghapus kolom consent; kode sudah tak memakainya. Harus dijalankan **manual** di Supabase. **TANYA PEMILIK** apakah sudah dijalankan di staging & produksi.

## 5. Keputusan penting & alasannya

- **Menu Products (2026-09-29, permintaan pemilik):** Shop/Arena/Sports Clinic/Talent kini pakai artwork 3D
  (`img/products/{shop,arena,clinic,talent}.png`, 128px transparan, dikecilkan dari `Menu Shop.png`,
  `Vector 20FIT Arena.png`, `Vector 20FIT Clinic.png`, `Vector Talent.svg`). **Workout & Body Scan
  disembunyikan** dari menu (belum siap) — item, ikon, `ECO.workout` dibuang; kini SEMUA item wajib punya
  artwork (fallback ikon garis dihapus). Halaman `/body-scan` tetap ada (QR Visbody + kartu /activity).
  Pasang lagi di `js/universal-nav.js` + `docs/PRODUCTS-MENU-SSO.md` saat siap. Semua item diuji klik
  (Chromium): item ber-`path` tetap in-app, sisanya langsung ke web tujuan, same-tab.
- **Tile Rewards di dashboard disembunyikan** (2026-09-29) lewat CMS: `my20fit_home_tiles.hidden=true`
  untuk `key='rewards'` (pola sama dgn `book-coach`). Tampilkan lagi dari admin-v2 → Home tiles. Halaman
  `/rewards` & widget Rewards di Customize tetap ada.
- **Tile Shop di grid layanan dashboard** (2026-09-29, permintaan pemilik): key `shop` → `https://shop.20fit.id`
  (same-tab), ikon 3D `img/tiles/shop.png` (dari `Menu Shop.png`), baris CMS `my20fit_home_tiles`
  `key='shop', sort_order=7` (slot Rewards) → bisa dinyala/matikan dari admin-v2 → Home tiles.
- **Pembayaran: Xendit via API FITCO/20FIT, bukan Xendit langsung.** Akun Xendit dipakai bersama app lain; webhook invoice account-global → callback "paid" selalu ke backend 20FIT, tak pernah ke my.20fit.id. Maka **tak ada webhook di sisi kita**; kredit lewat polling + `/api/scan/reconcile` (idempoten via RPC `my20fit_credit_scan`). Lihat CLAUDE.md "Konteks penting".
- **Email consent dihapus** (PR #291, migration 013): kirim langsung, model opt-out (unsubscribe + suppression + frequency cap).
- **Admin swap staging-first** (PR #290): staging pakai `admin-v2` via deteksi host; produksi digating flag `admin_v2` (reversible). **Flag di-ON-kan di produksi 2026-09-25** (permintaan pemilik, untuk editor foto coach) — admin lama tetap via `?legacy=1`.
- **Tile homepage → halaman sendiri** (PR #295): panel inline expand diganti navigasi per-route atas permintaan pemilik. Book Class/Recovery **reuse `/classes`** (hindari duplikasi), bukan halaman baru.
- **Membership tanpa data dummy**: placeholder "empty" sampai endpoint katalog asli tersedia (aturan: jangan karang data/endpoint).
- **Navigasi tile & 6 halaman WAJIB same-tab** (tanpa `target="_blank"`/`window.open`), termasuk link eksternal media.20fit.id & booking.20fit.id.
