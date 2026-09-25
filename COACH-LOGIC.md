# COACH-LOGIC.md — Aturan tampilkan Coach di halaman Book Class

> Versi **akurat** untuk repo my.20fit.id (vanilla JS + arena-api), disesuaikan dari spec asli
> yang ditulis untuk React + tabel `booking_classes` (tabel itu **tidak ada** di repo ini).

## Sumber data (yang sebenarnya)
- **Coach**: tabel `my20fit_coaches` (dibaca via `GET /api/coaches`). Foto = kolom `photo_url`.
- **Jadwal kelas**: tabel arena-api `arena_class_schedules` / `gym_class_schedules`
  (kolom: `instructor`, `quota`, `schedule_date`, `start_time`, `is_cancelled`, `cutoff_minutes`).
  Kursi terpakai dihitung dari `arena_class_bookings` / `gym_class_bookings`.
- **Coach ↔ kelas**: via `my20fit_coach_instructor_aliases` (coach_id ↔ teks `instructor` PERSIS di jadwal),
  BUKAN kolom `coach_id` di tabel kelas. Sudah dipakai `GET /api/coaches/:id/classes`.
- **Booking**: diproses di **booking.20fit.id** (tombol Book keluar via `/book-class`).
  Kita TIDAK menulis booking / mengurangi slot di Supabase.

## Definisi "available" (padanan di repo = `selectable`)
Sebuah kelas dihitung available kalau SEMUA true (sudah dihitung server di `/api/coaches/:id/classes`):
1. `schedule_date >= hari ini` DAN belum lewat jam mulai (`passed`),
2. belum lewat cutoff (`closed`),
3. `remaining` = `quota` − booking hidup **> 0** (`full` kalau 0),
4. `is_cancelled = false`,
5. ada `instructor` (ter-mapping ke coach lewat alias).

## Fase implementasi
- **FASE 1 (sekarang, live di staging):** strip **Coaches** di `classes.html` menampilkan **SEMUA**
  coach dari `/api/coaches` (foto + nama) — **tanpa** filter ketersediaan, non-interaktif. Tujuannya
  supaya pemilik bisa mereview semua foto coach dulu.
- **FASE 2 (menunggu aba-aba pemilik):** aktifkan aturan **"coach hanya muncul kalau punya ≥1 kelas
  available"** + klik coach → filter jadwal ke kelas coach itu. Otomatis/real-time (kelas baru →
  coach muncul; kelas lewat/penuh/cancel → coach hilang). Endpoint: reuse alias + jadwal
  (`/api/coaches/:id/classes`), atau endpoint baru "active coaches".

## Catatan data (per 2026-09-25, dari jadwal nyata)
- Coach yang PUNYA kelas mendatang: **Brian, Elsen, Rheza, Gilang, Calysta, Andrew** (kelas solo),
  dan **Josea** (hanya kelas berdua `Ade x Josea`).
- **Nando**: belum ada kelas mendatang → saat FASE 2 aktif, dia **tidak** tampil sampai punya kelas
  (sesuai aturan; bukan bug).
- `my20fit_coaches` juga berisi entri **pasangan** (mis. `Rheza & Alfarizky`) untuk kelas co-teach —
  di FASE 1 ikut tampil. Bisa disembunyikan (hanya individu) kalau pemilik mau.
- Alias untuk Brian/Elsen/Gilang/Andrew/Josea **belum** diisi — akan diisi saat FASE 2 dari teks
  instruktur asli jadwal (`Brian`, `Elsen`, `Gilang`, `Andrew`, `Ade x Josea`).
