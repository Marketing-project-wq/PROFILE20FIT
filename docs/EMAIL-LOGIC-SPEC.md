# EMAIL-LOGIC-SPEC — logic email 20FIT (rekonstruksi APA ADANYA dari kode)

> ## ✅ Status konfirmasi pemilik (2026-08-11)
> - **Scope email = 2 campaign yang SUDAH ada:** **meal reminder** (breakfast /
>   lunch / dinner) **+ onboarding drip**. Ini "logic yang ditentukan sebelumnya".
> - **Di luar scope (TIDAK dibangun sekarang):** email kredit-habis, email
>   inactivity, welcome-saat-daftar, congrats-scan-pertama. (Tetap tersedia
>   sebagai **segmen blast manual**, bukan email otomatis.)
> - **Angka/ambang implementasi existing** (cadence 2/5/10/20, aktif ≤14 hari,
>   cooldown 60 hari, decay 3/7/14, dormant 10, monitor rates) → **dianggap
>   dikonfirmasi** karena pemilik meng-endorse implementasi meal+onboarding
>   apa adanya. **Koreksi kapan pun kalau ada angka yang salah** (lihat §5).
> - **Branch kerja:** `claude/email-automation-resend` (basis `origin/staging`).
>
> **FASE 1 — untuk dikonfirmasi pemilik sebelum lanjut ke Fase 2+.**
>
> Dokumen ini **bukan** logic baru. Ini rekonstruksi dari kode yang sudah ada
> di `origin/main` & `origin/staging` (hasil sesi-sesi sebelumnya). Setiap baris
> punya kolom **Sumber informasi**. Detail yang **saya simpulkan sendiri** (tak
> tertulis eksplisit di mana pun) ditandai **`[ASUMSI — perlu konfirmasi]`** dan
> dikumpulkan di §5.
>
> ⚠️ **Spec tertulis terpisah tidak ditemukan di repo.** Yang ada: (a) kode itu
> sendiri, dan (b) dokumen rekonstruksi sesi lalu (`docs/EMAIL-STATUS.md`,
> `docs/EMAIL-READINESS.md`). Kalau kamu masih menyimpan spec asli, kirim ulang
> supaya saya bisa cocokkan — lihat §4 (perbandingan) & §5 (asumsi).

Sumber kode yang dibaca (semua dari `origin/staging`, identik di `origin/main`):
`lib/campaigns.js`, `lib/email.js`, `lib/comms.js`, `lib/blast.js`,
`lib/segments.js`, `server.js`, `db/supabase-migration-005/007/008/009-*.sql`,
`admin-email.html`.

**Konvensi umum (berlaku untuk semua email):**
- Timezone **selalu WIB** (Asia/Jakarta). Sumber: `lib/comms.js` `WIB_OFFSET_MIN=420`.
- **Satu jalur kirim**: semua email lewat `lib/email.js` `send()` (Resend). Sumber: `lib/email.js` header.
- **Pengaman non-prod**: kalau `EMAIL_ENVIRONMENT != production`, email hanya benar-benar terkirim ke `EMAIL_TEST_WHITELIST`; selain itu dicatat `skipped_env`. Sumber: `lib/email.js:166-178`.
- **Gerbang anti-spam** (`comms.canSend`, hanya non-transaksional): consent per-bucket → suppression → cap → cooldown 60 menit → pause. Sumber: `lib/comms.js` `canSend()`.
- **Idempotency**: setiap kirim otomatis punya `idempotencyKey` bermakna + partial-unique index di `my20fit_message_log`. Sumber: `lib/email.js` `alreadySent()`, migration 005.

---

## 1. Email OTOMATIS (cron / event-driven) — inti "logic email"

### 1.1 OTP verifikasi email
| Aspek | Isi |
|---|---|
| Nama | OTP verifikasi email |
| Trigger | User minta verifikasi: `POST /api/send-otp` |
| Kondisi | User login; rate-limit 5×/10 menit/IP (`otpLimiter`) |
| Delay / jadwal | Segera. Kode berlaku 10 menit (`OTP_TTL_MINUTES`) |
| Frekuensi | On-demand (hapus token lama tiap request) |
| Penerima | User yang sedang verifikasi email-nya sendiri |
| Subject & isi | "Kode Verifikasi 20FIT" — kode 6 digit, Bahasa Indonesia |
| CTA | Tidak ada tombol; kode diketik di app |
| Kondisi berhenti | — (transaksional, selalu kirim) |
| Sumber informasi | `server.js:110 sendOtpEmail`, `server.js:1099 /api/send-otp` |

