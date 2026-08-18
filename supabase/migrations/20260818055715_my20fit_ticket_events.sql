-- ============================================================
-- 20260818055715_my20fit_ticket_events
-- Katalog "Event Mendatang" (bisa dibeli) untuk widget tiket homepage.
-- Namespace my20fit_* (CLAUDE.md §4). RLS deny-public; SELECT publik hanya baris
-- on_sale & published. rc_events (race-timing app lain) TIDAK disentuh — jembatan
-- opsional disimpan sebagai rc_event_id di tabel INI (soft link, tanpa FK).
--
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt (version 20260818055715).
-- File ini menyatukan riwayat di repo (konvensi supabase/migrations/).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists my20fit_ticket_events (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  subtitle     text,
  organizer    text,
  venue        text,
  city         text,
  starts_at    timestamptz,
  price_from   integer,
  currency     text not null default 'IDR',
  category     text,
  cover_url    text,
  sold_count   integer not null default 0,
  status       text not null default 'draft'
               check (status in ('draft','on_sale','sold_out','closed')),
  sort_order   integer not null default 0,
  published_at timestamptz,
  synced_at    timestamptz,
  rc_event_id  uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   text
);

create index if not exists my20fit_ticket_events_browse_idx
  on my20fit_ticket_events (status, starts_at nulls last, sort_order);

alter table my20fit_ticket_events enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public'
      and tablename='my20fit_ticket_events' and policyname='my20fit_ticket_events_public_read') then
    create policy my20fit_ticket_events_public_read
      on my20fit_ticket_events for select to anon, authenticated
      using (status = 'on_sale' and published_at is not null);
  end if;
end $$;

-- SEED MANUAL (data dari katalog ticket.20fit.id — tak ada sumber sinkron otomatis).
-- BRI Life = 'closed' (tanggal sudah lewat). Idempoten via ON CONFLICT (slug).
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
