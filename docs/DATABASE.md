# DATABASE — my.20fit.id

> **Pembaruan terakhir:** 2026-10-01 · **Commit staging:** `e298aa2` · **Production:** `cb621dc`
> Sumber: `db/*.sql`, `supabase/`, dan pemakaian di `server.js`. Nama tabel & migration
> terverifikasi dari file. **Detail kolom: buka file migration terkait** (di bawah tak
> diisi kolom tebakan). Relasi umum lihat catatan.

## Aturan namespace (WAJIB)
- Project Supabase `cpvzwqptzcxnwzfzgrmt` ("20FIT ALL DATA") **dipakai bareng banyak app** (ratusan tabel app lain).
- **HANYA sentuh tabel berawalan `my20fit_*`.** Tabel tanpa prefix (mis. `vouchers`, `admin_users`, `super_admins`, `arena_*`, `gym_*`, `clinic_*`) milik app lain — **JANGAN diubah** (boleh dibaca read-only untuk jadwal, lihat `/api/classes/schedule`).
- **RLS deny-public.** Akses tulis/admin ditegakkan di server pakai **service key** (bypass RLS). Anon key hanya untuk auth di browser.

## Tabel `my20fit_*` per domain (terverifikasi dari nama)

| Domain | Tabel |
|---|---|
| Profil & kesehatan | `my20fit_profile`, `my20fit_daily_log`, `my20fit_health_entry`, `my20fit_mcu_result`, `my20fit_fasting`, `my20fit_workout`, `my20fit_user_activity` |
| Scan / kredit / commerce | `my20fit_scan_orders`, `my20fit_scan_ledger` |
| Kontribusi menu diet | `my20fit_menu_contribution`, `my20fit_menu_event`, `my20fit_menu_reward_log` |
| Referensi makanan (AI) | `my20fit_food_ref`, `my20fit_food_ref_learn`, `my20fit_foodimg` |
| Email & komunikasi | `my20fit_email_otp`, `my20fit_email_templates`, `my20fit_email_sends`, `my20fit_email_send_recipients`, `my20fit_email_events`, `my20fit_email_automations`, `my20fit_email_automation_log`, `my20fit_message_log`, `my20fit_campaign_enrollments`, `my20fit_campaign_flags`, `my20fit_segments`, `my20fit_suppression_list`, `my20fit_user_comm_prefs`, `my20fit_signup_attribution` |
| Admin | `my20fit_admin_roles`, `my20fit_admin_audit_log`, `my20fit_admin_feature_flags` |
| Voucher | `my20fit_vouchers`, `my20fit_voucher_usages`, `my20fit_voucher_attempts` |
| Banner / promo | `my20fit_banner`, `my20fit_banner_event` |
| Corporate | `my20fit_corporate`, `my20fit_corporate_admin`, `my20fit_corporate_member`, `my20fit_corporate_message_log`, `my20fit_corporate_access_log` |
| Ulasan kelas | `my20fit_class_reviews` (migration 030, dijalankan 2026-10-01) |
| Roster tampilan (coach/dokter/fisioterapis) | `my20fit_coaches`, `my20fit_coach_instructor_aliases`, `my20fit_doctors`, `my20fit_physiotherapists` |
| Tiket event | `my20fit_ticket_events` (katalog + `sold_count` agregat, disinkron `sync-ticket-events`). `my20fit_ticket_tokens` masih ada di DB tapi **sudah tidak dipakai kode mana pun** sejak jalur OTP dibuang (`d1c2a38`). Arsip pembelian dibaca **read-only** dari `event_transaction` — tabel **milik app lain**, tanpa prefix: jangan ditulis. |

