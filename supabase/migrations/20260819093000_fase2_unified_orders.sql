-- ============================================================
-- 20260819093000_fase2_unified_orders  (FASE 2: order terpadu)
-- my20fit_orders + my20fit_order_items (mencontoh my20fit_scan_orders). Prefiks my20fit_
-- (namespace shared DB). Idempoten: unique(source_table,source_id) utk backfill; partial-unique
-- gateway_reference_id utk fulfilment (satu ref = satu order). RLS deny-public (history via server).
-- Tabel order lama TIDAK dihapus; my20fit_orders jadi sumber tunggal ke depan, lama tetap ditulis
-- selama peralihan. Status lama dipetakan ke pending/paid/fulfilled/failed/expired/refunded/cancelled;
-- status asli disimpan di metadata.original_status.
--
-- Hasil backfill (service role): orders=68 (package 65 + membership 3; pt/youngstar 0 baris),
--   items=68, linked ke akun=27. Diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

create table if not exists my20fit_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  buyer_id uuid references my20fit_buyers(id),
  auth_user_id uuid references auth.users(id),
  kind text not null check (kind in ('ticket','membership','package','class','venue','service','scan')),
  channel text,
  subtotal integer, discount integer not null default 0, net_amount integer, currency text not null default 'IDR',
  provider text, payment_method text, payment_link_id text, gateway_reference_id text,
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','failed','expired','refunded','cancelled')),
  paid_at timestamptz, expires_at timestamptz,
  external_order_id text, synced_at timestamptz,
  source_table text, source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (source_table, source_id)
);
create unique index if not exists my20fit_orders_gateway_ref_uidx on my20fit_orders (gateway_reference_id) where gateway_reference_id is not null;
create index if not exists my20fit_orders_auth_idx on my20fit_orders (auth_user_id, created_at desc);

create table if not exists my20fit_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references my20fit_orders(id) on delete cascade,
  kind text, item_ref text, title text,
  quantity integer not null default 1, unit_price integer, line_total integer,
  metadata jsonb not null default '{}'::jsonb
);
alter table my20fit_orders enable row level security;
alter table my20fit_order_items enable row level security;

-- Backfill order lama → my20fit_orders (idempoten via unique(source_table,source_id)).
-- Ekspresi status: paid/settle/success/complete/confirm atau paid_at → 'paid'; cancel/fail/expire/refund
-- masing-masing; selain itu 'pending'. order_no diberi prefiks sumber supaya unik lintas tabel.
insert into my20fit_orders (order_no,buyer_id,auth_user_id,kind,channel,subtotal,discount,net_amount,currency,payment_method,status,paid_at,source_table,source_id,created_at,metadata)
select 'arp:'||coalesce(nullif(btrim(t.order_code),''),t.id::text), b.id, t.auth_user_id, 'package', t.channel,
  t.price, coalesce(t.discount_amount,0), coalesce(t.price,0)-coalesce(t.discount_amount,0), 'IDR', t.payment_method,
  case when lower(coalesce(t.status,''))~'paid|settle|success|complete|confirm' or t.paid_at is not null then 'paid'
       when lower(coalesce(t.status,''))~'cancel' then 'cancelled' when lower(coalesce(t.status,''))~'fail' then 'failed'
       when lower(coalesce(t.status,''))~'expire' then 'expired' when lower(coalesce(t.status,''))~'refund' then 'refunded' else 'pending' end,
  t.paid_at,'arena_package_orders',t.id::text,t.created_at,
  jsonb_build_object('original_status',t.status,'payment_ref',t.payment_ref,'name',t.full_name,'email',t.email,'phone',t.phone,'item_name',t.package_name,'package_id',t.package_id,'sessions',t.sessions,'voucher_code',t.voucher_code)
from arena_package_orders t left join my20fit_buyers b on b.auth_user_id=t.auth_user_id
on conflict (source_table,source_id) do nothing;

