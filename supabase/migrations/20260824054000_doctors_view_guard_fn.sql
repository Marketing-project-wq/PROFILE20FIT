-- ============================================================
-- 20260824054000_doctors_view_guard_fn
-- Pelengkap penjaga CI (yang hanya lihat repo). Fungsi ini memeriksa DEFINISI VIEW LIVE
-- di DB: true bila my20fit_doctors_public memuat admin_user_id ATAU view-nya hilang
-- (dua-duanya = perlu perhatian). Dipanggil berkala via /api/cron/guard-doctors-view.
-- ============================================================
create or replace function my20fit_check_doctors_view()
returns boolean
language plpgsql security definer set search_path = public, pg_catalog as $$
declare def text;
begin
  begin
    def := pg_get_viewdef('public.my20fit_doctors_public'::regclass);
  exception when others then
    return true;  -- view hilang -> anggap pelanggaran
  end;
  return position('admin_user_id' in lower(def)) > 0;
end $$;
