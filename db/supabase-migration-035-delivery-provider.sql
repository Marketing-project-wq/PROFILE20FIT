-- Migration 035 — Master PENYEDIA pesan-antar (reusable + searchable) untuk Eat Now.
--
-- Sebelumnya `my20fit_menu_delivery_links.provider` hanya teks bebas (dropdown
-- GrabFood/GoFood di UI). Sekarang penyedia jadi master data yang bisa ditambah &
-- dicari admin, dan link mereferensikannya lewat `provider_id`. Kolom `provider` (teks)
-- TETAP dipertahankan sebagai snapshot nama supaya link lama tak rusak & tampilan user
-- tak bergantung join.
--
-- Jalankan MANUAL di Supabase SQL Editor (project cpvzwqptzcxnwzfzgrmt). Hanya tabel
-- berawalan my20fit_* (aman).

create table if not exists public.my20fit_delivery_provider (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  logo_url   text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.my20fit_menu_delivery_links
  add column if not exists provider_id uuid references public.my20fit_delivery_provider(id);

create index if not exists my20fit_menu_delivery_links_provider_idx
  on public.my20fit_menu_delivery_links (provider_id);

-- RLS deny-public (konsisten; akses lewat server service key).
alter table public.my20fit_delivery_provider enable row level security;

-- Seed penyedia dari nilai provider distinct yang sudah ada + default GrabFood/GoFood.
insert into public.my20fit_delivery_provider (name, slug)
select initcap(t.p) as name, lower(t.p) as slug
from (select distinct provider as p from public.my20fit_menu_delivery_links
      where provider is not null and btrim(provider) <> '') t
on conflict (slug) do nothing;

insert into public.my20fit_delivery_provider (name, slug) values
  ('GrabFood', 'grabfood'), ('GoFood', 'gofood')
on conflict (slug) do nothing;

-- Backfill provider_id untuk link lama (cocokkan slug = lower(provider)).
update public.my20fit_menu_delivery_links l
set provider_id = p.id
from public.my20fit_delivery_provider p
where lower(l.provider) = p.slug and l.provider_id is null;