insert into my20fit_orders (order_no,buyer_id,auth_user_id,kind,channel,subtotal,discount,net_amount,currency,payment_method,status,paid_at,source_table,source_id,created_at,metadata)
select 'gym:'||coalesce(nullif(btrim(t.order_code),''),t.id::text), b.id, t.auth_user_id, 'membership', t.channel,
  t.price, 0, coalesce(t.price,0), 'IDR', t.payment_method,
  case when lower(coalesce(t.status,''))~'paid|settle|success|complete|confirm' or t.paid_at is not null then 'paid'
       when lower(coalesce(t.status,''))~'cancel' then 'cancelled' when lower(coalesce(t.status,''))~'fail' then 'failed'
       when lower(coalesce(t.status,''))~'expire' then 'expired' when lower(coalesce(t.status,''))~'refund' then 'refunded' else 'pending' end,
  t.paid_at,'gym_membership_orders',t.id::text,t.created_at,
  jsonb_build_object('original_status',t.status,'payment_ref',t.payment_ref,'name',t.full_name,'email',t.email,'phone',t.phone,'item_name',t.plan_name,'plan_id',t.plan_id,'duration_months',t.duration_months)
from gym_membership_orders t left join my20fit_buyers b on b.auth_user_id=t.auth_user_id
on conflict (source_table,source_id) do nothing;

insert into my20fit_orders (order_no,buyer_id,auth_user_id,kind,channel,subtotal,discount,net_amount,currency,payment_method,status,paid_at,source_table,source_id,created_at,metadata)
select 'pt:'||coalesce(nullif(btrim(t.order_code),''),t.id::text), b.id, t.auth_user_id, 'package', t.channel,
  t.price, 0, coalesce(t.price,0), 'IDR', t.payment_method,
  case when lower(coalesce(t.status,''))~'paid|settle|success|complete|confirm' or t.paid_at is not null then 'paid'
       when lower(coalesce(t.status,''))~'cancel' then 'cancelled' when lower(coalesce(t.status,''))~'fail' then 'failed'
       when lower(coalesce(t.status,''))~'expire' then 'expired' when lower(coalesce(t.status,''))~'refund' then 'refunded' else 'pending' end,
  t.paid_at,'pt_package_orders',t.id::text,t.created_at,
  jsonb_build_object('original_status',t.status,'payment_ref',t.payment_ref,'name',t.full_name,'email',t.email,'phone',t.phone,'item_name',t.coach_name,'pt_package_id',t.pt_package_id,'sessions',t.sessions)
from pt_package_orders t left join my20fit_buyers b on b.auth_user_id=t.auth_user_id
on conflict (source_table,source_id) do nothing;

insert into my20fit_orders (order_no,buyer_id,auth_user_id,kind,channel,subtotal,discount,net_amount,currency,payment_method,status,paid_at,source_table,source_id,created_at,metadata)
select 'ys:'||coalesce(nullif(btrim(t.order_code),''),t.id::text), b.id, t.auth_user_id, 'package', t.channel,
  t.price, 0, coalesce(t.price,0), 'IDR', t.payment_method,
  case when lower(coalesce(t.status,''))~'paid|settle|success|complete|confirm' or t.paid_at is not null then 'paid'
       when lower(coalesce(t.status,''))~'cancel' then 'cancelled' when lower(coalesce(t.status,''))~'fail' then 'failed'
       when lower(coalesce(t.status,''))~'expire' then 'expired' when lower(coalesce(t.status,''))~'refund' then 'refunded' else 'pending' end,
  t.paid_at,'youngstar_package_orders',t.id::text,t.created_at,
  jsonb_build_object('original_status',t.status,'payment_ref',t.payment_ref,'name',t.full_name,'email',t.email,'phone',t.phone,'youngstar_package_id',t.youngstar_package_id,'sessions',t.sessions,'is_squad',t.is_squad)
from youngstar_package_orders t left join my20fit_buyers b on b.auth_user_id=t.auth_user_id
on conflict (source_table,source_id) do nothing;

-- Satu order_item per order (idempoten).
insert into my20fit_order_items (order_id, kind, item_ref, title, quantity, unit_price, line_total, metadata)
select o.id, o.kind, o.source_id, coalesce(nullif(o.metadata->>'item_name',''), o.kind), 1, o.subtotal, o.net_amount,
  jsonb_build_object('source_table', o.source_table)
from my20fit_orders o
where not exists (select 1 from my20fit_order_items i where i.order_id = o.id);
