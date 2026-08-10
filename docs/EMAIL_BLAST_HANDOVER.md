# Handover — Blast Email per-Segmen (admin)

Fitur kirim email campaign ke segmen member dari admin dashboard, di atas
pondasi Resend + consent. Keputusan scoping: **preset saja**, **template saja**,
**marketing bisa kirim langsung** (tetap lewat alur wajib), **warm-up bertahap**.

## Yang dibangun (Fase 1–4)
| Fase | Isi |
|---|---|
| 1 | Segment engine — 7 preset + preview (segmen↔kelayakan, filter tak bisa di-bypass, tanpa data kesehatan) |
| 2 | Send queue — batching, re-check kelayakan per penerima, idempotency, kill switch, auto-abort |
| 3 | Admin UI 6-langkah (`admin-email.html`) — preview → tes wajib → ketik nama → antrian + monitoring |
| 4 | Automation — trigger harian, WAJIB mulai dry-run |

## 1. Bukti zero dead code
- `npx depcheck` → `unused deps: []`.
- 5 modul (`lib/email`, `comms`, `campaigns`, `segments`, `blast`) semua di-require & dipakai.
- `node --check` server + semua modul OK; inline JS `admin-email.html` OK.
- Pengiriman TETAP satu jalur (`lib/email.js`) — blast tidak membuat jalur kirim kedua.

## 2. Cara tes SELURUH alur tanpa kirim ke member asli
1. Set `EMAIL_ENVIRONMENT=staging` + `EMAIL_TEST_WHITELIST=kamu@20fit.id` di env.
   → semua kirim ke non-whitelist di-`skip` (dicatat, tak keluar).
2. Beri consent ke akun tes: buka **Profil → Preferensi Email**, centang marketing.
3. Buka `admin-email.html` → wizard blast: pilih segmen → preview → template →
   **Kirim tes** (masuk ke inbox whitelist-mu) → ketik nama campaign → KIRIM.
4. Trigger antrian manual: `POST /api/cron/email-queue` (header `x-cron-secret`).
5. Automation: buat automation (lahir dry-run) → `POST /api/cron/daily` →
   cek `GET /api/admin/email/automations/:id/dryrun` (siapa yang AKAN dikirim,
   tanpa benar-benar kirim).

## 3. Verifikasi filter consent TIDAK bisa di-bypass
- Preview & pengiriman memanggil `segments.applyEligibility(...)` / re-check
  `comms` — **tidak ada parameter** `override`/`force`/`send_all` di endpoint mana pun.
- Coba buktikan: kirim `POST /api/admin/email/segment/preview` atau
  `/send/create` dengan body tambahan `{"force":true,"skip_eligibility":true}` →
  **diabaikan**; `total_eligible` tetap hasil filter. Recipient yang dibekukan
  hanya yang `eligible`. Saat kirim, tiap penerima **dicek ulang** (consent +
  suppression) — unsubscribe di tengah pengiriman langsung dihormati (`skipped`).
- Dengan consent = 0, semua segmen `total_eligible = 0` (fail-closed).

## 4. Verifikasi role `marketing` tak lihat data kesehatan
- Endpoint blast (`/api/admin/email/*`) tidak pernah menyertakan field kesehatan.
- Preview penerima hanya: `full_name, email, signup_at, source` (dari
  `my20fit_signup_attribution`). Tak ada berat/BMI/MCU/scan value.
- Server-side: `adminCanSeeHealth(ctx)` = false untuk role marketing (endpoint
  profil yang memuat kesehatan memangkas field; ditegakkan sebelum task ini).

## 5. Menghentikan pengiriman di tengah jalan
- UI monitoring: tombol **Pause** (sisanya tetap antri) & **Cancel** (sisa
  `pending` → `cancelled`, tak akan dikirim).
- API: `POST /api/admin/email/send/pause|resume|cancel {send_id}`.
- Batch berikutnya membaca status; `paused`/`cancelled` menghentikan seketika.
- **Auto-abort** otomatis kalau (min 20 kirim): spam complaint > 0, bounce > 5%,
  atau error > 10% → status `failed`, sisa `cancelled`, `abort_reason` dicatat.

## 6. Cron yang perlu di-setup (header `x-cron-secret: <CRON_SECRET>`)
- **Tiap ~1 menit** → `POST /api/cron/email-queue` (proses 1 batch = jeda antar batch).
- **1x/hari** → `POST /api/cron/daily` (sudah termasuk automation dry-run/live).
- Migrasi DB **008 & 009 sudah kuapply** ke Supabase produksi.

## 7. File dibuat / diubah
**DIBUAT:** `lib/segments.js`, `lib/blast.js`, `db/supabase-migration-008-email-blast-queue.sql`, `db/supabase-migration-009-email-automations.sql`, `docs/EMAIL_BLAST_HANDOVER.md`.
**DIMODIFIKASI:** `server.js` (endpoint segmen/blast/automation + cron), `admin-email.html` (wizard 6-langkah), `onboarding.html` + `profile.html` (consent capture).

## 8. Keputusan yang kuambil sendiri
- Blast = bucket **marketing** (butuh `consent_marketing`) apa pun template-nya.
- Tes hanya boleh ke alamat **@20fit.id** (pengaman, bukan ke member).
- Batch default **50 / 60 detik**; warm-up via `daily_cap` per send/automation.
- Automation LIVE juga lewat **queue cron** yang sama (dapat auto-abort & kill switch).
- Preset-only & template-only (sesuai keputusanmu) — custom builder & tulis-bebas
  belum dibangun; gampang ditambah nanti.

## ⚠️ Belum berguna sampai
- **Consent terkumpul** (member opt-in via onboarding/Profil) — sekarang 0.
- **Domain Resend terverifikasi** + cron di-setup.
