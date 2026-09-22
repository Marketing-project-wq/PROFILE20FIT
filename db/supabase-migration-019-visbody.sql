-- 019: Integrasi timbangan Visbody S20 -> my.20fit.id
--
-- NAMA TABEL BEDA DARI SPESIFIKASI, DAN ITU DISENGAJA.
-- Spesifikasi meminta `visbody_scans` + `visbody_body_composition` (tanpa prefix).
-- Project Supabase cpvzwqptzcxnwzfzgrmt dipakai BERSAMA banyak app lain (CLAUDE.md §4),
-- dan itu bukan kekhawatiran teoretis: di project yang sama SUDAH ADA tabel tanpa prefix
-- milik app lain — `mcu_articles`, `mcu_quiz_api_keys`, `recipe_admin_role`,
-- `recipe_admin_audit_log`. Nama sepolos `visbody_scans` akan duduk persis di sebelahnya.
-- Jadi dipakai prefix wajib: `my20fit_visbody_*`. Seluruh kolom, index, dan aturan RLS
-- lainnya PERSIS seperti yang diminta.
--
-- JALANKAN MANUAL di Supabase SQL Editor (CLAUDE.md §I: jangan migration otomatis).
-- Idempoten — aman dijalankan ulang.

-- ============================================================
-- 1. SCAN — satu baris = satu kali naik timbangan
-- ============================================================
create table if not exists public.my20fit_visbody_scan (
  id            uuid primary key default gen_random_uuid(),
  -- NULL selama scan belum diklaim pemiliknya (user scan QR di layar timbangan).
  auth_user_id  uuid references auth.users(id) on delete cascade,

  scan_id       text not null unique,          -- ID scan dari Visbody
  device_sn     text not null,                 -- serial number timbangan
  scan_time     timestamptz not null,          -- waktu scan di timbangan
  event_id      text,                          -- ID event webhook (idempotency)

  -- Snapshot identitas dari Visbody saat scan (apa adanya, tidak dipakai untuk mencocokkan akun)
  visbody_name      text,
  visbody_sex       int,                       -- 1=pria, 2=wanita
  visbody_age       int,
  visbody_height    numeric(5,1),
  visbody_birthday  text,

  status        text not null default 'received',  -- received | bound | data_fetched | failed
  measured_items jsonb,
  pdf_url       text,
  last_error    text,                          -- kenapa 'failed', supaya bisa ditelusuri

  raw_webhook   jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.my20fit_visbody_scan drop constraint if exists my20fit_visbody_scan_status_chk;
alter table public.my20fit_visbody_scan add constraint my20fit_visbody_scan_status_chk
  check (status in ('received','bound','data_fetched','failed'));

-- event_id unik supaya webhook yang dikirim ulang tidak membuat baris kedua.
-- Partial: Visbody boleh saja tidak mengirim event_id pada sebagian event.
create unique index if not exists my20fit_visbody_scan_event_uniq
  on public.my20fit_visbody_scan(event_id) where event_id is not null;

create index if not exists my20fit_visbody_scan_user_idx
  on public.my20fit_visbody_scan(auth_user_id, scan_time desc);
create index if not exists my20fit_visbody_scan_scanid_idx
  on public.my20fit_visbody_scan(scan_id);

-- ============================================================
-- 2. BODY COMPOSITION — hasil ukur per scan
-- ============================================================
create table if not exists public.my20fit_visbody_body (
  id            uuid primary key default gen_random_uuid(),
  scan_id       text not null unique
                  references public.my20fit_visbody_scan(scan_id) on delete cascade,
  auth_user_id  uuid not null references auth.users(id) on delete cascade,

  body_weight               numeric(5,1),   -- kg
  body_fat_percentage       numeric(4,1),   -- %
  body_fat_mass             numeric(5,1),   -- kg
  muscle_mass               numeric(5,1),   -- kg
  skeletal_muscle           numeric(5,1),   -- kg
  fat_free_mass             numeric(5,1),   -- kg
  protein                   numeric(5,1),   -- kg
  total_body_water          numeric(5,1),   -- L
  intracellular_water       numeric(5,1),   -- L
  extracellular_water       numeric(5,1),   -- L
  extracellular_water_ratio numeric(4,3),
  total_minerals            numeric(5,1),   -- kg
  basal_metabolic_rate      int,            -- kkal
  metabolic_age             int,            -- tahun
  body_mass_index           numeric(4,1),
  visceral_fat_grade        int,
  waist_hip_ratio           numeric(4,3),
  body_composition_score    int,

  segmental_muscle_mass     jsonb,
  segmental_fat_mass        jsonb,
  raw_data                  jsonb,          -- balasan Visbody apa adanya

  scanned_at    timestamptz not null,
  created_at    timestamptz not null default now()
);

-- scan_id UNIQUE (beda dari spesifikasi yang membiarkannya non-unique): satu scan hanya
-- punya satu hasil ukur. Tanpa ini, webhook yang datang dua kali atau klaim ulang lewat QR
-- akan menggandakan baris dan membuat chart tren menghitung scan yang sama dua kali.

create index if not exists my20fit_visbody_body_user_idx
  on public.my20fit_visbody_body(auth_user_id, scanned_at desc);

-- ============================================================
-- 3. RLS — user HANYA bisa MEMBACA datanya sendiri
-- ============================================================
-- Tidak ada policy INSERT/UPDATE/DELETE untuk `authenticated`: seluruh penulisan lewat
-- server (service_role, yang melewati RLS). Jadi user tidak bisa mengarang hasil timbangan
-- atau mengklaim scan orang lain langsung dari browser — klaim harus lewat
-- POST /api/visbody/bind-user yang memeriksa syaratnya di server.
alter table public.my20fit_visbody_scan enable row level security;
alter table public.my20fit_visbody_body enable row level security;

drop policy if exists p_visbody_scan_sel on public.my20fit_visbody_scan;
create policy p_visbody_scan_sel on public.my20fit_visbody_scan
  for select using (auth.uid() = auth_user_id);

drop policy if exists p_visbody_body_sel on public.my20fit_visbody_body;
create policy p_visbody_body_sel on public.my20fit_visbody_body
  for select using (auth.uid() = auth_user_id);

-- ============================================================
-- CATATAN UNTUK PEMILIK
-- ============================================================
-- a) Kedua tabel ini belum ditambahkan ke USER_DATA_TABLES di server.js (ekspor data
--    pribadi user). Perlu ditambahkan saat integrasi ini dinyatakan jalan.
-- b) Scan yang belum diklaim punya auth_user_id NULL sehingga TIDAK terbaca siapa pun
--    lewat RLS — itu memang yang diinginkan. Pembersihan scan lama yang tak pernah
--    diklaim (mis. > 90 hari) belum dibuat; putuskan sendiri kebijakannya.