### Relasi & kolom kunci (terverifikasi dari `server.js`)
- **`auth_user_id`** = FK ke Supabase `auth.users.id`. Hampir semua tabel milik-user di-query `.eq("auth_user_id", user.id)` — ini kunci kepemilikan data.
- `my20fit_profile.scan_credits` = saldo kredit scan (dinaikkan RPC `my20fit_credit_scan`, dikurangi `my20fit_consume_scan`).
- `my20fit_admin_roles` (`auth_user_id`, `email`, `role`) = sumber RBAC admin (role: `marketing`/`viewer`/`staff`/`superadmin`).
- `my20fit_scan_orders` (status pending/paid) → kredit di-apply idempoten by `reff`/`auth_user_id`.
- **Roster** (`my20fit_coaches` / `my20fit_doctors` / `my20fit_physiotherapists`): tiga tabel
  TERPISAH, bukan satu tabel ber-role. `my20fit_doctors` dijaga view `my20fit_doctors_public`
  + cek CI (`scripts/check-doctors-view.js`); `my20fit_coaches.venue` dibatasi check
  `arena|gym|both` (tak berlaku untuk kerja klinik) — karena itu fisioterapis bertabel sendiri.
- `my20fit_coach_instructor_aliases` (`coach_id`, `instructor_text`, `source`): kunci
  "klik coach → kelasnya". Cocok **teks PERSIS** dengan kolom `instructor` di
  `arena_class_schedules`/`gym_class_schedules`, BUKAN pencarian teks saat query — jadi tiap
  varian penulisan (termasuk kelas kolaborasi seperti `"Cindy Lauw & Rheza"`) butuh barisnya
  sendiri, dan satu `instructor_text` boleh dipetakan ke lebih dari satu coach.
- Kolom lain: **buka file migration** yang sesuai (di bawah). Tidak diisi tebakan di sini.

### RPC / function Postgres (dipanggil server via `admin.rpc(...)`)
`my20fit_credit_scan`, `my20fit_consume_scan`, `my20fit_add_credits`, `my20fit_grant_menu_reward`, `my20fit_revoke_menu_reward`.

## Migration (di `db/`, dijalankan berurutan)
| File | Isi (dari judul/komentar) |
|---|---|
| `supabase-setup.sql` | Baseline setup skema `my20fit_*` |
| `supabase-policies.sql` | Policy RLS |
| `supabase-migration-001-fitco-binding.sql` | Binding akun FITCO |
| `002-fitco-email-verified.sql` | Verifikasi email FITCO |
| `003-scan-commerce-baseline.sql` | Baseline commerce scan |
| `004-scan-ledger-and-consume.sql` | Ledger kredit + consume |
| `005-email-message-log.sql` | Log pesan email |
| `006-comms-consent.sql` | Consent komunikasi (kolomnya di-DROP oleh 013) |
| `007-campaign-flags.sql` | Flag campaign |
| `008-email-blast-queue.sql` | Antrian blast |
| `009-email-automations.sql` | Automations email |
| `010-email-events-and-lang.sql` | Tabel `my20fit_email_events` + bahasa |
| `011-admin-foundation-voucher.sql` | Fondasi admin + skema voucher |
| `012-banner.sql` | Modul banner |
| `013-drop-email-consent.sql` | **DROP kolom consent** (jalankan setelah deploy kode baru) |

