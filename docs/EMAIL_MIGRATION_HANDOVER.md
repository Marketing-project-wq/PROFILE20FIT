# Handover — Sistem Email my.20fit.id (Resend + Consent + Campaign)

Migrasi email ke **Resend** + sistem **consent/unsubscribe** + **2 campaign**
(meal reminder & onboarding). Timezone pengiriman: **WIB** (fixed).

Branch: `claude/my20fit-racelab-banner-riiupl`. Alur deploy tetap: **staging dulu**.

## Status per fase
| Fase | Isi | Status |
|---|---|---|
| 1 | Migrasi Resend, cabut Mailtrap + nodemailer/SMTP | ✅ kode selesai |
| 2 | Consent + unsubscribe (tanpa login) + webhook Resend | ✅ kode selesai |
| 3 | Aturan frekuensi bucket (`comms.canSend`) | ✅ kode selesai |
| 4 | Meal reminder engine + template + varian | ✅ kode selesai |
| 5 | Onboarding drip 4-step + daily cron (decay/dormant) | ✅ kode selesai |
| 6 | Konsol admin + kill switch + monitoring otomatis | ✅ kode selesai |
| 7 | Handover (dokumen ini) | ✅ |

> **Semua butuh langkah manual kamu di bawah sebelum benar-benar jalan** (apply
> migrasi SQL, isi env Railway, verifikasi domain Resend, setup webhook & cron).

---

## 1. Bukti zero dead code
- `grep -i mailtrap` seluruh repo (kecuali lockfile) = **kosong**.
- `npx depcheck` → `unused deps: []`. `nodemailer` sudah dihapus dari
  `package.json` + `package-lock.json`.
- `node --check` OK untuk `server.js`, `lib/email.js`, `lib/comms.js`,
  `lib/campaigns.js`; inline JS `unsubscribe.html` & `admin-email.html` OK.
- Edge function `supabase/functions/my20fit-fasting-notify/` **dihapus** (logika
  pindah ke `server.js` → satu jalur email).

## 2. Env variable Railway (FINAL)

**Tambah / isi:**
```
EMAIL_RESEND_API=          # WAJIB. Server-side only, JANGAN prefix VITE_/publik.
MAIL_FROM=20FIT <no-reply@20fit.id>
MAIL_REPLY_TO=             # opsional (mis. cs@20fit.id)
EMAIL_ENVIRONMENT=production   # production | staging | development
EMAIL_TEST_WHITELIST=          # alamat internal (koma) utk non-production
CRON_SECRET=                   # secret acak, utk POST /api/cron/*
RESEND_WEBHOOK_SECRET=         # 'whsec_...' dari Resend, utk /api/webhooks/resend
```
> ✅ Nama env terverifikasi di Railway = **`EMAIL_RESEND_API`** (kode membaca ini;
> ada fallback ke `RESEND_API_KEY` bila suatu saat dipakai).

**Hapus (sudah tidak dibaca kode):**
```
SMTP_HOST  SMTP_PORT  SMTP_SECURE  SMTP_USER  SMTP_PASS
```
**Hapus di Supabase Edge secrets** (bukan Railway): `MAILTRAP_API_KEY`,
`MAILTRAP_API_URL` (edge function-nya sudah dihapus).

## 3. Migrasi SQL — apply manual di Supabase (SQL Editor), berurutan
```
db/supabase-migration-005-email-message-log.sql   → my20fit_message_log
db/supabase-migration-006-comms-consent.sql       → my20fit_user_comm_prefs,
                                                     my20fit_suppression_list,
                                                     my20fit_campaign_enrollments
db/supabase-migration-007-campaign-flags.sql       → my20fit_campaign_flags
```
Semua idempoten (`create table if not exists`), prefix `my20fit_`, RLS deny-public.
Tidak menyentuh tabel app lain.

