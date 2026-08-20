-- ============================================================
-- 20260819120000_inapp_class_booking (TAHAP 4: booking Arena/Gym in-app)
-- DB sama dengan booking.20fit.id -> tulis langsung ke tabel booking yang sama, mengikuti
-- alur yang ada: baris dibuat 'pending_payment' -> create-mayar-payment -> webhook
-- mayar-webhook-arena mengubah jadi 'confirmed'. Kanal baru channel='my20fit' (menambah,
-- bukan mengganti alur cash/transfer walk-in). TIDAK mengubah struktur/data
-- arena_class_schedules & gym_class_schedules (RPC hanya SELECT ... FOR UPDATE utk kunci baris).
--
-- 1) gym_class_bookings belum punya auth_user_id/channel (arena_* sudah). Tambah + backfill
--    HANYA yang email-nya cocok tepat ke satu akun (email auth unik). Preview: 5/10 cocok.
-- 2) Idempotensi: partial-unique payment_ref (non-null) -> satu ref pembayaran = satu baris.
-- 3) my20fit_book_class(): kunci baris jadwal, hitung booking hidup, insert bila slot tersisa
--    (kuota aman dari balapan). Dipanggil server-side (service key), channel='my20fit'.
-- ============================================================

alter table gym_class_bookings add column if not exists auth_user_id uuid references auth.users(id);
alter table gym_class_bookings add column if not exists channel text;

update gym_class_bookings t set auth_user_id = u.id from auth.users u
 where t.auth_user_id is null and t.email is not null and btrim(t.email) <> ''
   and lower(btrim(t.email)) = lower(btrim(u.email));

create unique index if not exists arena_class_bookings_payref_uidx on arena_class_bookings (payment_ref) where payment_ref is not null;
create unique index if not exists gym_class_bookings_payref_uidx   on gym_class_bookings   (payment_ref) where payment_ref is not null;
create unique index if not exists arena_bookings_payref_uidx       on arena_bookings       (payment_ref) where payment_ref is not null;

-- Kuota-aman: kunci baris jadwal (FOR UPDATE) -> serialize booking untuk jadwal itu -> hitung
-- booking hidup (status bukan cancelled/failed/expired/refunded) -> insert bila < kuota.
create or replace function my20fit_book_class(
  p_source text, p_schedule_id uuid, p_auth_user_id uuid, p_booking_code text,
  p_full_name text, p_email text, p_phone text,
  p_price integer, p_discount integer, p_voucher_code text
) returns table (booking_id uuid, remaining integer)
language plpgsql security definer set search_path = public as $$
declare
  v_quota integer; v_used integer; v_cancelled boolean; v_date date; v_net integer;
begin
  if p_source = 'arena' then
    select quota, is_cancelled, schedule_date into v_quota, v_cancelled, v_date
      from arena_class_schedules where id = p_schedule_id for update;
  elsif p_source = 'gym' then
    select quota, is_cancelled, schedule_date into v_quota, v_cancelled, v_date
      from gym_class_schedules where id = p_schedule_id for update;
  else
    raise exception 'bad_source';
  end if;

  if v_date is null then raise exception 'schedule_not_found'; end if;
  if v_cancelled then raise exception 'schedule_cancelled'; end if;

  if p_source = 'arena' then
    select count(*) into v_used from arena_class_bookings
     where schedule_id = p_schedule_id
       and lower(coalesce(status,'')) not in ('cancelled','canceled','failed','expired','refunded');
  else
    select count(*) into v_used from gym_class_bookings
     where schedule_id = p_schedule_id
       and lower(coalesce(status,'')) not in ('cancelled','canceled','failed','expired','refunded');
  end if;

  if v_quota is not null and v_used >= v_quota then raise exception 'full'; end if;

  v_net := greatest(0, coalesce(p_price,0) - coalesce(p_discount,0));

  if p_source = 'arena' then
    insert into arena_class_bookings
      (booking_code, schedule_id, auth_user_id, channel, full_name, email, phone,
       price, discount, price_before_disc, voucher_code, status, created_at, updated_at)
      values (p_booking_code, p_schedule_id, p_auth_user_id, 'my20fit', p_full_name, p_email, p_phone,
       v_net, coalesce(p_discount,0), p_price, p_voucher_code, 'pending_payment', now(), now())
      returning id into booking_id;
  else
    insert into gym_class_bookings
      (booking_code, schedule_id, auth_user_id, channel, full_name, email, phone,
       price, discount, price_before_disc, status, created_at, updated_at)
      values (p_booking_code, p_schedule_id, p_auth_user_id, 'my20fit', p_full_name, p_email, p_phone,
       v_net, coalesce(p_discount,0), p_price, 'pending_payment', now(), now())
      returning id into booking_id;
  end if;

  remaining := case when v_quota is null then null else (v_quota - v_used - 1) end;
  return next;
end $$;
