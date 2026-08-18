-- ============================================================
-- Migration 014 — Katalog "Upcoming Event" (bisa dibeli) untuk widget tiket homepage.
-- Dikelola dari admin-v2 (section Event). Tab "Upcoming Event" di dashboard membacanya;
-- tombol Buy Now → https://ticket.20fit.id/id/events/<slug> (same-tab).
-- Namespace my20fit_* (aturan CLAUDE.md §4). RLS deny-public; server pakai service key.
-- Jalankan MANUAL di Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_event_catalog (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  event_date  date,
  location    text,
  image_url   text,
  slug        text,               -- untuk deep-link beli: ticket.20fit.id/id/events/<slug>
  price_label text,               -- teks harga bebas (mis. "Mulai Rp 150.000"), opsional
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create index if not exists my20fit_event_catalog_active_idx
  on my20fit_event_catalog (active, sort_order, event_date);

-- RLS: deny-public (akses hanya lewat service key di server).
alter table my20fit_event_catalog enable row level security;
-- Tanpa policy apa pun = tak ada akses via anon/authenticated (deny-all). Server bypass via service key.
