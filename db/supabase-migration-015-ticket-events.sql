-- ============================================================
-- Migration 015 — Katalog "Event Mendatang" (bisa dibeli) untuk widget tiket homepage.
-- Menggantikan rancangan my20fit_event_catalog (migration 014, tak pernah dijalankan)
-- dengan skema yang lebih kaya. Dikelola dari admin-v2 (section Event); tab "Mendatang"
-- di dashboard membacanya lewat /api/events/upcoming (server, service key).
--
-- Namespace my20fit_* (aturan CLAUDE.md §4). rc_events (sistem race-timing app lain)
-- TIDAK disentuh — jembatan opsional disimpan sebagai rc_event_id DI TABEL INI (soft link,
-- tanpa FK, tanpa ALTER rc_events).
--
-- Tombol "Beli Sekarang" → https://ticket.20fit.id/id/events/<slug> (+UTM); payment & tiket
-- diproses di ticket.20fit.id (kita tak memproses bayar). Slug kosong = tombol disembunyikan.
--
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt via Supabase apply_migration.
-- Untuk lingkungan lain: jalankan MANUAL di Supabase SQL Editor.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_ticket_events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- deep-link beli: ticket.20fit.id/id/events/<slug>
  name         text not null,
  subtitle     text,
  organizer    text,
  venue        text,
  city         text,
  starts_at    timestamptz,                   -- null = "Jadwal menyusul" (tetap ditampilkan, urut terakhir)
  price_from   integer,                       -- rupiah (angka), opsional
  currency     text not null default 'IDR',
  category     text,
  cover_url    text,
  sold_count   integer not null default 0,
  status       text not null default 'draft'
               check (status in ('draft','on_sale','sold_out','closed')),
  sort_order   integer not null default 0,
  published_at timestamptz,                   -- null = belum publish (tak tampil di tab)
  synced_at    timestamptz,                   -- diisi bila kelak ada sinkronisasi otomatis
  rc_event_id  uuid,                          -- jembatan OPSIONAL ke rc_events.id (soft link)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   text
);

create index if not exists my20fit_ticket_events_browse_idx
  on my20fit_ticket_events (status, starts_at nulls last, sort_order);

-- RLS: SELECT publik HANYA baris on_sale & sudah publish (anon + authenticated).
-- Server admin tetap pakai service key (bypass RLS) untuk CRUD.
alter table my20fit_ticket_events enable row level security;

create policy my20fit_ticket_events_public_read
  on my20fit_ticket_events for select to anon, authenticated
  using (status = 'on_sale' and published_at is not null);

-- ------------------------------------------------------------
-- SEED MANUAL (data dari katalog ticket.20fit.id — tidak ada sumber sinkron otomatis
-- di database saat ini). BRI Life di-set 'closed' karena tanggalnya sudah lewat.
-- ------------------------------------------------------------
insert into my20fit_ticket_events
  (slug, name, organizer, venue, city, starts_at, price_from, currency, status, sort_order, published_at)
values
  ('indonesia-sports-summit-2026-jakarta-hybrid-race',
   'Indonesia Sports Summit 2026 – Jakarta Hybrid Race', '20FIT Sports', null, 'Jakarta',
   timestamptz '2026-09-11 00:00:00+07', 50000, 'IDR', 'on_sale', 1, now()),
  ('hybrid-youngstars-hairdo-face-sticker',
   'HYBRID Youngstars - Hairdo & Face Sticker', '20FIT Arena', '20FIT Arena', null,
   null, 35000, 'IDR', 'on_sale', 2, now()),
  ('bri-life-pelari-berpesta',
   'BRI Life Pelari Berpesta', 'SKOLARI', null, null,
   timestamptz '2026-08-16 00:00:00+07', 150000, 'IDR', 'closed', 3, now())
on conflict (slug) do update set
  name=excluded.name, organizer=excluded.organizer, venue=excluded.venue, city=excluded.city,
  starts_at=excluded.starts_at, price_from=excluded.price_from, status=excluded.status,
  sort_order=excluded.sort_order, published_at=excluded.published_at, updated_at=now();
