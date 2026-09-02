-- Penghubung katering <-> resep, EKSPLISIT lewat (source, menu_id) -- pola sama dgn
-- my20fit_menu_reaction, bukan pencocokan nama makanan (yang akan salah: "Ayam Bakar"
-- katering A akan muncul di semua resep ayam bakar, bukan cuma yang cocok).
create table public.my20fit_caterer_menus (
  id uuid primary key default gen_random_uuid(),
  caterer_id uuid not null references public.my20fit_caterers(id) on delete cascade,
  source text not null,
  menu_id text not null,
  price integer,
  portion_note text,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (caterer_id, source, menu_id)
);

alter table public.my20fit_caterer_menus enable row level security;

create policy my20fit_caterer_menus_select_public
  on public.my20fit_caterer_menus for select
  to anon, authenticated
  using (is_available = true);
