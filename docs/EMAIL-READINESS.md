# EMAIL-READINESS — laporan sebelum kirim massal (TASK 4.3)

> Data LIVE dari Supabase (`cpvzwqptzcxnwzfzgrmt`), diambil 2026-08-11.
> **Belum ada email dikirim.** Ini laporan status untuk keputusan kirim —
> keputusan mass-send tetap **menunggu approval eksplisit pemilik**.

## Angka kunci hari ini
| Metrik | Nilai | Arti |
|---|---|---|
| Total profil user | **878** | semua punya email |
| Profil dengan email | **878 / 878** | 100% |
| Consent **marketing** (opt-in) | **0** | belum ada yang opt-in |
| Consent **meal reminder** (opt-in) | **0** | belum ada yang opt-in |
| Baris `my20fit_user_comm_prefs` | 2 | hampir semua user belum punya baris preferensi |
| Suppression list | 0 | belum ada unsubscribe/bounce |
| `my20fit_message_log` | 0 | belum ada email pernah terkirim |
| Enrollment onboarding | 0 | campaign onboarding belum jalan |
| Kill-switch flags | `meal_reminder=ON`, `onboarding_no_scan=ON` | default aktif |

## Kesimpulan (PENTING)
**Kalau blast marketing/meal dijalankan HARI INI, jumlah penerima layak = 0.**
Sistem consent bersifat **fail-closed**: campaign non-transaksional hanya kirim
ke user yang `consent_marketing`/`consent_meal_reminder = true`. Sekarang 0 →
`total_eligible = 0` untuk semua segmen consent-gated. Ini **aman** (tidak akan
spam), tapi juga berarti **belum bisa menjangkau siapa pun** lewat jalur
marketing sampai consent terkumpul.

Yang **tidak** butuh consent (transaksional) tetap bisa: OTP, konfirmasi email,
invoice, broadcast corporate — jalur ini aman dikirim (masih tergantung env
`EMAIL_RESEND_API` + domain verified).

## Kenapa consent 0 & cara menaikkannya
- Halaman onboarding & Profil sudah punya toggle consent (i18n keys sudah ada
  sejak fix U-1 #265). User tinggal isi. Baris prefs baru lahir saat user
  set preferensi / lewat onboarding.
- Opsi menaikkan consent (perlu keputusan pemilik, bukan koding):
  1. Dorong user isi preferensi email di onboarding/Profil (paling bersih).
  2. Untuk 878 user lama: **jangan** blast tanpa dasar consent — untuk audiens
     lama yang belum opt-in, kirim hanya jalur transaksional atau minta izin
     ulang (re-permission) sesuai kebijakan & hukum yang berlaku.

## Prasyarat operasional sebelum mass-send (dari pemilik)
Belum bisa diverifikasi dari sisi kode — lihat `docs/EMAIL-STATUS.md` §6:
- [ ] `EMAIL_RESEND_API`, `CRON_SECRET`, `RESEND_WEBHOOK_SECRET`, `MAIL_FROM`
      ter-set di Railway (staging & prod).
- [ ] Domain pengirim **verified di Resend** + SPF/DKIM/DMARC valid.
- [ ] 4 cron terjadwal (fasting, meal, daily, email-queue).
- [ ] Webhook Resend → `/api/webhooks/resend` (jalan setelah fix T-1 #264).

## Rencana kirim bertahap (TUNGGU APPROVAL — JANGAN dieksekusi otomatis)
1. Set env + verify domain + pasang webhook (pemilik).
2. **TASK 4.2 — tes whitelist:** `EMAIL_ENVIRONMENT=staging` +
   `EMAIL_TEST_WHITELIST=zidni@20fit.id`, beri consent ke akun tes, picu
   tiap jenis email, cek inbox + baris `my20fit_message_log`. (Butuh dijalankan
   di Railway staging — tak bisa dari sandbox build ini.)
3. Nyalakan jalur transaksional & window dulu (OTP, fasting, meal) — aman.
4. Onboarding drip **paling akhir**, bertahap (kill-switch/limit) — lihat
   risiko backlog di `docs/EMAIL-STATUS.md` §5.
5. Blast marketing: hanya ke audiens **ber-consent**; kirim 10% dulu → cek
   metrik (auto-abort aktif) → sisanya. Pantau via **Analitik per Campaign**
   (baru, TASK 2) + timeline email per user.

---
**Status TASK 4:** 4.1 (inventaris) ✅ · 4.3 (laporan pra-kirim) ✅ (dokumen ini)
· 4.2 (tes whitelist) ⏸ butuh env Railway pemilik · **mass-send** ⏸ butuh
approval eksplisit + consent > 0.
