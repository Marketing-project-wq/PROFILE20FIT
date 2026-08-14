-- Migration 014 — Divisi karyawan korporat (Opsi A)
-- Sudah di-apply ke Supabase (project cpvzwqptzcxnwzfzgrmt) lewat MCP.
-- Non-destruktif: menambah 2 kolom nullable ke my20fit_corporate_member.
--   division       = kode divisi kanonik (hr/finance/it/marketing/sales/operations/
--                    cs/procurement/legal/production/rnd/logistics/ga/engineering/qa/
--                    management/other). Sumber kebenaran daftar = CORP_DIVISIONS di server.js.
--   division_other = teks bebas ketika division = 'other'.
-- Divisi bersifat konteks per-korporat (ikut baris keanggotaan), hilang saat user keluar.

ALTER TABLE public.my20fit_corporate_member
  ADD COLUMN IF NOT EXISTS division text,
  ADD COLUMN IF NOT EXISTS division_other text;

COMMENT ON COLUMN public.my20fit_corporate_member.division IS 'Kode divisi kanonik karyawan (hr/finance/it/marketing/sales/operations/cs/procurement/legal/production/rnd/logistics/ga/engineering/qa/management/other).';
COMMENT ON COLUMN public.my20fit_corporate_member.division_other IS 'Teks divisi bebas ketika division = other.';
