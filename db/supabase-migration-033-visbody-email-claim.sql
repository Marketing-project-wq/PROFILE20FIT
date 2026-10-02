-- 033: Claim hasil Visbody lewat email yang diketik member di timbangan (2026-10-02).
--
-- Webhook Visbody membawa user_info.email (tersimpan di raw_webhook). Scan tanpa pemilik yang emailnya
-- sama dengan email akun TERVERIFIKASI ditawarkan ke akun itu; member mengonfirmasi ("Ini scan saya" +
-- persetujuan data) lalu scan diikat dengan claimed_via = 'email'. Tidak ada kolom baru.
-- PREFIX my20fit_ (CLAUDE.md §4). Idempoten. Jalankan MANUAL di Supabase SQL Editor.

alter table public.my20fit_visbody_scan drop constraint if exists my20fit_visbody_scan_claimed_via_chk;
alter table public.my20fit_visbody_scan add constraint my20fit_visbody_scan_claimed_via_chk
  check (claimed_via is null or claimed_via in ('qr','staff','third_uid','email'));
