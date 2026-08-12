# EMAIL-GO-LIVE-PLAN — rencana kirim ke user asli (FASE 6)

> **LAPORAN — JANGAN dieksekusi tanpa approval eksplisit pemilik.**
> Menyalakan pengiriman ke user asli = keputusan pemilik. Dokumen ini
> mengumpulkan semua yang perlu diputuskan + status pengaman yang sudah ada.

---

## 1. Konfirmasi email sesuai `EMAIL-LOGIC-SPEC.md` + hasil uji

**Scope dikonfirmasi:** meal reminder (breakfast/lunch/dinner) + onboarding drip
(+ pause check-in sebagai bagian siklus meal). Fasting & OTP = transaksional.

**Uji yang SUDAH dilakukan (offline, di sesi ini):**
- ✅ `node --check` lulus: `server.js`, `lib/email.js`, `lib/campaigns.js`.
- ✅ Render 16 template (meal ×3 window ×2 bahasa, onboarding ×4 step ×2 bahasa,
  pause ×2 bahasa): **0 placeholder `{{}}` bocor, 0 link `undefined`/kosong.**
- ✅ Bug pause check-in (link `href='undefined'`) diperbaiki & terverifikasi.

**Uji yang BELUM bisa (butuh Railway staging + Resend — Fase 5):**
- ⏸ Kirim ke `delivered@ / bounced@ / complained@resend.dev` → cek event masuk
  `my20fit_email_events` + auto-suppression. **Egress `resend.com` diblok di
  sandbox ini + tak ada API key** → hanya bisa dijalankan pemilik / sesi ber-akses.
- ⏸ Uji logic per-skenario (eligible→kirim, tidak-eligible→tak kirim, kondisi
  berhenti, unsubscribe, sekali-seumur-hidup) — butuh data user staging.

> **Prasyarat mutlak:** jalankan `db/supabase-migration-010-*.sql` dulu (kolom
> `lang`, `message_log.language`, tabel `email_events`). Tanpa ini: simpan consent
> gagal & event tak tercatat.

## 2. Jumlah penerima per jenis email (data live 2026-08-11)

| Email | Bucket | Penerima layak SEKARANG |
|---|---|---|
| Meal reminder ×3 | meal_reminder | **0** (consent_meal_reminder = 0) |
| Onboarding drip | marketing | **0** (consent_marketing = 0) |
| Pause check-in | meal_reminder | 0 (turunan meal reminder) |
| Fasting open/close | transaksional | = jumlah user `my20fit_fasting.notify_email=true` (cek DB) |
| OTP | transaksional | on-demand |

> **878 profil, tapi consent marketing = 0 & meal = 0.** Sistem **fail-closed**:
> tanpa opt-in, `total_eligible = 0`. **Aman (tak akan spam), tapi juga belum
> menjangkau siapa pun** lewat jalur non-transaksional sampai consent terkumpul.
> Sumber: `docs/EMAIL-READINESS.md`.

## 3. Analisis BACKLOG (risiko terbesar saat cron dinyalakan)

| Campaign | Risiko backlog | Kenapa |
|---|---|---|
| Meal reminder | **AMAN** | Berbasis window ±15 mnt — window lewat = tak ada susulan |
| Fasting | **AMAN** | Window ±14 mnt, sama |
| Decay/dormant/monitor | **AMAN** | Idempoten, tak kirim burst |
| Blast queue | **AMAN** | 50/tick, warm-up cap, auto-abort |
| **Onboarding drip** | **⚠️ RISIKO VOLUME** | Seleksi "semua `next_send_at ≤ now`" (limit 2000) tanpa gerbang jam. Kalau cron lama mati lalu dinyalakan, semua enrollment overdue kirim step berikutnya **sekaligus** |

Per-user tetap aman (cap marketing 1/hari, 3/minggu, cooldown 60 mnt, +1 step/run),
tapi **burst agregat** di first-enable = risiko reputasi domain.
Sumber: `docs/EMAIL-STATUS.md` §5. **Saat ini enrollment = 0**, jadi first-enable
tak akan burst SELAMA dinyalakan sebelum consent/enrollment menumpuk.

## 4. Mitigasi backlog (pilih sebelum menyalakan)
1. **Nyalakan cron onboarding SAAT enrollment masih kecil** (sekarang 0 → ideal).
2. Atau set **kill-switch flag** `onboarding_no_scan = false` dulu, nyalakan
   bertahap setelah domain warmed. (`my20fit_campaign_flags`, ada UI admin.)
3. Atau **turunkan limit batch** (`campaigns.js:runOnboarding` limit 2000) sementara.
4. Lewati jadwal yang sudah jauh terlewat kalau perlu (butuh perubahan kecil —
   minta kalau mau).

## 5. Rollout bertahap (usulan)
1. **Migration 010 + deploy staging.** Verify domain + SPF/DKIM/DMARC + open/click
   tracking + webhook + 4 cron (lihat `RESEND-SETUP-AUDIT.md`).
2. **Fase 5 whitelist test** (`EMAIL_ENVIRONMENT=staging`, `EMAIL_TEST_WHITELIST=
   zidni@20fit.id`): picu tiap email ke `*@resend.dev`, cek `email_events` +
   suppression + click link.
3. **Kumpulkan consent** (onboarding/Profil sudah punya toggle + pilihan bahasa).
4. **Transaksional/window dulu** (OTP, fasting, meal) — aman dari backlog.
5. **Onboarding drip** terakhir, kill-switch/limit, pantau bounce/complaint.
6. **Blast**: 10% → cek metrik (auto-abort aktif) → 50% → 100%.

## 6. Kill switch (SUDAH ADA)
- Per-campaign flag `my20fit_campaign_flags.enabled` — matikan **tanpa deploy**.
- UI admin: `/admin-email` → "Kill switch campaign".
- Blast: tombol Pause/Cancel per send.

## 7. Ambang otomatis (SUDAH ADA — `runMonitor`, daily cron)
Auto-set kill-switch `enabled=false` kalau (volume ≥50/7 hari):
- complaint **> 0.1%**, atau hard bounce **> 2%**, atau unsubscribe **> 0.5%**.
Blast punya auto-abort sendiri: bounce >5% / error >10% / **complaint apa pun** (min 20 vol).

---

## Yang MASIH menunggu pemilik
1. **Approval eksplisit** untuk mengirim ke user asli.
2. Jalankan **migration 010** + set env + verify domain/DNS + webhook + cron.
3. Jalankan **Fase 5** (uji `@resend.dev`) di staging — belum bisa dari sandbox.
4. Keputusan **mitigasi backlog onboarding** (§4) sebelum menyalakan daily cron.
5. Konfirmasi angka `[ASUMSI]` yang tersisa di `EMAIL-LOGIC-SPEC.md` §5 (10–11).
