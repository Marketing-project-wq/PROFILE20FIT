-- ============================================================
-- 20260819090000_fase1_buyer_identity  (FASE 1: identitas pembeli)
-- Tabel identitas my20fit_ (deny-public RLS → hanya server/service key) + kolom
-- auth_user_id/channel (additif) di tabel order/booking. Backfill auth_user_id HANYA untuk
-- baris yang email-nya cocok TEPAT ke satu akun auth.users (email auth unik → 0/1 match);
-- yang tak cocok / tanpa akun dibiarkan NULL (jangan tebak). Backfill idempoten.
-- Diterapkan ke cpvzwqptzcxnwzfzgrmt (DB dipakai bersama, TANPA staging DB — hati-hati).
--
-- Hasil backfill nyata (service role): buyers=921, identities=1842; linked:
--   arena_class_bookings 291, arena_bookings 48, arena_package_orders 24,
--   gym_membership_orders 3, clinic_bookings 3, doctor_bookings 0.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_buyers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) unique,
  display_name text, primary_email text, primary_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists my20fit_buyer_identities (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references my20fit_buyers(id) on delete cascade,
  type text not null check (type in ('email','phone','auth_user_id','master_customer_id','ticket_customer_id')),
  value text not null,
  created_at timestamptz not null default now(),
  unique (type, value)
);
alter table my20fit_buyers enable row level security;
alter table my20fit_buyer_identities enable row level security;

alter table arena_package_orders     add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;
alter table gym_membership_orders    add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;
alter table pt_package_orders        add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;
alter table youngstar_package_orders add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;
alter table arena_bookings           add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;
alter table doctor_bookings          add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;
alter table arena_venue_bookings     add column if not exists auth_user_id uuid references auth.users(id), add column if not exists channel text;

-- Backfill buyers + identities (idempoten)
insert into my20fit_buyers (auth_user_id, primary_email)
  select id, lower(btrim(email)) from auth.users where email is not null
  on conflict (auth_user_id) do nothing;
insert into my20fit_buyer_identities (buyer_id, type, value)
  select b.id, 'auth_user_id', b.auth_user_id::text from my20fit_buyers b where b.auth_user_id is not null
  on conflict (type, value) do nothing;
insert into my20fit_buyer_identities (buyer_id, type, value)
  select b.id, 'email', b.primary_email from my20fit_buyers b where b.primary_email is not null
  on conflict (type, value) do nothing;

-- Backfill auth_user_id (hanya cocok-1-akun; sisanya NULL)
update arena_class_bookings t set auth_user_id=u.id from auth.users u where t.auth_user_id is null and t.email is not null and btrim(t.email)<>'' and lower(btrim(t.email))=lower(btrim(u.email));
update arena_bookings        t set auth_user_id=u.id from auth.users u where t.auth_user_id is null and t.email is not null and btrim(t.email)<>'' and lower(btrim(t.email))=lower(btrim(u.email));
update arena_package_orders  t set auth_user_id=u.id from auth.users u where t.auth_user_id is null and t.email is not null and btrim(t.email)<>'' and lower(btrim(t.email))=lower(btrim(u.email));
update gym_membership_orders t set auth_user_id=u.id from auth.users u where t.auth_user_id is null and t.email is not null and btrim(t.email)<>'' and lower(btrim(t.email))=lower(btrim(u.email));
update clinic_bookings       t set auth_user_id=u.id from auth.users u where t.auth_user_id is null and t.email is not null and btrim(t.email)<>'' and lower(btrim(t.email))=lower(btrim(u.email));
update doctor_bookings       t set auth_user_id=u.id from auth.users u where t.auth_user_id is null and t.patient_email is not null and btrim(t.patient_email)<>'' and lower(btrim(t.patient_email))=lower(btrim(u.email));
