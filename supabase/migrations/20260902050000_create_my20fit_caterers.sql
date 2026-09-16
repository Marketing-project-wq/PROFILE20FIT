-- Direktori katering pihak ketiga yang menjual makanan sesuai resep di menu.20fit.id.
-- Murni direktori (dikonfirmasi user: tanpa komisi/transaksi) -- order_url/whatsapp
-- mengarah LANGSUNG ke katering, 20FIT tak terlibat uang. Diisi lewat CMS admin
-- (super_admins), bukan oleh publik -- karena itu tulis hanya lewat service role.
create table public.my20fit_caterers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  phone text,
  whatsapp text,
  address text,
  area text,
  latitude double precision,
  longitude double precision,
  delivery_areas text[],
  min_order integer,
  order_url text,
  is_verified boolean not null default false,
  is_active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.my20fit_caterers enable row level security;

create policy my20fit_caterers_select_public
  on public.my20fit_caterers for select
  to anon, authenticated
  using (is_active = true);
