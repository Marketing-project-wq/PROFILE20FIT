# EMAIL-STATUS — verifikasi email live & sesuai logic (TASK 4.1)

> Audit **read-only dari KODE** (`lib/email.js`, `comms.js`, `campaigns.js`,
> `blast.js`, `segments.js`, `server.js`, `.env.example`). Belum ada email
> dikirim. Bagian yang butuh cek **runtime/DNS** (cron benar jalan? domain
> verified? failed jobs?) ditandai ⚠️ — hanya pemilik yang bisa pastikan.

## 1. Inventaris email

| Email | Trigger | Delay/Jadwal | Template | Terpasang di kode? | Aktif produksi? | Bucket/consent |
|---|---|---|---|---|---|---|
| OTP verifikasi | `POST /api/send-otp` (server.js:958) | Segera, TTL 10m, rate-limit 5/10m/IP | inline (server.js:111) | ✅ Live | ⚠️ butuh `EMAIL_RESEND_API` | transaksional |
| Fasting — window OPEN | cron `/api/cron/fasting-notify` (server.js:200) | ±14m dari `start_time` WIB, 1×/hari | `fastingHtml("open")` (147) | ✅ | ⚠️ butuh cron + key | transaksional |
| Fasting — window CLOSING | cron sama (server.js:245) | ±14m dari start+eat_hours, 1×/hari | `fastingHtml("close")` | ✅ | ⚠️ cron | transaksional |
| Meal reminder — breakfast/lunch/dinner | cron `/api/cron/meal-reminders` → `runMealReminders` (campaigns.js:134) | **±15m dari jam reminder user** (window, bukan catch-up) | `mealReminderHtml` (72), 3 variasi | ✅ | ⚠️ cron | meal_reminder (butuh `consent_meal_reminder`) |
| Meal reminder — pause check-in | daily cron → `runMealDecayAndDormant` (campaigns.js:449) | saat `consecutive_ignored>=7`, 1× | `onboardingHtml` reuse | ✅ | ⚠️ cron | meal_reminder |
| Onboarding drip — step 1–4 (hari 2/5/10/20) | daily cron → `runOnboarding` (campaigns.js:305) | `next_send_at<=now` (**"semua yg due"**) | `onboardingHtml(ONBOARDING_STEPS)` (213) | ✅ | ⚠️ cron | **marketing** (butuh `consent_marketing`) |
| Blast/campaign admin | queue cron `/api/cron/email-queue` → `blast.processBatch` (blast.js:131) | batch 50/tick, warm-up `daily_cap` | `renderTemplate` 4 template (blast.js:13) | ✅ | ⚠️ cron + admin buat send | marketing (re-check per penerima) |
| Blast — TEST | `POST /api/admin/email/send/test` (server.js:658) | segera, manual, wajib sebelum confirm | `renderTemplate` `[TES]` | ✅ | manual | transaksional (tetap env-gated) |
| Corporate broadcast | `POST /api/corp/message` (server.js:2380) | segera per anggota roster | `corpMsgHtml` | ✅ | ✅ (butuh Resend) | transaksional |
| Automations | daily cron → `blast.runAutomations` (blast.js:220) | **lahir dry-run**; live → queue cron | reuse blast template | ✅ | ⚠️ cron; default dry-run | marketing |

**Dead code:** tidak ada. Semua 10 `email.send(...)` terjangkau route/cron live. `runMonitor`/dormant-sweep sengaja tak kirim email (hanya set flag/consent).

## 2. Cron yang WAJIB dijadwalkan (header `x-cron-secret: <CRON_SECRET>`)
| Endpoint | Isi | Cadence |
|---|---|---|
| `/api/cron/fasting-notify` (server.js:200) | notifikasi fasting open/close | tiap 5–10 mnt |
| `/api/cron/meal-reminders` (server.js:452) | 3 window meal reminder | tiap 15 mnt |
| `/api/cron/daily` (server.js:467) | onboarding + decay/dormant + monitor + automations | 1×/hari (mis. 00:15 WIB) |
| `/api/cron/email-queue` (server.js:715) | 1 batch blast | tiap ~1 mnt |

> ⚠️ **Tanpa `CRON_SECRET` di env, SEMUA cron balas 401 → tak ada email terjadwal yang pernah terkirim.** Ini kemungkinan besar kondisi sekarang.

## 3. Env yang menggerbang email (di Railway)
| Env | Efek kalau kosong |
|---|---|
| `EMAIL_RESEND_API` | Tak ada email keluar (send `failed`, tak throw). **Wajib.** |
| `MAIL_FROM` | Ada default `20FIT <no-reply@20fit.id>` |
| `RESEND_WEBHOOK_SECRET` | Webhook Resend ditolak 401 → **tak ada tracking delivered/open/click/bounce + auto-suppression**. Wajib utk TASK 2 analytics. |
| `CRON_SECRET` | Semua cron 401 (lihat §2). **Wajib.** |
| `EMAIL_ENVIRONMENT` | `production` = kirim ke semua; selain itu **whitelist-only** |
| `EMAIL_TEST_WHITELIST` | daftar alamat yg boleh terima saat non-prod |

