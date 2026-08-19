-- ============================================================
-- 20260819110000_coaches_doctors_roster
-- Roster tampilan untuk Book Coach + carousel home. Prefiks my20fit_ (namespace shared DB;
-- CLAUDE.md §4 — tabel tanpa prefix milik app lain). TIDAK menyentuh arena_coaches/gym_coaches/
-- arena_class_schedules/gym_class_schedules (dipakai operasional; nama gabungan di sana memang
-- sengaja). Tabel dibuat KOSONG — diisi lewat CMS admin. RLS deny-public (tanpa policy) →
-- hanya server (service key) yang baca/tulis, konsisten pola my20fit_.
--
-- my20fit_coaches                 : roster coach untuk ditampilkan (venue arena/gym/both).
-- my20fit_coach_instructor_aliases: pemetaan 1 coach → banyak teks instructor (per source).
--   Kunci "klik coach → kelasnya": join lewat alias, BUKAN cocok-teks saat query. Satu
--   instructor_text (mis. "Cindy Lauw & Rheza") boleh dipetakan ke >1 coach.
-- my20fit_doctors                 : roster dokter (kosong; diisi setelah izin dokter). JANGAN
--   ambil dari admin_users (akun internal) ke tampilan publik.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_coaches (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  venue text not null default 'both' check (venue in ('arena','gym','both')),
  speciality text,
  bio text,
  photo_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists my20fit_coach_instructor_aliases (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references my20fit_coaches(id) on delete cascade,
  instructor_text text not null,
  source text not null check (source in ('arena','gym')),
  created_at timestamptz not null default now(),
  unique (coach_id, source, instructor_text)
);
create index if not exists my20fit_coach_aliases_lookup_idx
  on my20fit_coach_instructor_aliases (source, instructor_text);

create table if not exists my20fit_doctors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  speciality text,
  bio text,
  photo_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS deny-public: aktifkan RLS, TANPA policy apa pun → akses hanya lewat service key server.
alter table my20fit_coaches                  enable row level security;
alter table my20fit_coach_instructor_aliases enable row level security;
alter table my20fit_doctors                  enable row level security;
