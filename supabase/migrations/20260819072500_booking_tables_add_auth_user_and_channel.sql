-- ============================================================
-- 20260819072500_booking_tables_add_auth_user_and_channel
-- Identitas booking dari my.20fit. ADDITIF — tidak menyentuh policy, baris, atau alur staf
-- yang ada (ada 249 booking klinik & 2.732 booking kelas hidup di sana).
--   auth_user_id → user my.20fit bisa melihat booking miliknya (dibaca via server, filter auth_user_id).
--   channel      → tandai booking dari my.20fit ('my20fit') supaya beda dari booking staf.
-- Penulisan booking dari my.20fit dilakukan SERVER-SIDE (service key), hanya INSERT/UPDATE baris
-- milik user itu, tanpa DELETE, dan selalu channel='my20fit'. Policy staf/admin tidak diubah.
-- Sudah diterapkan ke cpvzwqptzcxnwzfzgrmt.
-- ============================================================

alter table clinic_bookings
  add column if not exists auth_user_id uuid references auth.users(id),
  add column if not exists channel text;

alter table arena_class_bookings
  add column if not exists auth_user_id uuid references auth.users(id),
  add column if not exists channel text;
