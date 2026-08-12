# RESEND-SETUP-AUDIT — audit read-only setup pengiriman (FASE 2)

> Audit **read-only**. Tidak ada email dikirim, tidak ada config diubah.
> Legenda: ✅ terverifikasi dari kode · ⚠️ **hanya pemilik** bisa pastikan
> (runtime/DNS/dashboard — tak terjangkau dari sandbox ini) · ❌ masalah ·
> 🔴 **P0** (pemblokir deliverability).
>
> Sumber: `lib/email.js`, `server.js`, `.env.example`, `package.json`,
> `db/supabase-migration-005..009`, `origin/staging`. Tanggal: 2026-08-11.

---

## 2.1 Konfigurasi dasar

| Item | Temuan | Status |
|---|---|---|
| `EMAIL_RESEND_API` di **produksi** | Dibaca di `lib/email.js:23` (fallback `RESEND_API_KEY`). Ada di `.env.example`. Nilai aktual di Railway **tak terlihat dari sini**. | ⚠️ pemilik cek |
| `EMAIL_RESEND_API` di **staging** | Sama; **harus key BERBEDA dari prod** (aturan main #2). | ⚠️ 🔴 pemilik cek |
| Staging pakai key prod? | Tak bisa dilihat dari kode. **Kalau sama → BERHENTI & lapor** (aturan #2). | ⚠️ pemilik cek |
| Key valid? (uji read-only, mis. list domains) | **Tak bisa saya uji** — key tak ada di sandbox & dilarang pakai key prod. | ⚠️ pemilik cek |
| Validasi startup | `email.assertConfig()` dipanggil saat boot; log peringatan kalau `EMAIL_RESEND_API`/`MAIL_FROM` kosong (`server.js:~95`). | ✅ |
| SDK Resend | **TIDAK ADA SDK.** `package.json` tak punya `resend` maupun `svix`. Pengiriman = **HTTP manual** `fetch` ke `https://api.resend.com/emails` (`lib/email.js`). Verifikasi webhook = **HMAC manual** (`crypto`), bukan lib Svix. | ✅ (catatan) |
| HTTP call manual di luar `lib/email.js`? | Tidak. `lib/email.js` satu-satunya pemanggil Resend (aturan repo CLAUDE.md §2/§3). Grep tak menemukan `api.resend.com` di file lain. | ✅ |

**Catatan SDK:** HTTP manual bukan masalah fungsional (idempotency, retry backoff,
timeout 20s, header sudah benar). Tapi tanpa SDK, fitur baru Resend (batch,
scheduled_at, tags helper) harus ditulis manual. **Keputusan pemilik** apakah
mau migrasi ke SDK resmi (bukan blocker Fase 2).

---

## 2.2 Domain & autentikasi (penentu inbox vs spam)

| Item | Temuan | Status |
|---|---|---|
| Domain pengirim | Default `MAIL_FROM = "20FIT <no-reply@20fit.id>"` → **domain sendiri** (`20fit.id`), bukan `onboarding@resend.dev`. Bisa dioverride via env. | ✅ (default benar) |
| Domain **verified** di Resend | Dashboard Resend — **tak terjangkau dari kode/sandbox**. | ⚠️ 🔴 pemilik cek |
| **SPF / DKIM / DMARC** valid | Konfigurasi DNS — **tak terjangkau**. Kalau salah satu belum → email masuk spam, semua kerja lain sia-sia. | ⚠️ 🔴 pemilik cek |
| **Open tracking & Click tracking** aktif untuk domain | **Diatur di halaman Domains dashboard Resend.** Tak bisa dicek dari kode. **Tanpa ini, event `email.opened`/`email.clicked` tidak pernah dikirim → click rate mustahil.** | ⚠️ 🔴 pemilik cek |
| `from` pakai domain sendiri | Ya (lihat atas), selama env prod tak menimpanya dgn `resend.dev`. | ✅ / ⚠️ |

> 🔴 **Empat item di §2.2 adalah gerbang utama deliverability.** Tanpa domain
> verified + SPF/DKIM/DMARC + tracking aktif, sisanya tidak ada gunanya.

---

## 2.3 Webhook

| Item | Temuan | Status |
|---|---|---|
| Endpoint | `POST /api/webhooks/resend` (`server.js:295`). | ✅ |
| Terdaftar di Resend? | Dashboard — **tak terlihat dari sini**. Arahkan ke `https://my.20fit.id/api/webhooks/resend`. | ⚠️ pemilik cek |
| Verifikasi signature | **Ya** — Svix/standard-webhooks manual: `svix-id/timestamp/signature`, HMAC-SHA256 atas **raw body**, `timingSafeEqual`, multi-signature. Tolak tanpa verifikasi (`verifyResendSignature`, `server.js:268`). | ✅ |
| Raw body dipakai (bukan re-stringify) | **Ya** — `express.json({ verify })` menyimpan `req.rawBody` khusus `/api/webhooks/` (`server.js:191`). (Bug lama `req.body` undefined sudah diperbaiki #264.) | ✅ |
| Anti-replay | **Ya** — tolak timestamp > 5 menit. | ✅ |
| Balas 2xx cepat | Ya (update DB best-effort, selalu balas JSON; error → tetap 200 agar Resend tak retry-badai). | ✅ |
| `RESEND_WEBHOOK_SECRET` di env | Dibaca `server.js:92`; tanpa ini **semua webhook 401** → tak ada tracking + tak ada auto-suppression. | ⚠️ 🔴 pemilik cek |
| Event yang di-subscribe | **Harus di-set di dashboard.** Minimal butuh: `sent, delivered, delivery_delayed, bounced, complained, opened, clicked, failed, suppressed`. | ⚠️ pemilik cek |
| Event yang **ditangani kode** | ~~`delivered, opened, clicked, bounced, complained`~~ → **DIPERBAIKI Fase 3:** kini semua event dicatat ke `my20fit_email_events` + `email.failed`/`email.suppressed` ditangani; `email.sent`/`email.delivery_delayed` tercatat sebagai audit. | ✅ (Fase 3) |

**~~Catatan Fase 3~~ → SUDAH diperbaiki (lihat `docs/EMAIL-INFRA-FASE3.md`):**
`occurred_at` kini pakai `created_at` **dari payload**; **`clicked_url` disimpan**
di `my20fit_email_events`; retry di-dedup via `webhook_id` (svix-id). **Butuh
migration 010 dijalankan.**

---

## 2.4 Scheduler & queue

| Cron | Fungsi | Cadence disarankan | Status |
|---|---|---|---|
| `/api/cron/fasting-notify` | fasting open/close | 5–10 mnt | ⚠️ terjadwal? |
| `/api/cron/meal-reminders` | 3 window meal reminder | 15 mnt | ⚠️ terjadwal? |
| `/api/cron/daily` | onboarding + decay/dormant + monitor + automations | 1×/hari (mis. 00:15 WIB) | ⚠️ terjadwal? |
| `/api/cron/email-queue` | 1 batch blast (50) | ~1 mnt | ⚠️ terjadwal? |

| Item | Temuan | Status |
|---|---|---|
| Semua cron di-gate `CRON_SECRET` | Ya (header `x-cron-secret`). **Tanpa `CRON_SECRET` → semua cron 401 → tak ada email terjadwal pernah terkirim.** | ✅ kode / ⚠️ 🔴 env |
| Scheduler benar-benar jalan? Terakhir kapan? | **Runtime Railway/pg_cron — tak terlihat dari kode.** | ⚠️ pemilik cek |
| Failed jobs menumpuk? | Cek `my20fit_message_log` status `failed` & `my20fit_email_sends` `abort_reason`. **Butuh akses DB** (tak dari sandbox). | ⚠️ pemilik cek |
| Retry saat gagal | **Ya** — `lib/email.js`: 4 attempt, backoff 0.5/1.5/4s, **hanya** error sementara (429/5xx/network); 4xx permanen tak di-retry. | ✅ |
| Rate limit dihormati | Pengiriman campaign berbasis loop + batch (blast 50/tick); bukan burst tak terkendali. | ✅ (lihat risiko backlog onboarding di EMAIL-STATUS §5) |

---

## 2.5 Kepatuhan (compliance)

| Item | Temuan | Status |
|---|---|---|
| Link unsubscribe berfungsi | Halaman prefs `GET /api/unsub/prefs` + `POST /api/unsub/apply` (token opaque). One-click `POST /unsubscribe` (untuk header `List-Unsubscribe-Post`). | ✅ |
| Header one-click | `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click` ditambahkan untuk semua email non-transaksional (`lib/email.js`). Non-transaksional **tanpa** `unsubscribeUrl` → **ditolak** (tak dikirim). | ✅ |
| Status unsubscribe dihormati sebelum kirim | Ya — `comms.canSend` cek `consent_*` per bucket sebelum tiap kirim non-transaksional; blast cek ulang per penerima. | ✅ |
| `stop_all` → suppression | Ya — matikan consent marketing+meal, pause reminder, **tambah suppression `unsubscribe`**. | ✅ |
| Bounce keras → suppression otomatis | Ya — webhook `email.bounced` (permanent/hard) → `addSuppression(hard_bounce, permanent)`. | ✅ |
| Complaint (spam) → suppression otomatis | Ya — webhook `email.complained` → `addSuppression(spam_complaint, permanent)` langsung. | ✅ |
| Suppression dicek sebelum kirim | Ya untuk campaign/blast (`canSend`/blast re-check). **Transaksional (OTP/fasting/corp) TIDAK lewat `canSend`** → tak cek suppression (by design: transaksional selalu kirim). | ✅ / ⚠️ konfirmasi |
| Kill switch | Per-campaign flag `my20fit_campaign_flags` (migration 007) + monitor auto-stop. Blast: pause/cancel. | ✅ |

---

## Ringkasan Fase 2

**Kode = matang & compliance-aware.** Yang terverifikasi dari kode semuanya ✅:
webhook (signature+raw body+anti-replay), retry, idempotency, unsubscribe
one-click, auto-suppression bounce/complaint, kill switch, cron gating.

**Yang MENGHALANGI live — hanya pemilik bisa pastikan (⚠️ 🔴):**
1. `EMAIL_RESEND_API` ada di prod **dan** staging, **key berbeda** (aturan #2).
2. Domain `20fit.id` **verified** + **SPF/DKIM/DMARC** valid.
3. **Open + click tracking AKTIF** di domain Resend (kalau tidak → click rate mustahil).
4. `RESEND_WEBHOOK_SECRET` + `CRON_SECRET` ter-set; webhook terdaftar; 4 cron terjadwal.
5. Event webhook lengkap di-subscribe di dashboard.

**Fakta live (EMAIL-READINESS 2026-08-11):** `my20fit_message_log = 0` →
**belum ada email pernah terkirim**; consent = 0 → jalur marketing/meal
`total_eligible = 0` (fail-closed, aman).

**Rekomendasi pemilik (checklist singkat sebelum Fase 5 testing):**
- [ ] Set 4 env wajib di staging **&** prod (key Resend berbeda).
- [ ] Verify domain + SPF/DKIM/DMARC + aktifkan open/click tracking.
- [ ] Daftarkan webhook + subscribe 9 event; simpan `whsec_...`.
- [ ] Jadwalkan 4 cron; pastikan muncul di log eksekusi.

> **Tak ada perubahan kode di Fase 2.** Gap yang butuh koding (tabel
> `email_events`/`clicked_url`, `occurred_at` payload, handle `failed`/`suppressed`)
> masuk **Fase 3** — tunggu keputusan atas EMAIL-LOGIC-SPEC §5–§6.
