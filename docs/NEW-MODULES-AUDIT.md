# NEW-MODULES-AUDIT — apa yang dipakai ulang vs baru (5 modul admin)

> Langkah 1 dari handoff `PROMPT-CLAUDE-CODE.md`. Audit **read-only** dari kode &
> DB nyata (per 2026-08-12). Tujuan: JANGAN duplikat yang sudah ada. Legenda:
> ✅ ADA (pakai ulang) · 🟡 PARSIAL (perlu tambah field/tabel) · 🔴 BELUM ADA (baru).
>
> ⚠️ **Aturan namespace (CLAUDE.md §4):** hanya sentuh tabel berawalan `my20fit_`.
> DB ini juga punya tabel **`vouchers` (17 kol)**, **`admin_users`**, **`super_admins`**
> **milik app lain — JANGAN disentuh.** Voucher kita = `my20fit_vouchers`.

---

## Ringkasan cepat

| Modul | Status | Inti |
|---|---|---|
| Fondasi: role & audit log | 🟡 | role + audit ADA; perlu tambah role `finance`/`staff studio` |
| Fondasi: CSV export | 🟡 | `/api/admin/export-csv` ADA; perlu ikut-filter + background |
| Fondasi: filter periode | 🟡 | param `window/days` ADA di beberapa endpoint; belum ada komponen bersama |
| Fondasi: sistem segmen tersimpan | 🔴 | `lib/segments.js` cuma **preset kode**; segmen tersimpan/reusable BARU |
| 1. Voucher | 🟡 | `my20fit_vouchers` + `my20fit_voucher_usages` + endpoint + UI ADA; kurang field & analitik |
| 2. Corporate | 🟡 | 5 tabel `my20fit_corporate*` + endpoint ADA; kurang kontrak/seat + threshold agregat |
| 3. Menu approval | 🟡 | `my20fit_menu_contribution` + approve/reject ADA; **tak ada field `visibility`** |
| 4. Email campaign | ✅🟡 | sistem email lengkap ADA (dibangun sesi ini); kurang subject/body bilingual + jadwal |
| 5. Banner | 🔴 | tidak ada tabel/endpoint/UI — **sepenuhnya baru** |

---

## Fondasi bersama

### Role & permission — 🟡
- **ADA:** `my20fit_admin_roles`, RBAC server-side (`requireAdmin`, `ADMIN_RANK`), role `superadmin(3)/staff(2)/viewer(1)/marketing(1)`, `marketing` diblokir data kesehatan (`adminCanSeeHealth`).
- **GAP:** handoff minta role **`finance`** (revenue/transaksi/kontrak corporate) & **`staff studio`** (user & aktivitas) — belum ada. Pemetaan permission per section (redesign) perlu diperluas. Kenyataan sekarang: **4 baris role, semuanya `superadmin`** (staff/viewer/marketing belum dipakai).

### Audit log — ✅
`my20fit_admin_audit_log` (actor, action, target, detail, created_at) + helper `adminAudit()`. Dipakai ulang untuk semua aksi sensitif modul baru.

### CSV export — 🟡
`POST /api/admin/export-csv` + export CSV di konsol email ADA. **GAP:** layanan export terpusat yang (a) ikut filter aktif, (b) besar → background + link unduh, (c) **kecualikan field kesehatan di level query**.

### Filter periode — 🟡
Banyak endpoint terima `days`/`window`. **GAP:** komponen filter periode bersama (preset + banding periode + tersimpan di URL/localStorage).

### Sistem segmen tersimpan — 🔴 (kritis — penghubung semua modul)
`lib/segments.js` = **7 preset di kode** (`onboarded_no_scan`, `credit_low`, dll) + `applyEligibility`. **GAP:** tabel segmen tersimpan (buat sekali, pakai ulang untuk voucher/campaign/banner/laporan) + **validasi atribut netral** (larang bentuk dari makanan/berat/kalori). Ini fondasi yang harus dibangun sebelum modul yang memakainya.

