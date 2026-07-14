-- ============================================================
--  20fit — Migration 004: Ledger kredit scan + konsumsi server-authoritative
--  Jalankan di Supabase > SQL Editor. Idempoten & AMAN untuk DB berjalan
--  (additif: TIDAK mengubah perilaku lama; menambah kapabilitas server).
--
--  Tujuan (F0-3):
--   1) my20fit_scan_ledger = catatan append-only tiap perubahan kredit
--      (+ pembelian/voucher, - konsumsi scan). Sumber audit keuangan.
--   2) RPC my20fit_consume_scan = konsumsi 1 scan ATOMIC (kunci baris),
--      gratis dulu (10/bulan) baru kredit berbayar. Menggantikan penulisan
--      saldo langsung dari client (js/auth.js) -> saldo jadi server-authoritative.
--   3) upgrade my20fit_credit_scan agar sekaligus menulis ledger.
--   4) RPC my20fit_add_credits = penyesuaian manual (admin) via ledger.
--
--  Catatan periode: dihitung zona Asia/Jakarta (WIB) — mayoritas user Indonesia.
--  Batas gratis 10/bulan cocok dengan SCAN_FREE di js/auth.js.
-- ============================================================

-- ---------- 1) Ledger (append-only) ----------
create table if not exists public.my20fit_scan_ledger (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null,
  delta         integer not null,                 -- + kredit masuk, - konsumsi
  reason        text not null,                     -- purchase|voucher|consume_free|consume_paid|admin_adjust|refund
  reff_no       text,                              -- link ke my20fit_scan_orders (bila ada)
  balance_after integer,                           -- snapshot saldo kredit berbayar setelah operasi
  created_at    timestamptz not null default now()
);
create index if not exists my20fit_scan_ledger_user_idx on public.my20fit_scan_ledger (auth_user_id, created_at desc);
-- Idempotensi baris kredit pembelian/voucher: satu (reff_no, reason) hanya sekali.
create unique index if not exists my20fit_scan_ledger_reff_reason_uidx
  on public.my20fit_scan_ledger (reff_no, reason) where reff_no is not null;

alter table public.my20fit_scan_ledger enable row level security;
-- User boleh MEMBACA ledger miliknya sendiri (transparansi). Tulis hanya lewat
-- RPC SECURITY DEFINER / service_role — tidak ada policy insert/update/delete publik.
drop policy if exists p_scan_ledger_select_own on public.my20fit_scan_ledger;
create policy p_scan_ledger_select_own on public.my20fit_scan_ledger
  for select using (auth.uid() = auth_user_id);

-- ---------- 2) Konsumsi 1 scan (ATOMIC, server-authoritative) ----------
-- Return jsonb: { ok, code?, used, free_limit, credits, period }.
-- ok=false + code='scan_limit' kalau kuota habis (gratis & kredit sama-sama 0).
create or replace function public.my20fit_consume_scan(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_free    constant int := 10;                    -- kuota gratis / bulan (samakan dgn SCAN_FREE di auth.js)
  v_period  text := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM');
  v_count   int;
  v_credits int;
  v_pdb     text;
  v_used    int;
begin
  select coalesce(scan_count, 0), coalesce(scan_credits, 0), scan_period
    into v_count, v_credits, v_pdb
    from public.my20fit_profile
    where auth_user_id = p_uid
    for update;                                     -- kunci baris: anti double-spend antar tab/device

  if not found then
    return jsonb_build_object('ok', false, 'code', 'no_profile');
  end if;

  -- reset kuota gratis tiap bulan (kalau period tersimpan != bulan ini)
  v_used := case when v_pdb = v_period then v_count else 0 end;

  if v_used >= v_free and v_credits <= 0 then
    return jsonb_build_object('ok', false, 'code', 'scan_limit',
      'used', v_used, 'free_limit', v_free, 'credits', v_credits, 'period', v_period);
  end if;

  if v_used < v_free then
    -- pakai jatah GRATIS
    update public.my20fit_profile
      set scan_period = v_period, scan_count = v_used + 1, updated_at = now()
      where auth_user_id = p_uid
      returning coalesce(scan_count, 0), coalesce(scan_credits, 0) into v_count, v_credits;
    insert into public.my20fit_scan_ledger(auth_user_id, delta, reason, balance_after)
      values (p_uid, -1, 'consume_free', v_credits);
  else
    -- gratis habis -> pakai kredit BERBAYAR
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

-- ---------- 3) Upgrade credit_scan: sekaligus catat ledger ----------
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
  update public.my20fit_scan_orders
    set status = 'paid', paid_at = now()
    where reff_no = p_reff and status = 'pending'
    returning auth_user_id, credits into v_uid, v_credits;

  if v_uid is null then
    return false;  -- sudah dikredit, atau order tak ada (idempoten)
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

-- ---------- 4) Penyesuaian manual (admin) via ledger ----------
create or replace function public.my20fit_add_credits(p_uid uuid, p_n int, p_reason text default 'admin_adjust')
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_bal int;
begin
  update public.my20fit_profile
    set scan_credits = greatest(0, coalesce(scan_credits, 0) + p_n),
        updated_at = now()
    where auth_user_id = p_uid
    returning coalesce(scan_credits, 0) into v_bal;

  if v_bal is null then
    return null;  -- profil tak ditemukan
  end if;

  insert into public.my20fit_scan_ledger(auth_user_id, delta, reason, balance_after)
    values (p_uid, p_n, coalesce(p_reason, 'admin_adjust'), v_bal);

  return v_bal;
end;
$function$;
revoke execute on function public.my20fit_add_credits(uuid, int, text) from public, anon;
grant  execute on function public.my20fit_add_credits(uuid, int, text) to service_role;
