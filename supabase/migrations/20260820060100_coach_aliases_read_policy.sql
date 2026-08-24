-- ============================================================
-- 20260820060100_coach_aliases_read_policy (TAHAP 1, tabel 2/3)
-- my20fit_coach_instructor_aliases: pemetaan teks instructor -> coach, tidak sensitif.
-- SELECT untuk anon + authenticated (semua baris). Penulisan lewat service role.
-- ============================================================
create policy coach_aliases_public_read on my20fit_coach_instructor_aliases
  for select to anon, authenticated using (true);
