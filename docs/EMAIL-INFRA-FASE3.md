# EMAIL-INFRA-FASE3 — perubahan infrastruktur pengiriman & tracking (FASE 3)

> Keputusan pemilik (2026-08-11): (3.1) **extend message_log + tabel event
> audit baru**; (3.3) **bilingual ID/EN per user**. Cabang: `claude/email-automation-resend`.

## Ringkasan: apa yang diubah & kenapa

### 1. `db/supabase-migration-010-email-events-and-lang.sql` (BARU) — ⚠️ WAJIB dijalankan
Idempoten & aman untuk DB berjalan. Tiga hal:
- **FIX bug #273:** `alter table my20fit_user_comm_prefs add column lang` (default
  `'id'`, check `id|en`). Kode bilingual #273 sudah **menulis** `prefs.lang` tapi
  kolomnya belum ada → **update consent GAGAL** sebelum migration ini. (Sistem
  belum live jadi belum berdampak ke user, tapi harus jalan sebelum go-live.)
- **`my20fit_message_log.language`** — catat bahasa saat kirim (buat enrich event & analitik).
- **`my20fit_email_events`** — tabel APPEND-ONLY, 1 baris per event webhook:
  `webhook_id` (dedup svix retry, unique), `resend_email_id`, `message_log_id`,
  `user_id`, `recipient_email`, `channel/campaign_id/template_id/meal_window`,
  `subject`, `language`, `event_type`, **`clicked_url`**, **`occurred_at`**
  (dari payload), **`raw_payload`** (jsonb), `created_at`. RLS deny-public.

> **`message_log` tetap "state per-kirim"** (analitik #267 tak berubah, tak ada
> regresi). `email_events` = riwayat granular untuk audit, debug, & analitik
> link-diklik (open/klik ganda tak lagi hilang).

### 2. `lib/email.js`
- `send()` menerima `o.language` → dicatat ke `my20fit_message_log.language`
  (best-effort, tak crash kalau migration belum jalan).

### 3. `lib/campaigns.js`
- Kirim `language: lang` ke 3 pemanggilan `email.send` (meal reminder,
  onboarding, pause check-in) → bahasa terekam per-kirim.
- **FIX bug tanda-tangan:** pause check-in ("masih membantu?") memanggil
  `onboardingHtml` dengan **signature lama** (`def, scanUrl, prefsUrl, prefsUrl`)
  padahal #273 mengubahnya jadi `(def, lang, urls)`. Akibatnya `urls.prefsUrl`
  = `undefined` → **CTA & link unsubscribe render `href='undefined'`**. Diperbaiki
  + dibuat **bilingual** (id/en) konsisten dengan email lain.

### 4. `server.js` — webhook `/api/webhooks/resend`
- **Tulis `my20fit_email_events`** untuk SETIAP event (idempoten via `webhook_id`
  = svix-id; retry tak menggandakan baris).
- **`clicked_url`** ditangkap dari `data.click.link` (defensif ke variasi field).
- **`occurred_at`** memakai `created_at` **dari payload** (bukan waktu terima) —
  untuk `message_log` timestamps **dan** `email_events`. (Sebelumnya pakai
  `new Date()` = waktu terima; event bisa datang tak berurutan.)
- **Event baru ditangani:** `email.failed` (→ status failed) & `email.suppressed`
  (→ status suppressed + pastikan alamat ter-suppress). `email.sent` /
  `email.delivery_delayed` kini tercatat di `email_events` (audit).
- Metadata event di-enrich dari `message_log` (1 query per event).

## Idempotency & urutan (sesuai syarat prompt Fase 3.2)
- **Verifikasi signature raw body** (Svix HMAC) sudah ada — tak diubah.
- **Duplikat event** → `upsert onConflict:webhook_id ignoreDuplicates` (tak duplikat).
- **Event tak berurutan** → `occurred_at` dari payload; baca/urutkan pakai itu.
- **Balas 2xx cepat** → tetap; error internal tetap balas 200 (Resend tak retry-badai).

## Yang SENGAJA tidak diubah (bukan defect)
- **Pengiriman individual, bukan `/emails/batch`.** Blast tetap kirim satu per
  satu (50/tick). Batch bersifat **atomik** (1 alamat invalid menggagalkan semua)
  & tak dukung `scheduled_at` — pendekatan individual lebih tahan-gagal & sudah
  rate-limited. Kalau mau migrasi ke batch, itu keputusan terpisah.
- **Transaksional (OTP/fasting/corp) tak lewat `canSend`/suppression** — by design
  (transaksional selalu kirim). Konfirmasi kalau mau OTP pun cek suppression.

## Verifikasi
- `node --check` lulus: `server.js`, `lib/email.js`, `lib/campaigns.js`.
- **Belum diuji live** (egress ke `resend.com` diblok proxy sandbox; tak ada API
  key). Uji end-to-end butuh Railway staging + `EMAIL_TEST_WHITELIST` (Fase 5).

## Yang HARUS dilakukan pemilik sebelum ini berfungsi
1. **Jalankan `db/supabase-migration-010-*.sql`** di Supabase SQL Editor.
2. Deploy branch `claude/email-automation-resend` ke staging.
3. Pastikan webhook Resend subscribe juga `email.failed` & `email.suppressed`
   (selain 7 event lain) — lihat `docs/RESEND-SETUP-AUDIT.md` §2.3.