### 1.2 Fasting — eating window OPEN
| Aspek | Isi |
|---|---|
| Nama | Fasting: eating window open |
| Trigger | Cron `POST /api/cron/fasting-notify` (disarankan tiap 5–10 mnt) |
| Kondisi | Baris `my20fit_fasting` dgn `notify_email=true` & ada `start_time` |
| Delay / jadwal | Saat waktu **±14 menit** dari `start_time` (WIB) |
| Frekuensi | 1×/hari (guard `last_open_date` + idempotency `fasting_open:uid:date`) |
| Penerima | User yang menyalakan notifikasi fasting |
| Subject & isi | "🍽️ Your eating window is open" — **Bahasa Inggris**, tampilkan eating window |
| CTA | "Open my tracker" → `my.20fit.id/calories.html#fasting` |
| Kondisi berhenti | Sudah terkirim hari ini (`last_open_date == wibDate`) |
| Sumber informasi | `server.js:147 fastingHtml`, `server.js:200 fasting-notify` |

### 1.3 Fasting — eating window CLOSING
| Aspek | Isi |
|---|---|
| Nama | Fasting: eating window closing |
| Trigger | Cron sama (`/api/cron/fasting-notify`) |
| Kondisi | `notify_email=true`; `eat_hours < 24` |
| Delay / jadwal | **±14 menit** dari `start_time + eat_hours` (WIB) |
| Frekuensi | 1×/hari (guard `last_close_date` + idempotency `fasting_close:uid:date`) |
| Penerima | Sama seperti 1.2 |
| Subject & isi | "⏰ Your eating window is closing" — **Bahasa Inggris** |
| CTA | "Open my tracker" → `#fasting` |
| Kondisi berhenti | Sudah terkirim hari ini |
| Sumber informasi | `server.js:245`, kind `"close"` |

### 1.4 Meal reminder — breakfast / lunch / dinner
> Satu mekanisme, 3 window. Semua sama kecuali jam, rentang cek-log, & copy.

| Aspek | Isi |
|---|---|
| Nama | Meal reminder (breakfast, lunch, dinner) |
| Trigger | Cron `POST /api/cron/meal-reminders` (tiap 15 mnt) → `runMealReminders` |
| Kondisi | `consent_meal_reminder=true` **DAN** `reminder_paused_at` null **DAN** window ybs `enabled` **DAN** user **aktif ≤14 hari** (`my20fit_user_activity.last_active_at`) **DAN** belum log makan di rentang window itu **DAN** lulus `comms.canSend(meal_reminder)` |
| Delay / jadwal | **±15 menit** dari jam yang di-set user per window (WIB). Bukan catch-up — kalau window lewat, tidak dikirim susulan |
| Frekuensi | Maks **3×/hari** (1 per window). 1 per window per hari (idempotency `mealrem:window:uid:date`). Cap tambahan: 3/hari + cooldown 60 mnt di `canSend` |
| Penurunan otomatis | Kalau `reminder_consecutive_ignored ≥ 3` → hanya **1×/hari** (window lunch, atau window enabled pertama) |
| Rentang "sudah log" | breakfast `[04:00–10:59]`, lunch `[11:00–16:59]`, dinner `[17:00–23:59]` (`WINDOW_LOGRANGE`) |
| Penerima | User ber-consent meal reminder, window aktif, aktif ≤14 hari |
| Subject & isi | 3 varian rotasi per window (deterministik `dayOfYear % n`), Bahasa Indonesia, panel 3-langkah "Snap/Scan/Done" |
| CTA | "Scan makanan sekarang" → `/calories.html#camera` |
| Kondisi berhenti | Sudah log di window itu · tidak aktif 14 hari (skip) · paused · cap harian · cooldown 60 mnt · suppressed · tak consent |
| Sumber informasi | `lib/campaigns.js:134 runMealReminders`, `MEAL_VARIANTS`, `WINDOW_LOGRANGE`; `server.js:452` |

### 1.5 Meal reminder — pause check-in ("masih membantu?")
| Aspek | Isi |
|---|---|
| Nama | Meal reminder: pause check-in |
| Trigger | Cron `POST /api/cron/daily` → `runMealDecayAndDormant` |
| Kondisi | `reminder_consecutive_ignored ≥ 7` **DAN** belum pernah `reminder_paused_at` |
| Delay / jadwal | Saat maintenance harian, begitu ambang 7 tercapai |
| Frekuensi | Sekali (langsung set `reminder_paused_at`; idempotency `mealpause:uid:date`) |
| Penerima | Consenter meal reminder yang abaikan 7 hari beruntun |
| Subject & isi | "Reminder makan-nya masih membantu?" (reuse `onboardingHtml`) |
| CTA | "Atur jadwal reminder" → prefs |
| Kondisi berhenti | Sudah di-pause |
| Efek lanjutan (bukan email) | 14 hari setelah pause tanpa open/log → `consent_meal_reminder=false` (mati otomatis) |
| Sumber informasi | `lib/campaigns.js:449 runMealDecayAndDormant` |