---

## MODUL 1 — VOUCHER — 🟡
- **ADA:** `my20fit_vouchers` (`id, code, description, discount_type, discount_value, min_transaction, usage_limit_total, usage_limit_per_user, used_count, valid_from, valid_until, status, created_by, created_at, updated_at`), `my20fit_voucher_usages` (`id, voucher_id, auth_user_id, reff_no, discount_applied, used_at`), endpoint `/api/admin/vouchers` (list/get/create/update/deactivate/activate), UI di `admin-dashboard.html`. `discount_type` kini hanya `percentage`/`fixed`.
- **GAP field `my20fit_vouchers`:** `name`, `applicable_packages`, `max_discount`, `target_segment_id`; `discount_type` tambah **`free_scans`**.
- **GAP tabel:** `VoucherAttempt` (kode gagal + alasan) → 🔴 **BELUM ADA** (wajib untuk tabel "kode gagal" & redemption rate).
- **GAP logic:** pemakaian kuota **atomik** (cek `used_count < limit` race-safe) + test bersamaan; **% pembeli baru** (pecah first-time vs repeat) belum dihitung.
- **Pakai ulang:** alur Xendit (`amount`/`net_amount` di `my20fit_scan_orders`) sudah menampung diskon voucher.

## MODUL 2 — CORPORATE — 🟡
- **ADA:** `my20fit_corporate` (`id, name, code, status, contact_email, notes, created_by, …`), `my20fit_corporate_member` (`… status, consent_version, consent_text_hash, consent_at, linked_at, left_at`), `my20fit_corporate_admin` (`corporate_id, auth_user_id, email, …`), `my20fit_corporate_access_log`, `my20fit_corporate_message_log`; endpoint `/api/admin/corporate` (list/create/get/update/admins). **Consent per member sudah dilacak** (bagus untuk privasi).
- **GAP field:** `my20fit_corporate` kurang `contact_person, contract_start, contract_end, seat_limit`; `my20fit_corporate_admin` kurang `role` (hr_admin/viewer).
- **GAP fitur:** laporan **agregat** + **ambang minimum 5 anggota aktif** (di query & permission) + alert kontrak <30 hari + **portal klien** (akun password sementara, hash, ganti saat login pertama).
- **KEPUTUSAN PRIVASI:** corporate hanya agregat, tak pernah per individu (lihat Q2).

## MODUL 3 — APPROVAL MENU — 🟡
- **ADA:** `my20fit_menu_contribution` (`id, auth_user_id, name, diet_type, ingredients, steps, photo_url, est_kcal, macros, content_hash, status, reject_reason, reviewed_by, reviewed_at, published, …`) + `my20fit_menu_event`, `my20fit_menu_reward_log`; endpoint `/api/admin/menu` (list/approve/reject) + `menu-analytics`.
- **GAP kritis:** **tidak ada field `visibility` (private|shared)**. Handoff membedakan private (tak perlu approval) vs shared (direview). Tabel `menu_contribution` tampaknya memang "menu yang dikontribusikan" (= shared), tapi **perlu konfirmasi** apakah user bisa share menu ke user lain (Q1). Kalau tidak bisa share, modul review tak perlu.
- **GAP:** `MenuReviewLog` (riwayat aksi review terpisah) → 🔴 baru; pedoman reviewer di UI; alasan penolakan baku; notifikasi hasil ID & EN.

