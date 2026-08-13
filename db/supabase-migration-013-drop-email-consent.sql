-- ============================================================
--  20fit — Migration 013: DROP kolom consent email (opt-in dihapus)
--
--  Semua email non-transaksional kini dikirim langsung ke user (tanpa opt-in).
--  Opt-out tetap ada & wajib: unsubscribe + my20fit_suppression_list.
--  Kolom penjadwalan meal reminder (reminder_*_enabled/time) & unsub_token TETAP.
--
--  ⚠️ JANGAN JALANKAN OTOMATIS. Owner (zidni@20fit.id) yang review & run manual
--     di Supabase > SQL Editor SETELAH kode baru (tanpa referensi kolom ini) ter-deploy.
--     Urutan aman: deploy kode dulu → baru DROP kolom.
--
--  Namespace my20fit_. ADDITIVE-REVERSIBLE: down migration ada di bawah.
-- ============================================================

-- ---------- UP: drop 4 kolom consent ----------
alter table public.my20fit_user_comm_prefs
  drop column if exists consent_marketing,
  drop column if exists consent_meal_reminder,
  drop column if exists consent_updated_at,
  drop column if exists consent_source;

-- ============================================================
--  DOWN (rollback) — kembalikan kolom seperti Migration 006.
--  Catatan: nilai consent lama TIDAK bisa dipulihkan (data sudah hilang saat drop);
--  kolom kembali dengan default. Jalankan manual bila perlu balik:
--
--    alter table public.my20fit_user_comm_prefs
--      add column if not exists consent_marketing     boolean not null default false,
--      add column if not exists consent_meal_reminder boolean not null default false,
--      add column if not exists consent_updated_at     timestamptz,
--      add column if not exists consent_source         text;
-- ============================================================
