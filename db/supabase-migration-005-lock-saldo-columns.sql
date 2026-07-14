-- ============================================================
--  20fit — Migration 005: Kunci kolom saldo dari penulisan client (F0-2)
--  Jalankan di Supabase > SQL Editor. Idempoten.
--
--  Tujuan: kolom saldo (scan_credits, scan_count, scan_period, is_plus_member)
--  di my20fit_profile HANYA boleh diubah oleh server, BUKAN oleh client
--  (anon/authenticated). Ini menutup celah: user meng-update saldonya sendiri
--  dari browser tanpa bayar.
--
--  Mekanisme: BEFORE INSERT/UPDATE trigger. Perubahan saldo hanya diizinkan bila
--  flag transaksi 'my20fit.allow_saldo' = 'on' — yang HANYA di-set di dalam RPC
--  saldo (consume/credit/add). Semua perubahan saldo wajib lewat RPC itu.
--  Kalau flag tidak menyala (mis. update langsung dari client, atau tulis langsung
--  ke tabel tanpa RPC), kolom saldo dipaksa tetap: UPDATE = nilai lama; INSERT = 0/false.
--  (Sengaja TIDAK bergantung pada auth.role() agar trigger tak pernah error walau
--  fungsi itu tak tersedia — mencegah risiko mematahkan seluruh penulisan profil.)
--
--  PRASYARAT URUTAN: dijalankan SETELAH migration 004 + kode server-authoritative
--  (PR-1) LIVE di production, supaya tidak ada lagi jalur client yang menulis saldo.
--
--  Catatan: RPC saldo (consume/credit/add) di-redefine di sini agar menyalakan
--  flag. Isinya identik dgn migration 004, hanya menambah set_config di awal.
-- ============================================================

-- ---------- Fungsi penjaga ----------
create or replace function public.my20fit_guard_profile_saldo()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  -- Saldo hanya boleh berubah bila flag transaksi dinyalakan (di dalam RPC saldo).
  if coalesce(current_setting('my20fit.allow_saldo', true), '') = 'on' then
    return new;
  end if;

  -- Bukan server -> saldo tidak boleh diubah dari client.
  if tg_op = 'UPDATE' then
    new.scan_credits   := old.scan_credits;
    new.scan_count     := old.scan_count;
    new.scan_period    := old.scan_period;
    new.is_plus_member := old.is_plus_member;
  elsif tg_op = 'INSERT' then
    new.scan_credits   := 0;
    new.scan_count     := 0;
    new.scan_period    := null;
    new.is_plus_member := coalesce(new.is_plus_member, false);
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_my20fit_guard_profile_saldo on public.my20fit_profile;
create trigger trg_my20fit_guard_profile_saldo
  before insert or update on public.my20fit_profile
  for each row execute function public.my20fit_guard_profile_saldo();

-- ---------- Redefine RPC saldo: nyalakan flag transaksi ----------
-- (identik migration 004 + baris set_config di awal)

create or replace function public.my20fit_consume_scan(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_free    constant int := 10;
  v_period  text := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM');
  v_count   int;
  v_credits int;
  v_pdb     text;
  v_used    int;
begin
  perform set_config('my20fit.allow_saldo', 'on', true);  -- izinkan tulis saldo dlm transaksi ini

  select coalesce(scan_count, 0), coalesce(scan_credits, 0), scan_period
    into v_count, v_credits, v_pdb
    from public.my20fit_profile
    where auth_user_id = p_uid
    for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'no_profile');
  end if;

  v_used := case when v_pdb = v_period then v_count else 0 end;

  if v_used >= v_free and v_credits <= 0 then
    return jsonb_build_object('ok', false, 'code', 'scan_limit',
      'used', v_used, 'free_limit', v_free, 'credits', v_credits, 'period', v_period);
  end if;

  if v_used < v_free then
    update public.my20fit_profile
      set scan_period = v_period, scan_count = v_used + 1, updated_at = now()
      where auth_user_id = p_uid
      returning coalesce(scan_count, 0), coalesce(scan_credits, 0) into v_count, v_credits;
    insert into public.my20fit_scan_ledger(auth_user_id, delta, reason, balance_after)
      values (p_uid, -1, 'consume_free', v_credits);
  else
    update public.my20fit_profile
      set scan_period = v_period, scan_count = v_used, scan_credits = v_credits - 1, updated_at = now()
      where auth_user_id = p_uid
      returning coalesce(scan_count, 0), coalesce(scan_credits, 0) into v_count, v_credits;
    insert into public.my20fit_scan_ledger(auth_user_id, delta, reason, balance_after)
      values (p_uid, -1, 'consume_paid', v_credits);
  end if;

  return jsonb_build_object('ok', true,
    'used', v_count, 'free_limit', v_free, 'credits', v_credits, 'period', v_period);
end;
$function$;
revoke execute on function public.my20fit_consume_scan(uuid) from public, anon;
grant  execute on function public.my20fit_consume_scan(uuid) to service_role;

create or replace function public.my20fit_credit_scan(p_reff text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid     uuid;
  v_credits int;
  v_bal     int;
begin
  perform set_config('my20fit.allow_saldo', 'on', true);

  update public.my20fit_scan_orders
    set status = 'paid', paid_at = now()
    where reff_no = p_reff and status = 'pending'
    returning auth_user_id, credits into v_uid, v_credits;

  if v_uid is null then
    return false;
  end if;

  update public.my20fit_profile
    set scan_credits = coalesce(scan_credits, 0) + coalesce(v_credits, 0),
        updated_at = now()
    where auth_user_id = v_uid
    returning coalesce(scan_credits, 0) into v_bal;

  insert into public.my20fit_scan_ledger(auth_user_id, delta, reason, reff_no, balance_after)
    values (v_uid, coalesce(v_credits, 0), 'purchase', p_reff, v_bal)
    on conflict (reff_no, reason) where reff_no is not null do nothing;

  return true;
end;
$function$;
revoke execute on function public.my20fit_credit_scan(text) from public, anon;
grant  execute on function public.my20fit_credit_scan(text) to service_role;

create or replace function public.my20fit_add_credits(p_uid uuid, p_n int, p_reason text default 'admin_adjust')
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_bal int;
begin
  perform set_config('my20fit.allow_saldo', 'on', true);

  update public.my20fit_profile
    set scan_credits = greatest(0, coalesce(scan_credits, 0) + p_n),
        updated_at = now()
    where auth_user_id = p_uid
    returning coalesce(scan_credits, 0) into v_bal;

  if v_bal is null then
    return null;
  end if;

  insert into public.my20fit_scan_ledger(auth_user_id, delta, reason, balance_after)
    values (p_uid, p_n, coalesce(p_reason, 'admin_adjust'), v_bal);

  return v_bal;
end;
$function$;
revoke execute on function public.my20fit_add_credits(uuid, int, text) from public, anon;
grant  execute on function public.my20fit_add_credits(uuid, int, text) to service_role;
