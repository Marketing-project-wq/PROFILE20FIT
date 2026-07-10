# Inventaris Secret — 20FIT Health Profile

Daftar semua kredensial yang dipakai aplikasi ini dan **di mana nilainya harus
disimpan**. File ini hanya berisi NAMA variabel — **nilai asli tidak boleh
pernah ditulis di repo ini**, di dokumen, atau di export API collection.

## ⚠️ PERINGATAN — Token yang Sudah Terlanjur Bocor

File `20fit-api-docs.html` (export dokumentasi API Bruno/OpenCollection) pernah
ter-commit ke repo ini dan masih ada di **riwayat git** branch `main` di GitHub.
File itu memuat token Bearer yang masih berlaku untuk:

- **FITCO Production** (`https://productionapi.fitco.id`)
- **FITCO Staging** (`https://stagingapi.fitco.id`)
- **20FIT Production** (`https://api.20fit.id`)
- **20FIT Local** (token dev)

Tindakan wajib:

1. **Rotasi/revoke semua token di atas** lewat tim dev Fitco/20FIT — anggap
   sudah bocor ke publik. Jangan simpan token lama sebagai secret; simpan
   token BARU hasil rotasi.
2. Setelah rotasi, bersihkan riwayat git (`git filter-repo` / BFG +
   force-push) — perlu koordinasi karena mengubah riwayat `main`.
3. Aktifkan **GitHub Secret Scanning + Push Protection** di
   Settings → Code security and analysis.

## Di Mana Menyimpan Secret

| Tempat | Untuk apa | Cara isi |
|---|---|---|
| **Railway → Variables** | Runtime server production/staging (`process.env.*`) | Railway dashboard → service → Variables |
| **GitHub Actions Secrets** | CI/CD workflow | Repo → Settings → Secrets and variables → Actions → *New repository secret* |
| **`.env` lokal** | Development di mesin sendiri | Copy dari `.env.example`, jangan commit |

## Daftar Secret

### Server runtime (Railway Variables / `.env`)

| Nama variabel | Isi | Sensitivitas |
|---|---|---|
| `SUPABASE_URL` | URL project Supabase | Publik (boleh terlihat) |
| `SUPABASE_ANON_KEY` | Supabase anon key | Publik (dilindungi RLS) |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key | **RAHASIA — server-only** |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` | Konfigurasi SMTP OTP | Sedang |
| `SMTP_PASS` | Password/app-password SMTP | **RAHASIA** |
| `MAIL_FROM` | Alamat pengirim email | Publik |
| `OTP_TTL_MINUTES` | Masa berlaku OTP | Publik |
| `DEV_MASTER_OTP` | OTP master untuk testing | **RAHASIA — kosongkan di produksi** |
| `ARENA_API_KEY` | API key 20FIT Arena Open API | **RAHASIA — server-only** |
| `ARENA_API_URL` | Base URL Arena API | Publik |
| `FITCO_PARTNER_TOKEN` | Token partner Fitco (shop order/Xendit) | **RAHASIA — server-only** |
| `FITCO_API_URL` / `FITCO_SSO_URL` / `FITCO_LOGIN_PATH` | Endpoint Fitco per environment | Publik |
| `PARTNER_API_KEY` | API key partner profile | **RAHASIA — server-only** |
| `WAQI_TOKEN` | Token API AQI (WAQI/AQICN) | **RAHASIA — server-only** |
| `ADMIN_KEY` | Key akses `/api/admin/stats` | **RAHASIA** |

### Token dari dokumentasi API (per environment)

Token Bearer Fitco/20FIT yang tadinya tertulis di file dokumentasi HTML
dipetakan ke secret berikut (isi dengan token **baru** hasil rotasi):

| Nama secret (GitHub Actions / Railway) | Menggantikan | Environment |
|---|---|---|
| `FITCO_API_TOKEN_STAGING` | Bearer token `stagingapi.fitco.id` | Staging |
| `FITCO_API_TOKEN_PRODUCTION` | Bearer token `productionapi.fitco.id` | Production |
| `TWENTYFIT_API_TOKEN_STAGING` | token `staging-api.20fit.id` | Staging |
| `TWENTYFIT_API_TOKEN_PRODUCTION` | token `api.20fit.id` | Production |

> Catatan: server saat ini membaca token Fitco lewat `FITCO_PARTNER_TOKEN`.
> Isi variabel itu di Railway dengan token sesuai environment service-nya
> (staging service → token staging, production service → token production).
> Secret `*_STAGING` / `*_PRODUCTION` di GitHub Actions dipakai bila CI/CD
> perlu memanggil API (mis. smoke test) — jangan pernah menuliskannya ke file.

## Aturan Pemakaian

1. Semua secret **server-only**: tidak boleh dikirim ke frontend, tidak boleh
   di-log, tidak boleh masuk pesan error yang tampil ke user.
2. Testing API (Bruno/Postman) → pakai environment variables lokal di aplikasi
   masing-masing; saat share/export dokumentasi, **hapus dulu nilai tokennya**
   (fitur "secret: true" di Bruno).
3. Rotasi berkala token Fitco/Arena (minimal tiap kali expiry, atau segera
   setelah ada indikasi bocor).
