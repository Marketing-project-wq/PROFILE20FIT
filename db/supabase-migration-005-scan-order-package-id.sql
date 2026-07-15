-- Migration 005: package_id pada my20fit_scan_orders
-- Tujuan: analisis "produk paling banyak dibeli" per user secara DURABLE (bukan proxy
-- credits). Sebelumnya order hanya menyimpan credits; kolom ini menautkan tiap order ke
-- product_id katalog scan (SCAN_PACKAGES di server.js: 8477=10x, 8478=50x, 8479=150x).
-- Additive + nullable -> aman, tidak merusak data lama.

alter table public.my20fit_scan_orders
  add column if not exists package_id integer;

-- Backfill order lama dari credits (10->8477, 50->8478, 150->8479). Order dengan credits
-- lain dibiarkan NULL (analisis nanti fallback ke label "<credits>x scan").
update public.my20fit_scan_orders
set package_id = case credits
  when 10  then 8477
  when 50  then 8478
  when 150 then 8479
  else package_id
end
where package_id is null and credits in (10, 50, 150);

create index if not exists my20fit_scan_orders_package_idx
  on public.my20fit_scan_orders (package_id);