## MODUL 4 — EMAIL CAMPAIGN — ✅🟡 (sebagian besar SUDAH dibangun sesi ini)
- **ADA:** `my20fit_email_sends` (= campaign/blast: `name, segment_id, template_id, subject, status, total_*, daily_cap, batch_size, test_sent_at, approved_by, …`), `my20fit_email_send_recipients`, `my20fit_message_log`, `my20fit_email_events` (open/click/bounce + `clicked_url`), `my20fit_suppression_list`, `my20fit_user_comm_prefs` (+ `lang`), `lib/blast.js` (queue, batch, kill switch, auto-abort, idempotency `blast:{id}:{uid}`), analitik per-campaign + drill-down + link terpopuler + panel kesehatan. **Guardrail** (kill switch, cap config, backlog expiry, circuit breaker) sudah live.
- **GAP:** `EmailCampaign` bilingual (`subject_id/subject_en, body_id/body_en`) — kini `email_sends` single `subject` + `template_id`; **`scheduled_at`/jadwal kirim**; UI redesign (konfirmasi ketik `KIRIM <jumlah>`, preview desktop/mobile, 5 daftar drill-down + spam list).
- **BLOCKER:** open/click tracking di Resend (Q4) — tanpa itu click rate mustahil.

## MODUL 5 — BANNER / PROMOTION — 🔴 BARU SEPENUHNYA
- **TIDAK ADA** tabel/endpoint/UI banner. Perlu buat `Banner` + `BannerEvent` (impression/click), upload gambar (strip EXIF, kompres, responsif, validasi rasio 3:1), versi ID/EN, validasi `cta_url` (anti open-redirect), placement `below_aqi`, prioritas drag-drop, target segmen, tracking impression async/batch + kecualikan bot, rate-limit endpoint publik.

---

## Ringkasan: apa yang dipakai ulang (jangan bikin baru)
- Auth & RBAC (`my20fit_admin_roles`, `requireAdmin`), audit log (`my20fit_admin_audit_log`), Xendit order flow (`my20fit_scan_orders`), sistem email penuh (blast/segmen/events/suppression), tabel voucher/corporate/menu yang sudah ada, design system (`css/20fit-design-system.css`), i18n (`js/i18n.js`).

## Apa yang benar-benar BARU
- Tabel segmen tersimpan, `VoucherAttempt`, kolom kontrak/seat corporate + role admin, portal klien corporate, field `visibility` + `MenuReviewLog` menu, kolom campaign bilingual + jadwal, **seluruh modul Banner**, role `finance`/`staff studio`, layanan CSV/filter-periode bersama.

---

## 🛑 6 KEPUTUSAN YANG DIBUTUHKAN SEBELUM BUILD (dari handoff)
| # | Pertanyaan | Apa kata kode |
|---|---|---|
| 1 | Menu diet bisa **dibagikan** ke user lain, atau hanya diri sendiri? | Ada `my20fit_menu_contribution` (kontribusi = shared) tapi **tak ada field `visibility`**. Perlu jawabanmu — menentukan apakah modul review dibangun & bagaimana. |
| 2 | Ada kontrak corporate yang menuntut akses data **individual** karyawan? | Kode: corporate lihat member + broadcast; belum ada laporan agregat/threshold. Handoff: kalau ada tuntutan individual → **jangan bangun**, lapor. |
| 3 | Ambang minimum anggota aktif corporate — **5** atau lain? | Belum diterapkan di kode. Default handoff = 5. |
| 4 | **Open & click tracking sudah aktif di Resend › Domains?** | Tak bisa kucek dari sini (Resend diblok sandbox). `email_events` = 0 baris. **Gate modul analitik email.** |
| 5 | Frequency cap email + push per user per hari & minggu — angkanya? | Kode sekarang: marketing 1/hari, 3/minggu, cooldown 60m (tunable env). Handoff usul 3 / 7 hari lintas-channel. Konfirmasi. |
| 6 | `admin.html` lama dipensiunkan atau tetap fallback? | `/admin` → `/admin-dashboard`; `admin.html` gated `ADMIN_KEY`, fungsinya sudah tergantikan. |

## Rencana urutan (dari handoff, setelah keputusan di atas)
Fondasi (role+finance/staff, segmen tersimpan, filter periode, CSV, pola tabel) → Voucher → Banner → Email campaign (setelah Q4) → Menu approval (setelah Q1) → Corporate (paling banyak schema). Feature flag, migration reversible, **staging dulu**, commit kecil per tujuan.
