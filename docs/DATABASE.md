# DATABASE — my.20fit.id

> **Pembaruan terakhir:** 2026-08-13 · **Commit staging:** `8c31776`
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

### Relasi & kolom kunci (terverifikasi dari `server.js`)
- **`auth_user_id`** = FK ke Supabase `auth.users.id`. Hampir semua tabel milik-user di-query `.eq("auth_user_id", user.id)` — ini kunci kepemilikan data.
- `my20fit_profile.scan_credits` = saldo kredit scan (dinaikkan RPC `my20fit_credit_scan`, dikurangi `my20fit_consume_scan`).
- `my20fit_admin_roles` (`auth_user_id`, `email`, `role`) = sumber RBAC admin (role: `marketing`/`viewer`/`staff`/`superadmin`).
- `my20fit_scan_orders` (status pending/paid) → kredit di-apply idempoten by `reff`/`auth_user_id`.
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
- `supabase/functions/` — Edge Functions: `my20fit-ai`, `my20fit-foodimg` (TypeScript, di-deploy terpisah via Supabase).

## Cara menjalankan migration
- **TIDAK ADA runner otomatis** di repo (package.json hanya `start`). Migration dijalankan **MANUAL** di **Supabase SQL Editor**, berurutan sesuai nomor.
- **Agent tidak menjalankan migration sendiri** — minta pemilik. Untuk perubahan yang butuh drop kolom (mis. 013): **deploy kode dulu → verifikasi → baru jalankan SQL** (hindari query lama menabrak kolom yang sudah hilang).
- Perubahan DB harus tetap patuh namespace `my20fit_*` + RLS.