- `supabase/migrations/20260803_my20fit_food_ref.sql` — migration bergaya Supabase CLI (food ref).
- `supabase/migrations/20260819110000_coaches_doctors_roster.sql` — roster coach + alias instructor + dokter.
- `supabase/migrations/20260907000000_physiotherapists_roster.sql` — roster fisioterapis (`my20fit_physiotherapists`). **Sudah dijalankan** di project `cpvzwqptzcxnwzfzgrmt` (aditif; rollback: `drop table my20fit_physiotherapists;`).
- `supabase/migrations/20260908000000_ticket_user_tokens.sql` — `my20fit_ticket_tokens` (PK `auth_user_id`, RLS deny-public). Dibuat untuk menyimpan `userToken` penerbit hasil OTP. **SUDAH TIDAK DIPAKAI:** commit `d1c2a38` (2026-09-09, kini di production) membuang seluruh jalur OTP beserta `getTicketToken`, jadi tak ada kode yang membaca/menulis tabel ini lagi. Tabelnya sengaja **dibiarkan** (tidak di-drop) — keputusan drop ada di pemilik; migration-nya tetap dicatat di sini supaya riwayatnya jelas. Catatan terukur yang masih berlaku: penerbit memberi umur token **900 detik (15 menit)** dan benar-benar menegakkannya (token 16 jam → `401 user_unauthorized`). Karena token tak lagi disimpan, `/api/tickets/mine` mint ulang lewat `/partner/user-token` tiap permintaan.
- **`db/supabase-migration-017` s/d `025` — status per 2026-09-29:** 015, 016, 019 sudah ada sebelumnya; 017, 018, 020, 021, 022, 023, 024, 025 **dijalankan 2026-09-29** (agent via koneksi Supabase, atas izin eksplisit pemilik; aditif, hanya `my20fit_*`). Tabel baru: `my20fit_daily_plan`, `my20fit_member_goals`, `my20fit_sleep`, `my20fit_hydration`, `my20fit_coach_quiz`, `my20fit_workout_plan`, `my20fit_coach_cta_event`, `my20fit_coach_session`, `my20fit_coach_set_log`, `my20fit_coach_achievement`, `my20fit_coach_chat_session`, `my20fit_coach_chat_message`, `my20fit_activity_uploads`, `my20fit_today_plans`. Bucket Storage `workout-uploads` (butuh 017) **dibuat 2026-09-29** (privat, maks 5 MB, png/jpeg/webp).
  - **`my20fit_workout.raw_data` (jsonb, TANPA migration) — kunci yang dipakai sejak 2026-10-01:** `file_paths` (path
    screenshot di bucket `workout-uploads`, prefix `<auth_user_id>/`; signed URL dibuat saat dibuka), `upload_id`
    (baris `my20fit_activity_uploads` tertaut), `started_at` ("HH:MM" WIB), `date_check` {read, text, reason},
    `date_confirmed`, `field_confidence`, `metrics` {avg_speed_kmh, cadence}, `ai_scan`, `edited_at`, dan cache
    `analysis` {hash, coach_id, narrative:{id,en}}. **Sejak analisa v2 (2026-10-01):** `readiness` {resting_hr, hrv_ms,
    sleep_score, body_battery, readiness_score} (hanya yang terbaca dari layar pemulihan) dan `checkin` {at, sleep_hours,
    meal_gap close|ok|mid|long|none, conditions indoor|outdoor_morning|outdoor_midday|outdoor_evening,
    feeling fresh|normal|tired|unwell}. Kolom `pace_data` = {avg_sec_per_km, splits:[{km, sec (pace dtk/km), hr, elev}]}
    tervalidasi (`woPaceData` / `WorkoutMetrics.splitsOf`). Jawaban tidur check-in ditulis ke `my20fit_sleep`
    (source `manual`) HANYA kalau malam itu belum ada catatan; jeda makan check-in TIDAK ditulis ke Calorie Tracker. Server hanya menerima kunci yang dikenal (`woRowFromBody`).
    `uploaded_file_url` kini berisi PATH (dulu signed URL 7 hari yang kedaluwarsa). Jenis workout: run, cycling, walk,
    swimming, gym, hyrox, hiit, other (`js/workout-metrics.js`; kolom `type` tanpa CHECK).
  - **Catatan 2026-09-30:** setelah kartu analisis AI & quiz dihapus dari `/activity`, web **tidak lagi menulis**
    `my20fit_daily_plan` (via `/api/activity/plan`/`goal`) maupun `my20fit_member_goals` (dulu `js/goal-quiz.js`).
    Tabel & datanya TIDAK diubah; `my20fit_member_goals` masih DIBACA konteks AI Coach (`server.js`). Nasib endpoint &
    tabel = TANYA PEMILIK (lihat `docs/STATUS.md` §2).
