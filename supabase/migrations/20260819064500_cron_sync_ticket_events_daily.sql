-- ============================================================
-- 20260819064500_cron_sync_ticket_events_daily
-- Jadwal harian (pg_cron) 04:00 WIB = 21:00 UTC memanggil edge function sync-ticket-events
-- via pg_net. Menggantikan GitHub Action lama (dihapus). Idempoten: unschedule dulu bila ada.
--
-- CATATAN: Authorization memakai ANON key project (publishable). Di repo ditulis sebagai
-- placeholder <SUPABASE_ANON_KEY> supaya secret-scan tidak menandai token; nilai asli sudah
-- terpasang saat migration diterapkan ke cpvzwqptzcxnwzfzgrmt. Ganti placeholder dengan anon
-- key project bila menjalankan ulang di DB baru.
-- ============================================================

do $$
begin
  perform cron.unschedule('sync-ticket-events-daily')
  where exists (select 1 from cron.job where jobname = 'sync-ticket-events-daily');
end $$;

select cron.schedule('sync-ticket-events-daily', '0 21 * * *', $job$
  select net.http_post(
    url := 'https://cpvzwqptzcxnwzfzgrmt.supabase.co/functions/v1/sync-ticket-events',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer <SUPABASE_ANON_KEY>'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
$job$);
