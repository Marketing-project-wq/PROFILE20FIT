-- ============================================================
-- 20260818072607_my20fit_catalog_items_view
-- Read-layer katalog terpadu (VIEW). Menggabungkan semua produk bisa-dibeli jadi
-- satu daftar baca: gym/arena/pt/youngstar/clinic/arena_booking + clinic_services
-- + katalog tiket (my20fit_ticket_events).
--
-- Aturan CLAUDE.md §4: LAPISAN BACA — TIDAK mengubah tabel produk app lain, hanya SELECT.
-- id sintetis stabil = md5(source_table:source_id)::uuid. Server baca via service key.
-- Definisi identik dgn pg_get_viewdef pada project cpvzwqptzcxnwzfzgrmt (version 20260818072607).
-- ============================================================

create or replace view my20fit_catalog_items as
  select md5('gym_membership_plans:'||id::text)::uuid as id, 'membership'::text as kind,
    'gym_membership_plans'::text as source_table, id::text as source_id, null::text as slug,
    name as title, (duration_months||' bulan')::text as subtitle, description as description,
    price as price, null::int as compare_at_price, 'IDR'::text as currency, null::text as cover_url,
    jsonb_build_object('duration_months',duration_months) as metadata,
    coalesce(is_active,true) as is_active, coalesce(sort_order,0) as sort_order
  from gym_membership_plans
  union all
  select md5('arena_packages:'||id::text)::uuid, 'package','arena_packages',id::text, null,
    name, (sessions||' sesi')::text, description, price, original_price, 'IDR', null,
    jsonb_build_object('sessions',sessions,'includes_physio_voucher',includes_physio_voucher),
    coalesce(is_active,true), coalesce(sort_order,0)
  from arena_packages
  union all
  select md5('pt_packages:'||id::text)::uuid, 'package','pt_packages',id::text, null,
    (sessions||' Sesi PT')::text, 'Personal Trainer'::text, null, price, null, 'IDR', null,
    jsonb_build_object('sessions',sessions,'validity_months',validity_months,'bonus_membership_months',bonus_membership_months),
    coalesce(is_active,true), coalesce(sort_order,0)
  from pt_packages
  union all
  select md5('youngstar_packages:'||id::text)::uuid, 'package','youngstar_packages',id::text, null,
    (sessions||' Sesi'||(case when is_squad then ' — Squad' else '' end))::text, 'Youngstars'::text, null,
    price, null, 'IDR', null,
    jsonb_build_object('sessions',sessions,'price_per_session',price_per_session,'doctor_consultations',doctor_consultations,'cafe_vouchers',cafe_vouchers,'validity_months',validity_months,'is_squad',is_squad),
    coalesce(is_active,true), coalesce(sort_order,0)
  from youngstar_packages
  union all
  select md5('clinic_packages:'||id::text)::uuid, 'package','clinic_packages',id::text, null,
    name::text, category::text, null, package_price, retail_price, 'IDR', null,
    jsonb_build_object('category',category,'sessions',sessions,'price_per_session',price_per_session,'discount_percent',discount_percent,'requires_referral',requires_referral),
    coalesce(is_active,true), 0
  from clinic_packages
  union all
  select md5('arena_booking_packages:'||id::text)::uuid, 'package','arena_booking_packages',id::text, null,
    name, 'Sewa Arena / jam'::text, description, price_per_hour, null, 'IDR', null,
    jsonb_build_object('includes_pt',includes_pt,'per_hour',true),
    coalesce(is_active,true), coalesce(sort_order,0)
  from arena_booking_packages
  union all
  select md5('clinic_services:'||id::text)::uuid, 'service','clinic_services',id::text, null,
    name::text, service_group::text, description, price, null, 'IDR', null,
    jsonb_build_object('code',code,'category',category,'service_group',service_group,'duration_minutes',duration_minutes,'requires_doctor',requires_doctor,'is_online_bookable',is_online_bookable,'package_category',package_category),
    coalesce(is_active,true), coalesce(sort_order,0)
  from clinic_services
  union all
  select md5('my20fit_ticket_events:'||id::text)::uuid, 'ticket','my20fit_ticket_events',id::text, slug,
    name, subtitle, null, price_from, null, coalesce(currency,'IDR'), cover_url,
    jsonb_build_object('organizer',organizer,'venue',venue,'city',city,'category',category,'starts_at',starts_at,'status',status),
    (status='on_sale' and published_at is not null), coalesce(sort_order,0)
  from my20fit_ticket_events;