- **`db/supabase-migration-027-coach-meal-plan.sql`** — `my20fit_coach_meal_plan` (PK `auth_user_id`, `coach_id`,
  `plan` jsonb, `applied_at`, `updated_at`; RLS `auth.uid()=auth_user_id`). Meal plan dari chat coach yang diterapkan
  user → tampil di `/calories`. **Dijalankan 2026-09-30** (agent via koneksi Supabase, atas persetujuan eksplisit
  pemilik; aditif). Masuk `USER_DATA_TABLES` (ekspor/hapus data pribadi).
- **`db/supabase-migration-028-visbody-claim.sql`** — kolom `claimed_at`/`claimed_via`/`viewed_at` di
  `my20fit_visbody_scan`; tabel `my20fit_visbody_claim_token` (hash token claim, sekali pakai, RLS tanpa policy =
  server saja), `my20fit_visbody_claim_audit` (jejak claim, tanpa FK supaya tetap ada walau scan dihapus),
  `my20fit_data_consent` (persetujuan per user/tujuan/versi; user hanya bisa SELECT miliknya). **Dijalankan
  2026-09-30** (agent via koneksi Supabase setelah pemilik memerintahkan "mulai fase"; aditif). `my20fit_visbody_scan`,
  `my20fit_visbody_body`, `my20fit_data_consent` kini masuk `USER_DATA_TABLES`.
- **`db/supabase-migration-029-health-journey.sql`** — `my20fit_health_journey` (1 baris/user: langkah checklist yang tak
  punya sumber lain, `rescan_due`, `hs_unlocked_at`, state nudge), `my20fit_tour_state` (status tur per user per tur +
  versi + langkah terakhir), `my20fit_event_log` (funnel & tur; RLS tanpa policy = server saja), kolom
  `my20fit_profile.calorie_target_kcal/_source/_set_at` (target kalori yang DIKONFIRMASI user, mis. dari BMR Visbody).
  **Dijalankan 2026-09-30** (agent via koneksi Supabase, atas perintah pemilik "lanjut kerjakan semua fase"; aditif).
  Ketiga tabel masuk `USER_DATA_TABLES`.
- **`db/supabase-migration-030-class-reviews.sql`** — `my20fit_class_reviews` (rating 1–5 + `tags` masukan cepat (kunci dari
  `CLASS_REVIEW_TAGS` server.js, ≤8) + ulasan kelas per
  `auth_user_id` + `booking_code`, unik per pasangan; nama kelas / tanggal / instruktur disalin server dari arena-api).
  Ditulis HANYA lewat `POST /api/class-reviews` setelah server cek booking milik user (arena-api by nomor HP profil),
  status `confirmed`, jadwal sudah lewat. RLS: user baca miliknya. Masuk `USER_DATA_TABLES`. Dibaca rekap admin
  `GET /api/admin/class-performance`. File idempoten (ada `add column if not exists tags` bila tabel sudah terlanjur dibuat).
  **Dijalankan 2026-10-01** (agent via koneksi Supabase, setelah user sesi — Marketing@20fit.id — menyetujui
  eksplisit; aditif). Terverifikasi: 12 kolom termasuk `tags`, RLS on, 1 policy, 4 index. Project Supabase dipakai
  bersama staging & produksi, jadi tabel berlaku di keduanya.
- `supabase/functions/` — Edge Functions: `my20fit-ai`, `my20fit-foodimg`, `sync-ticket-events`, `ticket-embed` (TypeScript, di-deploy terpisah via Supabase). `ticket-embed` memegang secret `TICKET_EMBED_KEY` dan jadi **satu-satunya** jalur ke `ticket.20fit.id/api/embed/v1`; `server.js` tak punya env tiket sama sekali.

## Cara menjalankan migration
- **TIDAK ADA runner otomatis** di repo (package.json hanya `start`). Migration dijalankan **MANUAL** di **Supabase SQL Editor**, berurutan sesuai nomor.
- **Agent tidak menjalankan migration sendiri** — minta pemilik. Untuk perubahan yang butuh drop kolom (mis. 013): **deploy kode dulu → verifikasi → baru jalankan SQL** (hindari query lama menabrak kolom yang sudah hilang).
- Perubahan DB harus tetap patuh namespace `my20fit_*` + RLS.
