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
- **FASE 1 (selesai, sudah di produksi):** strip **Coaches** di `classes.html` menampilkan SEMUA
  coach dari `/api/coaches` (foto + nama), non-interaktif. Sudah **digantikan** FASE 2.
- **FASE 2 (LIVE — implementasi sekarang):** strip menampilkan **HANYA coach yang punya kelas di
  jadwal yang sedang tampil**, dan **klik coach → filter jadwal ke kelasnya** (klik lagi / tombol
  "Semua coach" = lepas filter). Mekanismenya:
  - Endpoint baru **`GET /api/coaches/aliases`** (read-only) mengembalikan tiap coach + daftar
    `instructor_texts` alias-nya (join `my20fit_coach_instructor_aliases`).
  - Frontend memuat jadwal (`/api/classes/schedule?days=21`) + daftar coach+alias itu, lalu coach
    dianggap **"punya kelas"** kalau salah satu `instructor_text`-nya **muncul PERSIS** di antara
    teks `instructor` kelas yang sedang tampil. Jadi filter otomatis konsisten dengan jadwal yang
    benar-benar dilihat user, dan **real-time**: ganti venue / jadwal berubah → dihitung ulang;
    coach tanpa kelas otomatis hilang, coach yang dapat kelas otomatis muncul.
  - **Definisi "punya kelas" = ADA kelas** (mendatang, tidak dibatalkan, dalam jendela 21 hari yang
    dimuat) — bukan "masih ada kursi". Status per-kelas (penuh/closed/passed) tetap dihitung di
    `/api/coaches/:id/classes` (dipakai halaman `book-coach.html`), bukan di strip ini.

## Catatan data (per 2026-09-25, dari jadwal nyata)
- **Alias yang SUDAH ditambahkan (source arena, exact-name):** `Brian`→Coach Brian, `Elsen`→Coach
  Elsen, `Gilang`→Coach Gilang, `Andrew`→Coach Andrew, `Ista`→Ista, `YoKae`→Yokae. (Teks di jadwal
  memang persis nama itu; catatan: jadwal mengeja **"YoKae"**.)
- Alias lama yang sudah ada tetap dipakai: Calysta, Rheza, Nando, Dhani(`Dani`), plus pasangan
  (mis. `Ade x Josea`→pasangan **Josea & Ade**).
- **Nando**: belum ada kelas mendatang → **tidak tampil** sampai punya kelas (sesuai aturan; bukan bug).
- Entri **pasangan** (`Rheza & Alfarizky`, `Josea & Ade`, dst.) ikut tampil kalau teks pasangannya
  ada di jadwal. Bisa disembunyikan (hanya individu) kalau pemilik mau.
- **BELUM dipetakan (sengaja — menunggu konfirmasi pemilik, tidak ditebak):**
  - **Gym `Andro` (5 kelas), `Chynthia` (2 kelas):** tidak ada coach dengan nama itu di
    `my20fit_coaches` → tak bisa dipastikan siapa. **TANYA PEMILIK.**
  - **Co-teach `Kiki, Mae` (1) & `Asa & Mae` (1):** kalau pemilik mau **Kiki**/**Mae** ikut muncul
    saat mengajar berdua, tambahkan alias `Kiki, Mae`→Kiki, `Kiki, Mae`→Mae, `Asa & Mae`→Mae
    (konvensi co-teach→solo yang sudah dipakai coach lain). `Asa` belum ada di roster.
