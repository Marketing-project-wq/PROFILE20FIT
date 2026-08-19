-- ============================================================
-- 20260819065000_catalog_items_exclude_road_to_iss_package
-- Dedup (keputusan pemilik: paket yang juga dijual sebagai tiket → "Hanya di Ticket").
-- "Road to Indonesia Sport Summits 2026" (arena_packages id be58e119-3546-494b-8863-8dd7bd28923c)
-- kini dijual sebagai TIKET (my20fit_ticket_events slug 5-class-sessions-at-20fit-arena), jadi
-- baris arena_packages itu dikecualikan dari view katalog agar tidak muncul dobel di Membership.
-- Hanya menambah 1 klausa WHERE pada cabang arena_packages; cabang lain tak berubah.
-- security_invoker=true dipertahankan (lihat 20260818095735_my20fit_catalog_items_lockdown).
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

create or replace view public.my20fit_catalog_items
with (security_invoker = true) as
 SELECT md5('gym_membership_plans:'::text || gym_membership_plans.id::text)::uuid AS id,
    'membership'::text AS kind, 'gym_membership_plans'::text AS source_table,
    gym_membership_plans.id::text AS source_id, NULL::text AS slug,
    gym_membership_plans.name AS title, gym_membership_plans.duration_months || ' bulan'::text AS subtitle,
    gym_membership_plans.description, gym_membership_plans.price, NULL::integer AS compare_at_price,
    'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('duration_months', gym_membership_plans.duration_months) AS metadata,
    COALESCE(gym_membership_plans.is_active, true) AS is_active,
    COALESCE(gym_membership_plans.sort_order, 0) AS sort_order
   FROM gym_membership_plans
UNION ALL
 SELECT md5('arena_packages:'::text || arena_packages.id::text)::uuid AS id,
    'package'::text AS kind, 'arena_packages'::text AS source_table,
    arena_packages.id::text AS source_id, NULL::text AS slug,
    arena_packages.name AS title, arena_packages.sessions || ' sesi'::text AS subtitle,
    arena_packages.description, arena_packages.price, arena_packages.original_price AS compare_at_price,
    'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('sessions', arena_packages.sessions, 'includes_physio_voucher', arena_packages.includes_physio_voucher) AS metadata,
    COALESCE(arena_packages.is_active, true) AS is_active,
    COALESCE(arena_packages.sort_order, 0) AS sort_order
   FROM arena_packages
   WHERE arena_packages.id <> 'be58e119-3546-494b-8863-8dd7bd28923c'::uuid
UNION ALL
 SELECT md5('pt_packages:'::text || pt_packages.id::text)::uuid AS id,
    'package'::text AS kind, 'pt_packages'::text AS source_table,
    pt_packages.id::text AS source_id, NULL::text AS slug,
    pt_packages.sessions || ' Sesi PT'::text AS title, 'Personal Trainer'::text AS subtitle,
    NULL::text AS description, pt_packages.price, NULL::integer AS compare_at_price,
    'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('sessions', pt_packages.sessions, 'validity_months', pt_packages.validity_months, 'bonus_membership_months', pt_packages.bonus_membership_months) AS metadata,
    COALESCE(pt_packages.is_active, true) AS is_active,
    COALESCE(pt_packages.sort_order, 0) AS sort_order
   FROM pt_packages
UNION ALL
 SELECT md5('youngstar_packages:'::text || youngstar_packages.id::text)::uuid AS id,
    'package'::text AS kind, 'youngstar_packages'::text AS source_table,
    youngstar_packages.id::text AS source_id, NULL::text AS slug,
    (youngstar_packages.sessions || ' Sesi'::text) ||
        CASE WHEN youngstar_packages.is_squad THEN ' — Squad'::text ELSE ''::text END AS title,
    'Youngstars'::text AS subtitle, NULL::text AS description, youngstar_packages.price,
    NULL::integer AS compare_at_price, 'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('sessions', youngstar_packages.sessions, 'price_per_session', youngstar_packages.price_per_session, 'doctor_consultations', youngstar_packages.doctor_consultations, 'cafe_vouchers', youngstar_packages.cafe_vouchers, 'validity_months', youngstar_packages.validity_months, 'is_squad', youngstar_packages.is_squad) AS metadata,
    COALESCE(youngstar_packages.is_active, true) AS is_active,
    COALESCE(youngstar_packages.sort_order, 0) AS sort_order
   FROM youngstar_packages
