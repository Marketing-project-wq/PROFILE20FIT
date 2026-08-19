-- ============================================================
-- 20260819050253_event_covers_bucket
-- Bucket publik `event-covers` untuk cover event yang disinkron server dari TICKET_API
-- (endpoint POST /api/cron/sync-event-covers). Gambar diunduh dari upstream lalu diunggah
-- ke sini (BUKAN hotlink) → cover_url di my20fit_ticket_events menunjuk ke Storage kita,
-- tahan bila CDN/URL upstream berubah. Publik supaya bisa diserve tanpa auth via
-- /storage/v1/object/public/event-covers/<slug>.<ext>. Upload dilakukan service role
-- (bypass RLS); bucket publik → objek bisa dibaca umum tanpa policy tambahan.
--
-- Sudah diterapkan ke project cpvzwqptzcxnwzfzgrmt (version 20260819050253).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-covers','event-covers', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
