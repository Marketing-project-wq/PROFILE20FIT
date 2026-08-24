-- ============================================================
-- 20260824060000_scan_quota_read_fn
-- Baca kuota scan TANPA memotong (untuk tampilan saldo di client, mis. calories.20fit.id).
-- Cermin logika my20fit_consume_scan: 10 gratis/bulan (Asia/Jakarta) + scan_credits.
-- Read-only (LANGUAGE sql, tak menulis). NULL bila profil belum ada -> endpoint fallback default.
-- ============================================================
create or replace function my20fit_scan_quota(p_uid uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'ok', true,
    'used', case when scan_period = to_char(now() at time zone 'Asia/Jakarta','YYYY-MM')
                 then coalesce(scan_count,0) else 0 end,
    'free_limit', 10,
    'credits', coalesce(scan_credits,0),
    'period', to_char(now() at time zone 'Asia/Jakarta','YYYY-MM')
  )
  from my20fit_profile where auth_user_id = p_uid;
$$;