## 4. Checklist manual kamu (di luar repo)
- [ ] **Resend:** verifikasi domain `20fit.id` + set **SPF / DKIM / DMARC** di DNS.
- [ ] Isi `EMAIL_RESEND_API` (+ `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, dst.) di Railway.
- [ ] **Webhook Resend** → arahkan ke `https://my.20fit.id/api/webhooks/resend`,
      aktifkan event: delivered, opened, clicked, bounced, complained. Salin
      signing secret (`whsec_...`) ke `RESEND_WEBHOOK_SECRET`.
- [ ] Apply 3 migrasi SQL di atas.
- [ ] Hapus `MAILTRAP_*` dari Supabase Edge secrets.
- [ ] **Setup cron** (Railway Cron / pg_cron / cron-job.org), header
      `x-cron-secret: <CRON_SECRET>`:
  - Tiap **5–10 menit** → `POST /api/cron/fasting-notify`
  - Tiap **15 menit** → `POST /api/cron/meal-reminders`
  - **1x/hari** (mis. 00:15 WIB) → `POST /api/cron/daily`
- [ ] (Frontend TODO) Tambah **checkbox consent** di onboarding/settings yang
      memanggil `POST /api/comms/consent` — tanpa ini `consent_marketing`/
      `consent_meal_reminder` tak pernah `true`, jadi campaign tak mengirim ke
      siapa pun (by design: opt-in).

## 5. Cara tes tanpa kirim ke member asli
Set `EMAIL_ENVIRONMENT=staging` (atau `development`) + `EMAIL_TEST_WHITELIST=
kamu@20fit.id`. Semua email ke alamat **di luar** whitelist hanya **dicatat**
(`status=skipped_env` di `my20fit_message_log`) dan **tidak dikirim**.

## 6. Cara tes tanpa nunggu jam 6 pagi
- **Fasting test:** `POST /api/cron/fasting-notify` body
  `{"action":"test","email":"kamu@20fit.id","kind":"open"}` (header cron-secret).
- **Meal reminder:** ubah sementara jam di `my20fit_user_comm_prefs`
  (`reminder_breakfast_time`) ke ~jam sekarang WIB, lalu panggil
  `POST /api/cron/meal-reminders`. Pastikan `consent_meal_reminder=true` &
  emailmu di whitelist. Idempotency: 1 kirim/window/hari.
- **Onboarding & maintenance:** `POST /api/cron/daily` (enroll + kirim step +
  decay/dormant + monitor). Semua idempoten.

## 7. Verifikasi role `marketing` TIDAK bisa lihat data kesehatan
- Endpoint email-admin (`/api/admin/email/*`) memang **tidak memuat** field
  kesehatan sama sekali (hanya metrik kirim, enrollment, suppression).
- RBAC: `getAdminContext` → `adminCanSeeHealth(ctx)` = **false** untuk role
  `marketing` (server.js). Endpoint profil yang memuat data kesehatan wajib
  memangkas field untuk role ini (mekanisme sudah ada sebelum task ini).
- Tes: assign 1 user role `marketing` (`POST /api/admin/roles`), buka
  `admin-email.html` — bisa lihat metrik; tapi endpoint data kesehatan tetap
  tertutup untuknya.

## 8. Placeholder `[[BUTUH DATA]]`
**Tidak ada yang tersisa** — semua copy email ditulis tanpa mengarang statistik/
testimoni/angka. Kalau nanti kamu mau menambah klaim berbasis data (mis. "X%
user turun berat"), isi manual dan jangan dikarang.

## 9. File dibuat / diubah / dihapus
**DIBUAT:**
- `lib/email.js` — modul kirim Resend (satu sumber).
- `lib/comms.js` — consent, suppression, unsubscribe token, gerbang frekuensi.
- `lib/campaigns.js` — engine meal reminder + onboarding + monitoring + template.
- `unsubscribe.html` — halaman preferensi/unsubscribe tanpa login.
- `admin-email.html` — konsol admin Email & Campaign.
- `db/supabase-migration-005/006/007-*.sql` — tabel baru.
- `docs/EMAIL_MIGRATION_HANDOVER.md` — dokumen ini.

**DIMODIFIKASI:**
- `server.js` — pakai `lib/email` (OTP, broadcast korporat), fasting cron,
  webhook, unsubscribe API, cron meal/daily, endpoint consent & admin, guard
  static (`lib` diblok), rawBody webhook, daftar env.
- `.env.example` — buang SMTP, tambah Resend/email/cron/webhook.
- `package.json` + `package-lock.json` — hapus `nodemailer`.

**DIHAPUS:**
- `supabase/functions/my20fit-fasting-notify/index.ts` (+ folder) — Mailtrap.

## 10. Catatan / batasan yang perlu kamu tahu
- **Deep-link scan** CTA email → `/calories.html#camera` (reuse behavior existing;
  auto-buka scanner). Untuk member yang **belum login**, halaman akan minta login
  dulu (perilaku app existing) — belum ada `?next=` balik ke scan.
- **Template meal/onboarding** dibangun sesuai spec (file "final"-mu belum masuk
  repo). Kalau kamu punya HTML final, tinggal ganti builder di `lib/campaigns.js`
  — struktur slot varian sudah disiapkan.
- **"Belum pernah scan"** dideteksi via `my20fit_scan_ledger` (konsumsi scan
  foto). Log makanan via teks manual (gratis) tak masuk hitungan — konfirmasi
  kalau definisimu beda.
- **Ambang monitoring** (complaint 0.1% / bounce 2% / unsub 0.5%) = standar
  industri; verifikasi ke dok Resend + kebijakan Gmail/Yahoo terbaru.
- **Reminder makan via email TIDAK dibangun >3x/hari** — sesuai batas. Kolom
  `channel` di `message_log` + `consent_meal_reminder` sudah menyiapkan pondasi
  channel push untuk masa depan (tanpa logic-nya sekarang).