UNION ALL
 SELECT md5('clinic_packages:'::text || clinic_packages.id::text)::uuid AS id,
    'package'::text AS kind, 'clinic_packages'::text AS source_table,
    clinic_packages.id::text AS source_id, NULL::text AS slug,
    clinic_packages.name::text AS title, clinic_packages.category::text AS subtitle,
    NULL::text AS description, clinic_packages.package_price AS price, clinic_packages.retail_price AS compare_at_price,
    'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('category', clinic_packages.category, 'sessions', clinic_packages.sessions, 'price_per_session', clinic_packages.price_per_session, 'discount_percent', clinic_packages.discount_percent, 'requires_referral', clinic_packages.requires_referral) AS metadata,
    COALESCE(clinic_packages.is_active, true) AS is_active,
    0 AS sort_order
   FROM clinic_packages
UNION ALL
 SELECT md5('arena_booking_packages:'::text || arena_booking_packages.id::text)::uuid AS id,
    'package'::text AS kind, 'arena_booking_packages'::text AS source_table,
    arena_booking_packages.id::text AS source_id, NULL::text AS slug,
    arena_booking_packages.name AS title, 'Sewa Arena / jam'::text AS subtitle,
    arena_booking_packages.description, arena_booking_packages.price_per_hour AS price,
    NULL::integer AS compare_at_price, 'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('includes_pt', arena_booking_packages.includes_pt, 'per_hour', true) AS metadata,
    COALESCE(arena_booking_packages.is_active, true) AS is_active,
    COALESCE(arena_booking_packages.sort_order, 0) AS sort_order
   FROM arena_booking_packages
UNION ALL
 SELECT md5('clinic_services:'::text || clinic_services.id::text)::uuid AS id,
    'service'::text AS kind, 'clinic_services'::text AS source_table,
    clinic_services.id::text AS source_id, NULL::text AS slug,
    clinic_services.name::text AS title, clinic_services.service_group::text AS subtitle,
    clinic_services.description, clinic_services.price, NULL::integer AS compare_at_price,
    'IDR'::text AS currency, NULL::text AS cover_url,
    jsonb_build_object('code', clinic_services.code, 'category', clinic_services.category, 'service_group', clinic_services.service_group, 'duration_minutes', clinic_services.duration_minutes, 'requires_doctor', clinic_services.requires_doctor, 'is_online_bookable', clinic_services.is_online_bookable, 'package_category', clinic_services.package_category) AS metadata,
    COALESCE(clinic_services.is_active, true) AS is_active,
    COALESCE(clinic_services.sort_order, 0) AS sort_order
   FROM clinic_services
UNION ALL
 SELECT md5('my20fit_ticket_events:'::text || my20fit_ticket_events.id::text)::uuid AS id,
    'ticket'::text AS kind, 'my20fit_ticket_events'::text AS source_table,
    my20fit_ticket_events.id::text AS source_id, my20fit_ticket_events.slug,
    my20fit_ticket_events.name AS title, my20fit_ticket_events.subtitle, NULL::text AS description,
    my20fit_ticket_events.price_from AS price, NULL::integer AS compare_at_price,
    COALESCE(my20fit_ticket_events.currency, 'IDR'::text) AS currency, my20fit_ticket_events.cover_url,
    jsonb_build_object('organizer', my20fit_ticket_events.organizer, 'venue', my20fit_ticket_events.venue, 'city', my20fit_ticket_events.city, 'category', my20fit_ticket_events.category, 'starts_at', my20fit_ticket_events.starts_at, 'status', my20fit_ticket_events.status) AS metadata,
    my20fit_ticket_events.status = 'on_sale'::text AND my20fit_ticket_events.published_at IS NOT NULL AS is_active,
    COALESCE(my20fit_ticket_events.sort_order, 0) AS sort_order
   FROM my20fit_ticket_events;
