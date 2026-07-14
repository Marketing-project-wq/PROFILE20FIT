-- ============================================================
--  20fit — Migration 003: Baseline skema commerce/scan (schema-as-code)
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN dijalankan di DB
--  yang sudah ada (semua pakai IF NOT EXISTS -> no-op kalau objek sudah ada).
--
--  Latar belakang: tabel & fungsi berikut selama ini HANYA hidup di Supabase
--  (dibuat manual), tidak ada di repo -> lingkungan tidak reproducible. File
--  ini mendokumentasikan skema yang SUDAH berjalan di production, hasil
--  reverse-engineer dari information_schema + pg_get_functiondef (14 Jul 2026).
--
--  Namespace: HANYA tabel berawalan my20fit_* (aturan CLAUDE.md #4).
--  RLS: deny-public; akses lewat server (service_role bypass RLS).
-- ============================================================

-- ---------- Order pembelian paket scan ----------
create table if not exists public.my20fit_scan_orders (
  reff_no              text primary key,
  auth_user_id         uuid not null,
  credits              integer not null default 0,
  amount               integer not null default 0,        -- harga kotor (gross)
  net_amount           integer,                            -- harga setelah diskon voucher
  provider             text not null default 'singapay',
  status               text not null default 'pending',    -- pending|paid|failed|expired|cancelled
  order_type           text not null default 'scan_credit',
  voucher_id           uuid,
  payment_method       text,
  gateway_reference_id text,
  payment_link_id      text,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);
create index if not exists my20fit_scan_orders_user_idx    on public.my20fit_scan_orders (auth_user_id, created_at desc);
create index if not exists my20fit_scan_orders_status_idx  on public.my20fit_scan_orders (status, created_at desc);
alter table public.my20fit_scan_orders enable row level security;
-- Tanpa policy publik: hanya server (service_role) yang boleh baca/tulis.
-- (Policy "user boleh baca order sendiri" ditambahkan di migration 005 / F1-1.)

-- ---------- Voucher ----------
create table if not exists public.my20fit_vouchers (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null,
  description          text,
  discount_type        text not null,                      -- 'percentage' | 'amount'
  discount_value       integer not null,
  min_transaction      integer not null default 0,
  usage_limit_total    integer,
  usage_limit_per_user integer,
  used_count           integer not null default 0,
  valid_from           timestamptz,
  valid_until          timestamptz,
  status               text not null default 'active',      -- active|inactive
  created_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create unique index if not exists my20fit_vouchers_code_uidx on public.my20fit_vouchers (upper(code));
alter table public.my20fit_vouchers enable row level security;

-- ---------- Pemakaian voucher ----------
create table if not exists public.my20fit_voucher_usages (
  id               uuid primary key default gen_random_uuid(),
  voucher_id       uuid not null,
  auth_user_id     uuid not null,
  reff_no          text,
  discount_applied integer not null default 0,
  used_at          timestamptz not null default now()
);
create index if not exists my20fit_voucher_usages_voucher_idx on public.my20fit_voucher_usages (voucher_id);
create index if not exists my20fit_voucher_usages_user_idx    on public.my20fit_voucher_usages (auth_user_id);
create unique index if not exists my20fit_voucher_usages_reff_uidx on public.my20fit_voucher_usages (reff_no) where reff_no is not null;
alter table public.my20fit_voucher_usages enable row level security;

-- ---------- RBAC admin ----------
create table if not exists public.my20fit_admin_roles (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  email        text,
  role         text not null,                              -- superadmin|staff|viewer
  created_by   uuid,
  created_at   timestamptz not null default now()
);
create unique index if not exists my20fit_admin_roles_user_uidx on public.my20fit_admin_roles (auth_user_id);
alter table public.my20fit_admin_roles enable row level security;

create table if not exists public.my20fit_admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email   text,
  action        text not null,
  target        text,
  detail        jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists my20fit_admin_audit_action_idx on public.my20fit_admin_audit_log (action, created_at desc);
alter table public.my20fit_admin_audit_log enable row level security;

-- ---------- Heartbeat aktivitas user ----------
create table if not exists public.my20fit_user_activity (
  auth_user_id   uuid primary key,
  email          text,
  full_name      text,
  first_seen_at  timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  last_page      text,
  ping_count     integer not null default 0
);
create index if not exists my20fit_user_activity_active_idx on public.my20fit_user_activity (last_active_at desc);
alter table public.my20fit_user_activity enable row level security;

-- ---------- RPC: kreditkan order lunas (ATOMIC & IDEMPOTEN) ----------
-- Versi baseline yang sudah berjalan di production. Migration 004 meng-upgrade
-- fungsi ini agar sekaligus mencatat ledger (my20fit_scan_ledger).
create or replace function public.my20fit_credit_scan(p_reff text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid;
  v_credits int;
begin
  update public.my20fit_scan_orders
    set status = 'paid', paid_at = now()
    where reff_no = p_reff and status = 'pending'
    returning auth_user_id, credits into v_uid, v_credits;

  if v_uid is null then
    return false;  -- already credited, or order not found
  end if;

  update public.my20fit_profile
    set scan_credits = coalesce(scan_credits, 0) + coalesce(v_credits, 0),
        updated_at = now()
    where auth_user_id = v_uid;

  return true;
end;
$function$;

-- Fungsi SECURITY DEFINER hanya boleh dipanggil server (service_role), bukan anon/publik.
revoke execute on function public.my20fit_credit_scan(text) from public, anon;
grant  execute on function public.my20fit_credit_scan(text) to service_role;
