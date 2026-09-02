-- TAHAP 2 ("kirim resep, terbit setelah disetujui admin"): tabel teks konsent (CMS-driven,
-- bukan hardcode di kode -- beda dari pola CORP_CONSENT yang hardcode JS constant) +
-- kolom pencatatan konsent di my20fit_menu_contribution utk resolusi sengketa (versi +
-- hash teks PERSIS yang disetujui + waktu).
create table if not exists public.my20fit_menu_consent_text (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  text_id text not null,
  text_en text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.my20fit_menu_consent_text enable row level security;
create policy my20fit_menu_consent_text_sel_active on public.my20fit_menu_consent_text
  for select using (is_active = true);
-- Tidak ada policy INSERT/UPDATE/DELETE -- hanya service role (CMS admin, Tahap 4 PRD
-- sebelumnya) yang bisa ubah teks ini, konsisten pola default-deny caterer_clicks.

insert into public.my20fit_menu_consent_text (version, text_id, text_en, is_active) values (
  '2026-09-02-v1',
  'Dengan mengirim resep ini, saya menyatakan resep dan foto ini adalah karya/milik saya sendiri (bukan salinan dari sumber lain), tidak mengandung klaim medis/kesehatan yang menyesatkan, dan saya memahami resep ini TIDAK langsung tayang -- akan ditinjau admin terlebih dahulu. Kredit hadiah hanya dihitung untuk resep yang disetujui DAN tayang.',
  'By submitting this recipe, I confirm the recipe and photo are my own original work (not copied from another source), contain no misleading medical/health claims, and I understand this recipe will NOT go live immediately -- it will be reviewed by an admin first. Reward credits only count for recipes that are approved AND published.',
  true
);

alter table public.my20fit_menu_contribution
  add column if not exists consent_version text,
  add column if not exists consent_text_hash text,
  add column if not exists consent_at timestamptz;

-- Kolom konsent HANYA boleh di-INSERT (diisi sekali saat submit/revise), tidak boleh
-- di-UPDATE lewat jalur authenticated -- rekaman audit, tak boleh diubah user setelahnya.
-- (server.js tetap bisa update lewat service role saat revise, krn service role tak kena RLS/GRANT.)
grant insert (consent_version, consent_text_hash, consent_at)
  on public.my20fit_menu_contribution to authenticated;
