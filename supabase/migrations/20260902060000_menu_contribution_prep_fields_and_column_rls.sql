-- Tahap 1 ("User kirim resep, terbit setelah disetujui admin"): kolom baru agar
-- submission member bisa punya struktur sama dgn resep resmi (prep/cook time split,
-- alat, catatan-sebelum-masak).
alter table public.my20fit_menu_contribution
  add column if not exists prep_minutes integer,
  add column if not exists equipment text,
  add column if not exists prep_note text;

-- RLS hardening: kolom status/published/reject_reason/reviewed_by/reviewed_at HANYA boleh
-- diubah service role (server.js pakai admin client, bypass RLS). Row-policy yang ada
-- (my20fit_menu_upd_own / my20fit_menu_ins_own) izinkan authenticated INSERT/UPDATE ROW
-- miliknya sendiri TANPA batasan KOLOM -- lewat REST API Supabase langsung (bukan lewat app),
-- user bisa self-approve (set status='approved', published=true) pakai token login miliknya
-- sendiri. Postgres RLS tidak bisa membatasi per-kolom lewat USING/WITH CHECK -- pakai
-- column-level GRANT sbg lapis tambahan.
revoke insert, update on public.my20fit_menu_contribution from authenticated;

grant insert (
  auth_user_id, name, diet_type, ingredients, steps, steps_json, photo_url,
  est_kcal, macros, servings, cook_minutes, prep_minutes, equipment,
  prep_note, display_name, content_hash
) on public.my20fit_menu_contribution to authenticated;

grant update (
  name, diet_type, ingredients, steps, steps_json, photo_url,
  est_kcal, macros, servings, cook_minutes, prep_minutes, equipment,
  prep_note, display_name, content_hash, updated_at
) on public.my20fit_menu_contribution to authenticated;