### 1.6 Onboarding drip — step 1–4 (belum pernah scan)
| Aspek | Isi |
|---|---|
| Nama | Onboarding drip `onboarding_no_scan` (4 langkah) |
| Trigger enroll | Cron `/api/cron/daily` → `runOnboarding`. Enroll kalau: `onboarding_completed=true` **DAN** `consent_marketing=true` **DAN** umur akun **≥2 hari** **DAN** belum pernah scan **DAN** tak sedang enrolled / di luar cooldown 60 hari |
| Delay / jadwal | Step 1 = hari **2**, step 2 = hari **5**, step 3 = hari **10**, step 4 = hari **20** — **relatif tanggal signup**. Pengiriman saat `next_send_at ≤ now` |
| Frekuensi | Urutan 1×; cooldown **60 hari** sebelum boleh re-enroll |
| Penerima | User onboarded, ber-consent marketing, belum pernah scan |
| Subject & isi | S1 "Coba scan makanan pertamamu 🍽️" · S2 "Belum sempat coba scan?..." · S3 "Kenapa mencatat makan itu worth it" · S4 "Kami hormati pilihanmu" (email terakhir) — Bahasa Indonesia |
| CTA | Step 1–3 → scan (`/calories.html#camera`); Step 4 → prefs |
| Kondisi berhenti (cek tiap kirim) | **Sudah scan** → exit `converted` · consent_marketing dicabut → exit `unsubscribed` · tidak aktif 30 hari → exit `churned` · lulus `canSend(marketing)` (1/hari, 3/minggu, cooldown 60 mnt) · kill-switch flag `onboarding_no_scan` |
| Sumber informasi | `lib/campaigns.js:213 ONBOARDING_STEPS`, `:305 runOnboarding` |

### 1.7 Maintenance harian TANPA email (tapi mengubah state — penting)
| Proses | Efek | Sumber |
|---|---|---|
| Decay meal reminder | Tiap hari: kalau reminder kemarin tak dibuka & tak ada log → `reminder_consecutive_ignored += 1`; kalau dibuka/log → reset 0 | `runMealDecayAndDormant` |
| Auto-pause (7) | `consecutive_ignored ≥ 7` → pause + kirim email 1.5 | idem |
| Auto-off (14) | 14 hari paused tanpa open → `consent_meal_reminder=false` | idem |
| Dormant sweep | 10 email non-transaksional terakhir semua tak dibuka → suppression `dormant` + matikan consent marketing & meal | idem |
| Monitor auto-stop | Per campaign (vol ≥50/7hari): complaint >0.1% **atau** bounce >2% **atau** unsub >0.5% → set kill-switch flag `enabled=false` | `runMonitor` |

---

## 2. Email ADMIN / semi-otomatis (butuh aksi admin atau konfigurasi)

### 2.1 Blast / campaign admin (manual, 6 langkah)
| Aspek | Isi |
|---|---|
| Nama | Blast campaign (admin) |
| Trigger | Admin di `/admin/emails`: pilih **segmen** + **template** + subject → **kirim tes** (wajib) → **confirm** (ketik nama campaign) → status `queued` → cron `/api/cron/email-queue` proses **50/batch/tick** |
| Segmen (7 preset) | `onboarded_no_scan`, `scanned_then_stopped`, `active_7d`, `buyers_this_month`, `never_bought`, `credit_low`, `inactive_30d` |
| Template (4 + override DB) | `onboarding_welcome`, `breakfast_reminder`, `lunch_reminder`, `dinner_reminder` (atau HTML override di `my20fit_email_templates`) |
| Kelayakan | Snapshot penerima **dibekukan** saat draft (hanya yang eligible). **Dicek ulang per penerima saat kirim** (unsubscribe/suppression/consent di tengah dihormati) |
| Pengaman | Warm-up `daily_cap` · auto-abort (bounce >5% / error >10% / **complaint apa pun**, min 20 vol) · kill switch pause/cancel |
| Frekuensi | Satu kali per campaign |
| Kondisi berhenti | no_consent · suppressed · in_other_campaign · recent_24h (di eligibility); paused/cancelled |
| Sumber informasi | `lib/blast.js`, `lib/segments.js`, `admin-email.html`, `server.js:779-856` |

