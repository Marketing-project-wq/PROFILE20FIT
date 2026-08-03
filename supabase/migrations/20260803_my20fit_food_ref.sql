-- RECORD (bukan auto-run): sudah diterapkan ke Supabase project cpvzwqptzcxnwzfzgrmt
-- via migration "my20fit_food_ref_dictionary" (03 Agu 2026). Disimpan di sini utk traceability.
--
-- Cara A: kamus makanan internal (AGREGAT & ANONIM) — sistem makin akurat dari koreksi user,
-- BUKAN AI yang "belajar". Tidak menyimpan identitas user / foto / tanggal.

create table if not exists public.my20fit_food_ref (
  food_key      text primary key,
  display_name  text not null,
  kcal_per_g    numeric not null,
  protein_per_g numeric not null default 0,
  carbs_per_g   numeric not null default 0,
  fat_per_g     numeric not null default 0,
  fiber_per_g   numeric not null default 0,
  sample_count  integer not null default 1,
  region        text    not null default 'intl',
  updated_at    timestamptz not null default now()
);

alter table public.my20fit_food_ref enable row level security;   -- deny-public (server pakai service key)
revoke all on table public.my20fit_food_ref from anon, authenticated;

create or replace function public.my20fit_food_ref_learn(
  p_key text, p_name text,
  p_kcal_per_g numeric, p_protein_per_g numeric, p_carbs_per_g numeric,
  p_fat_per_g numeric, p_fiber_per_g numeric, p_region text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.my20fit_food_ref as t
    (food_key, display_name, kcal_per_g, protein_per_g, carbs_per_g, fat_per_g, fiber_per_g, sample_count, region, updated_at)
  values
    (p_key, p_name, p_kcal_per_g, coalesce(p_protein_per_g,0), coalesce(p_carbs_per_g,0),
     coalesce(p_fat_per_g,0), coalesce(p_fiber_per_g,0), 1, coalesce(p_region,'intl'), now())
  on conflict (food_key) do update set
    kcal_per_g    = ((t.kcal_per_g    * t.sample_count) + excluded.kcal_per_g)    / (t.sample_count + 1),
    protein_per_g = ((t.protein_per_g * t.sample_count) + excluded.protein_per_g) / (t.sample_count + 1),
    carbs_per_g   = ((t.carbs_per_g   * t.sample_count) + excluded.carbs_per_g)   / (t.sample_count + 1),
    fat_per_g     = ((t.fat_per_g     * t.sample_count) + excluded.fat_per_g)     / (t.sample_count + 1),
    fiber_per_g   = ((t.fiber_per_g   * t.sample_count) + excluded.fiber_per_g)   / (t.sample_count + 1),
    sample_count  = t.sample_count + 1,
    display_name  = excluded.display_name,
    region        = coalesce(excluded.region, t.region),
    updated_at    = now();
end; $$;

revoke all on function public.my20fit_food_ref_learn(text,text,numeric,numeric,numeric,numeric,numeric,text) from anon, authenticated;