## 4. Cara tes AMAN (tanpa kena member asli) — TASK 4.2
Mekanisme di `lib/email.js:166-178`: kalau `EMAIL_ENVIRONMENT != production` dan penerima **bukan** di whitelist → send **diblok**, dicatat `status:"skipped_env"` di `my20fit_message_log`, tak keluar.

Langkah: set `EMAIL_ENVIRONMENT=staging` + `EMAIL_TEST_WHITELIST=kamu@20fit.id` di Railway staging → beri consent ke akun tes (Profil → Preferensi Email) → picu cron/endpoint terkait → cek inbox whitelist + baris `my20fit_message_log`.
> ⚠️ **Belum bisa saya tes tuntas dari sini** — sandbox build tak punya akses jaringan ke Resend/Supabase. Butuh dijalankan di staging Railway (env di atas) oleh pemilik / lewat sesi dengan akses.

## 5. ⚠️ Risiko BACKLOG kalau cron baru dinyalakan (TASK 4.3 — penting)
- **Meal reminder & fasting: AMAN.** Berbasis **window waktu** (±15/±14 mnt) — cron yang tadinya mati TIDAK mengirim susulan; window sudah lewat.
- **Decay/dormant & blast queue: AMAN.** Idempoten + throttle batch.
- **Onboarding drip: RISIKO VOLUME.** Seleksinya **"semua yang `next_send_at<=now`"** (campaigns.js:349, limit 2000) tanpa gerbang jam. Kalau daily cron lama mati lalu dinyalakan, **satu batch besar** (semua enrollment overdue, hingga ~2000) kirim step berikutnya sekaligus. Per-user tetap aman (cap marketing 1/hari, 3/minggu, cooldown 60m di comms.js:166; +1 step/run), tapi **burst agregat** = risiko reputasi domain di first-enable.
  - **Mitigasi:** nyalakan cron onboarding hanya setelah domain warmed & consent diketahui; atau sementara set kill-switch flag `onboarding_no_scan`; atau turunkan limit batch.

## 6. Checklist yang HANYA pemilik bisa pastikan (runtime/DNS)
- [ ] `EMAIL_RESEND_API`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, `EMAIL_ENVIRONMENT`, `EMAIL_TEST_WHITELIST` ter-set di Railway (staging & prod).
- [ ] Domain pengirim **verified di Resend** + **SPF, DKIM, DMARC valid** (kalau belum → email masuk spam). ⚠️ tak bisa dicek dari kode.
- [ ] Cron scheduler (Railway Cron / pg_cron) benar memanggil ke-4 endpoint + terlihat di log eksekusi terakhir.
- [ ] Webhook Resend diarahkan ke `/api/webhooks/resend` dengan signing secret cocok. (Baru berfungsi setelah fix T-1 di #264 — sebelumnya webhook selalu 401 karena `req.body` undefined.)
- [ ] Tidak ada failed job menumpuk (cek `my20fit_email_sends` status `failed`/`abort_reason`).
- [ ] **Consent terkumpul** — campaign marketing/meal butuh opt-in; sekarang ~0 (butuh user isi via onboarding/Profil). Tanpa consent, `total_eligible=0` (fail-closed).

## 7. Rekomендasi rollout (sebelum kirim ke semua — TUNGGU APPROVAL)
1. Set env + verify domain (SPF/DKIM/DMARC) + pasang webhook. Deploy #264 (fix T-1) ke prod dulu (webhook & consent baru berfungsi setelahnya).
2. Tes whitelist tiap jenis email (screenshot desktop+mobile), pastikan personalisasi & link OK.
3. Nyalakan cron transaksional/window dulu (fasting, meal — aman dari backlog).
4. Onboarding drip **paling akhir**, bertahap (kill-switch/limit), pantau bounce/complaint via webhook.
5. Blast: kirim 10% dulu → cek metrik (auto-abort sudah ada) → sisanya. Kill switch per campaign tersedia.

---

## Kesimpulan jujur
Sistem email **code-complete & compliance-aware**, TAPI **belum tentu live** — bergantung pada env/DNS/cron/consent yang **hanya bisa dipastikan pemilik di Railway/Resend/DNS**, dan tak bisa saya tes tuntas dari sandbox ini. Satu bug kode yang menghalangi (T-1: webhook/consent `req.body` undefined) **sudah diperbaiki** (#264). Prioritas berikutnya bersifat **operasional (setup)**, bukan koding. Untuk analitik email penuh (open/click per campaign, timeline per user) ada gap kode yang sedang dikerjakan terpisah (lihat rencana TASK 2).