### 2.2 Blast — kirim tes
| Aspek | Isi |
|---|---|
| Trigger | `POST /api/admin/email/send/test` — **wajib** sebelum confirm |
| Isi | Subject di-prefix `[TES]`; transaksional (tetap env-gated) |
| Sumber | `lib/blast.js sendTest` |

### 2.3 Automations (segment→template, harian)
| Aspek | Isi |
|---|---|
| Nama | Email automations |
| Trigger | Cron `/api/cron/daily` → `runAutomations`, untuk tiap automation `enabled=true` |
| Perilaku | Hitung segmen → keluarkan yang sudah pernah di-queue → filter kelayakan → `daily_cap` (default 100). **Lahir sebagai `dry_run`** (hanya catat, tak kirim) sampai di-set live |
| Frekuensi | Sekali per member per automation |
| Status sekarang | **`[ASUMSI — perlu konfirmasi]` belum ada automation aktif** (readiness menunjukkan 0 aktivitas) |
| Sumber | `lib/blast.js:220 runAutomations`, migration 009 |

### 2.4 Corporate broadcast
| Aspek | Isi |
|---|---|
| Trigger | `POST /api/corp/message` — segera, per anggota roster |
| Isi | `corpMsgHtml`; transaksional |
| Sumber | `server.js:2380` (per `docs/EMAIL-STATUS.md` §1) `[ASUMSI — detail belum saya baca baris-per-baris]` |

---

## 3. Tabel spec vs kode berjalan

| Email | Ada di "spec"* | Terpasang di kode | Perilaku = spec? | Aktif di produksi? | Pernah terkirim? |
|---|---|---|---|---|---|
| OTP | ✅ (kode) | ✅ | n/a | ✅ code di main; butuh `EMAIL_RESEND_API` | `my20fit_message_log` = 0 → **belum** |
| Fasting open | ✅ | ✅ | n/a | butuh cron + key | 0 → belum |
| Fasting close | ✅ | ✅ | n/a | butuh cron + key | 0 → belum |
| Meal reminder ×3 | ✅ | ✅ | n/a | butuh cron + consent | consent=0 → belum |
| Meal pause check-in | ✅ | ✅ | n/a | butuh cron | belum |
| Onboarding drip ×4 | ✅ | ✅ | n/a | butuh cron + consent | enrollment=0 → belum |
| Blast admin | ✅ | ✅ | n/a | admin harus buat | belum |
| Automations | ✅ | ✅ (dry-run) | n/a | tak ada yang aktif | belum |
| Corporate broadcast | ✅ | ✅ | n/a | butuh key | belum |
| **Email "kredit habis/hampir habis"** | ❓ (contoh di prompt-mu) | ❌ hanya segmen `credit_low` utk blast manual | — | — | — |
| **Email "tidak aktif X hari"** | ❓ (contoh di prompt-mu) | ❌ hanya segmen `inactive_30d`/`scanned_then_stopped` | — | — | — |
| **Welcome saat daftar (langsung)** | ❓ | ❌ (sentuhan pertama = onboarding hari-2) | — | — | — |
| **"Scan pertama" (selamat)** | ❓ | ❌ (drip malah keluar saat user scan) | — | — | — |

\* "spec" = kode + dok sesi lalu (spec tertulis asli tak ada di repo — lihat header).

**Dari live data (`docs/EMAIL-READINESS.md`, 2026-08-11): 878 profil, consent
marketing = 0, consent meal = 0, `my20fit_message_log` = 0, enrollment = 0.**
Artinya: sistem **code-complete tapi belum pernah mengirim satu email pun** —
tergantung env/cron/consent yang hanya bisa dipastikan di Railway/Resend.

### Tiga kategori masalah (untuk keputusanmu)
- **Ada di (kemungkinan) spec-mu tapi TIDAK ada di kode:** email kredit-habis,
  email inactivity, welcome-langsung, congrats-first-scan. Di kode ini hanya
  ada sebagai **segmen blast manual**, bukan email otomatis dengan copy tetap.
  → **Kalau ini bagian dari logic yang kamu tentukan, belum dibangun.**
- **Ada di kode tapi mungkin tak kamu sebut:** decay/auto-pause/auto-off,
  dormant sweep, monitor auto-stop. Ini perilaku "housekeeping" yang mungkin
  dari sesi lalu — konfirmasi apakah nilai ambangnya benar (§5).
