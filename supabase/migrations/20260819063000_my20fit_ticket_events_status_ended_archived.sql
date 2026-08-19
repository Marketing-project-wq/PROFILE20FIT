-- ============================================================
-- 20260819063000_my20fit_ticket_events_status_ended_archived
-- Perluas status my20fit_ticket_events untuk sinkronisasi TICKET_API:
--   'ended'    → event/penjualan sudah lewat (badge ENDED di ticket.20fit.id).
--   'archived' → event hilang dari daftar TICKET_API (di-unlist upstream); disembunyikan
--                dari tampilan TAPI datanya tetap disimpan (tidak dihapus).
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt.
-- ============================================================

alter table my20fit_ticket_events drop constraint if exists my20fit_ticket_events_status_check;
alter table my20fit_ticket_events add constraint my20fit_ticket_events_status_check
  check (status = any (array['draft','on_sale','sold_out','closed','ended','archived']));
