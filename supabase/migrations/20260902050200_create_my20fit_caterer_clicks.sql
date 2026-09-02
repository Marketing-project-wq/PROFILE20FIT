-- Catat klik ke katering -- BUKAN utk "terpopuler" sekarang (datanya belum cukup, jangan
-- tampilkan urutan karangan). Kumpulkan dulu beberapa minggu, baru nyalakan sort populer
-- nanti kalau datanya sudah cukup. Sengaja TANPA policy sama sekali (anon & authenticated)
-- -- 0 policies = default-deny, baca/tulis cuma lewat service role di endpoint server.
create table public.my20fit_caterer_clicks (
  id uuid primary key default gen_random_uuid(),
  caterer_id uuid not null references public.my20fit_caterers(id) on delete cascade,
  source text not null,
  menu_id text not null,
  auth_user_id uuid references auth.users(id) on delete set null,
  anon_id uuid references public.my20fit_anonymous_sessions(anon_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.my20fit_caterer_clicks enable row level security;