- **Ada di keduanya tapi angkanya perlu dipastikan:** cadence onboarding
  (hari 2/5/10/20), kriteria "aktif ≤14 hari" untuk meal reminder, cooldown
  re-enroll 60 hari. **Saya TIDAK memilih sendiri** — tolong konfirmasi (§5).

---

## 4. Kalau ini tidak cocok dengan spec-mu
Spec tertulis asli tidak ada di repo. Yang di atas 100% dari kode. Kalau kamu
masih simpan logic aslinya, kirim ulang → saya cocokkan baris-per-baris dan
tandai persis mana yang beda (mis. "delay step-2 harusnya 3 hari, kode 5 hari").
**Saya tidak akan mengubah cadence/kondisi apa pun tanpa instruksimu.**

---

## 5. Daftar `[ASUMSI]` — status per 2026-08-11

**Sudah dijawab pemilik:**
- (7) Email kredit-habis → **di luar scope** (tetap segmen blast manual).
- (8) Email inactivity → **di luar scope** (tetap segmen blast manual).
- (9) Welcome-saat-daftar & congrats-scan-pertama → **di luar scope** (tidak dibuat).

**Dianggap DIKONFIRMASI (endorse implementasi existing) — koreksi bila salah:**
1. **Cadence onboarding** hari **2 / 5 / 10 / 20** (relatif signup).
2. **Meal reminder** hanya untuk user **aktif ≤14 hari** (di-hardcode).
3. **Cooldown re-enroll onboarding = 60 hari**.
4. **Ambang decay** meal reminder: turun ke 1×/hari di **3** abai, pause di **7**,
   mati di **14 hari** paused.
5. **Dormant sweep**: **10** email berturut tak dibuka → suppress + matikan consent.
6. **Monitor auto-stop**: complaint **>0.1%**, bounce **>2%**, unsub **>0.5%**
   (min 50 kirim/7 hari).

**Masih terbuka (perlu keputusan sebelum/selama Fase 3):**
10. **Automations** — konfirmasi memang belum ada yang aktif (semua masih dry-run).
11. ~~**Bahasa email**~~ → **SUDAH bilingual ID/EN per user** sejak commit #273
    (`prefs.lang`). Meal reminder + onboarding + pause check-in kini pilih bahasa
    dari preferensi user. **CATATAN:** #273 menulis `prefs.lang` tapi belum ada
    kolomnya di DB → **diperbaiki di Fase 3** (migration 010). Fasting & OTP tetap
    single-language (di luar scope yang dikonfirmasi). Lihat `docs/EMAIL-INFRA-FASE3.md`.

---

## 6. Catatan teknis untuk fase berikutnya (bukan bagian logic, tapi jangan hilang)
Beberapa poin dari prompt-mu (Fase 3/5) **belum** sesuai kode saat ini:
- **Tabel `email_events`** yang kamu minta (append per-event, ada `clicked_url`,
  `occurred_at` = `created_at` dari payload) **belum ada**. Kode pakai
  `my20fit_message_log` (1 baris per kirim, di-update in-place). **`clicked_url`
  tidak disimpan**, dan `occurred_at` webhook memakai **waktu terima** kita
  (`new Date()`), **bukan** `created_at` payload. → perlu keputusan Fase 3.
- **Webhook** (`/api/webhooks/resend`) sudah verifikasi signature Svix (raw body,
  anti-replay 5 mnt) & menangani `delivered/opened/clicked/bounced/complained`
  + auto-suppression. **Belum** menangani eksplisit: `email.sent`,
  `email.delivery_delayed`, `email.failed`, `email.suppressed`.
- **Cek suppression sebelum kirim**: dilakukan di `comms.canSend` (jalur
  campaign) & di blast, **tapi `email.send()` sendiri tidak cek suppression** —
  jalur transaksional (OTP/fasting/corp) tidak melewati `canSend`. Sesuai desain
  (transaksional lewati aturan), tapi konfirmasikan apakah itu yang diinginkan.

---

### Ringkasan Fase 1
- **Ditemukan:** sistem email lengkap di `main`/`staging` (bukan di branch
  `github-workflow-secrets`), 9 jenis email otomatis/admin + housekeeping,
  ter-dokumentasi di kode & dok sesi lalu.
- **Diubah:** belum ada (dokumen ini saja; belum di-commit).
- **Perlu kamu tes/putuskan:** jawab §5 (11 poin) & konfirmasi §3 (email yang
  mungkin belum dibangun) + §6 (gap teknis Fase 3).
- **Pending:** semua fase berikut menunggu konfirmasi spec ini.
