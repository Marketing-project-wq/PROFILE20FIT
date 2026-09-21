# STATUS — my.20fit.id

> **Pembaruan terakhir:** 2026-09-21 · **Commit staging:** `7637161` · **Production:** `7740dbf`
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

  - **TUGAS PEMILIK sebelum fitur ini utuh:** (1) jalankan migration 017 manual; (2) buat bucket
    Storage **`workout-uploads`** (PRIVAT); (3) deploy ulang edge fn `my20fit-ai` supaya aksi
    `plan` **dan `workout`** aktif — tanpa ini `/api/activity/scan` membalas 503 dengan pesan
    yang menyebut langkah ini; (4) Strava OAuth (Client ID/Secret di Railway + redirect URI di
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
- **Login Google web MATI — sebabnya di Google Cloud Console + Supabase, bukan di kode.** Gejala TERBARU (2026-09-17, screenshot pemilik): **`Error 400: redirect_uri_mismatch`**. Gejala lama (sebelum jalur GIS dibuang): `Access blocked: Authorisation error` · `no registered origin` · `Error 401: invalid_client`. **Panduan klik-per-klik untuk pemilik ada di `docs/GOOGLE_LOGIN_SETUP.md`.**
  - **Sebab terukur:** `server.js` memakai default hardcoded `26509397037-8d1s0c39hb31738fcl816b8jrv7fdt6i` yang komentarnya menyebut "Client ID web app 20FIT". Client ID yang **sama persis** terdaftar di repo app mobile sebagai reversed-client-id **iOS** (`20FIT_MOBILEAPP/ios/Runner/Info.plist` → `CFBundleURLTypes`/`CFBundleURLSchemes`). Client bertipe iOS **tidak punya kolom "Authorized JavaScript origins"**, jadi GIS di web selalu ditolak — menambah origin tidak akan menolong.
  - **Data:** `auth.identities` provider `google` = 287 (Jun 122, Jul 118, Ags 47, **Sep 0**); terakhir dibuat & terakhir login sama-sama **2026-08-18 05:22 UTC**. Provider `email` masih aktif harian. Tombol Google di web sendiri **baru masuk `main` hari ini** lewat `d041061` — sebelum itu tag SDK `accounts.google.com/gsi/client` tak pernah ada di `main` (`git log --full-history -S`). Dugaan (**BELUM TERVERIFIKASI**): 287 identitas itu dari app mobile, yang memang memakai `google_sign_in` v7 + `serverClientId`.
  - **Sudah diperbaiki di kode (PR #421):** default Client ID iOS dibuang (kosong → tombol disembunyikan); daftar audiens kosong pada `verifyGoogleIdToken` ditolak 503 supaya cek `aud` tak bisa dilewati; tombol cadangan yang memicu One Tap dihapus — kalau tombol resmi ditolak, One Tap ditolak juga, dan user diantar ke halaman error Google seolah app-nya rusak. Kini muncul pesan "Login Google sedang tidak tersedia" + arahan ke email/password.
  - **JALUR WEB SUDAH BUKAN GIS LAGI (diverifikasi 2026-09-17).** `login.html` memanggil `Auth.googleOAuth()` → `supabase.auth.signInWithOAuth({provider:"google", redirectTo:<origin>/login})`. Grep seluruh repo: **nol** referensi `accounts.google.com/gsi/client` / `google.accounts.id`, dan **nol** halaman web yang memanggil `Auth.googleSignIn` atau `Auth.googleClientId`. Konsekuensi penting: **`GOOGLE_CLIENT_ID` di Railway TIDAK memengaruhi tombol Google di web** — env itu hanya dipakai `verifyGoogleIdToken` untuk `POST /api/fitco-google-login`, yaitu jalur **app mobile**. Catatan lama di sini yang menyuruh mengisi Railway untuk memperbaiki web **KELIRU** dan sudah diganti.
  - **Sebab `redirect_uri_mismatch` (terukur dari kode):** alur Supabase OAuth memulangkan user ke `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback`. Kalau URL itu tidak terdaftar di **Authorized redirect URIs** OAuth client yang dipasang di Supabase, Google menolak dengan pesan tersebut. Client bertipe iOS tidak punya kolom itu sama sekali.
  - **TUGAS PEMILIK (tidak bisa dari repo — butuh akses dashboard):** (A) Google Cloud project `26509397037` → OAuth client tipe **Web application**, Authorized redirect URI = `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback`; (B) Supabase → Authentication → Providers → Google: enable + isi Client ID & Secret client Web (client iOS lama JANGAN dihapus, tambahkan dipisah koma), lalu URL Configuration → Redirect URLs diisi `https://my.20fit.id/login` + URL staging; (C) **opsional, hanya untuk app mobile** → Railway `GOOGLE_CLIENT_ID` = client Web, `GOOGLE_CLIENT_IDS` = client iOS. Langkah persisnya di `docs/GOOGLE_LOGIN_SETUP.md`.
  - **Angka pembanding sebelum perubahan (diukur 2026-09-17):** `auth.users` = **2569**, email dobel = **0**, user punya identitas Google = **286**, user >1 provider = **20**. Dipakai untuk membuktikan ganti Client ID tidak membuat akun kembar. Supabase mencocokkan identitas lewat `sub` Google (bukan Client ID) sehingga seharusnya aman — **BELUM TERVERIFIKASI** sampai ada user lama yang login ulang.
  - **Token callback tidak nyangkut di URL (diverifikasi di bundle):** `js/vendor-supabase.js` = supabase-js **2.108.2**, `flowType` default `implicit` dan klien kita tidak menimpanya, jadi token datang di **fragment** (`#access_token=...`) yang tidak pernah dikirim ke server; cabang implicit di bundle menutup dengan `window.location.hash = ""` sehingga fragment langsung dibersihkan. Pindah ke **PKCE** (token tak pernah muncul di URL) **belum** ditempuh karena callback photo/calorietracker/menu masih bergantung fragment implicit — **TANYA PEMILIK REPO** kalau mau, itu pekerjaan terpisah.
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
