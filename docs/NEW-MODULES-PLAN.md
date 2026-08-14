# NEW-MODULES-PLAN — keputusan & urutan build (admin redesign)

## Keputusan pemilik (2026-08-12)
1. **Menu diet bisa dibagikan** ke user lain → Modul 3 (approval menu shared) **dibangun** (tambah `visibility` + MenuReviewLog).
2. **Corporate: agregat saja**, tak pernah per individu. Ambang **min 5 anggota aktif**.
3. **Resend open/click tracking: AKTIF** → analitik email penuh boleh dihitung.
4. Mulai dari **Fondasi + Voucher**.
5. Default dipakai (belum dikoreksi): freq cap lintas-channel **3 / 7 hari** (existing 1/hari, 3/minggu — akan diselaraskan); `admin.html` lama **tetap fallback**.

## Aturan tetap
Migration reversible · fitur baru di belakang **feature flag** (`my20fit_admin_feature_flags`, default OFF) · **staging dulu** · audit log tiap aksi sensitif · commit kecil · hanya tabel `my20fit_` · segmen hanya atribut netral (validasi server) · export/report tanpa data kesehatan.

## Status build

### ✅ Increment 1 — Fondasi schema + Voucher schema (SELESAI, migration 011 applied)
- `my20fit_admin_feature_flags` (6 flag, default OFF).
- `my20fit_segments` (segmen tersimpan reusable).
- `my20fit_vouchers` + kolom `name, applicable_packages, max_discount, target_segment_id`.
- `my20fit_voucher_attempts` (kode gagal + redemption rate).

### ⏭️ Berikutnya (belum dikerjakan)
- **Fondasi kode:** helper feature-flag (`gate`), CRUD segmen + validasi atribut netral, layanan CSV (ikut filter, tanpa data kesehatan), role `finance`/`staff_studio` + pemetaan permission per section.
- **Voucher backend:** log `my20fit_voucher_attempts` di jalur validasi; **kuota atomik** (`update ... where used_count < limit returning`) + test bersamaan; dukung `discount_type='free_scans'`; hitung **% pembeli baru** (first-time vs repeat); endpoint tracking (perbandingan voucher, revenue bersih, kode gagal).
- **Voucher UI:** section Voucher di admin baru (KPI, tabel sortable, form generate + bulk 100 + preview aturan 1 kalimat).
- Lalu: Banner → Email campaign (bilingual + jadwal + UI) → Menu approval (visibility + review log) → Corporate (kontrak/seat + agregat + portal).

## Referensi desain
Bundel handoff (`admin-shell.html`, `admin-theme.css`, `admin-shell.js`, `Admin Dashboard 20FIT.dc.html`) = acuan layout/perilaku. Token: merah `#E4002B`/`#FF3B57`, radius 0, 1px lines, Barlow/Manrope/JetBrains. Load `admin-theme.css` **setelah** `css/20fit-design-system.css`.
