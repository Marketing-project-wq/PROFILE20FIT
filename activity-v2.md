# PRD — my.20fit.id Activity v2

Status: Draft untuk review · Versi 1.0 · 8 Okt 2026
Referensi desain: `Activity v3.dc.html` (layar 1a–1i) · Komponen body map: `BodyMap.dc.html`
Project Supabase: `cpvzwqptzcxnwzfzgrmt`

> Instruksi untuk Claude Code: dokumen ini adalah **Fase P**. Jangan menulis kode atau migration dari dokumen ini sebelum PRD di-review. Urutan kerja: **Fase P → STOP → Fase 0 (audit read-only) → STOP → Fase 1–8**, konfirmasi di tiap fase. Aturan keras ada di §0.

---

## 0. Aturan keras (berlaku di semua fase)

1. JANGAN pakai service role key. Test pakai anon/authenticated key.
2. Konfirmasi sebelum setiap migration dan sebelum menghapus komponen UI.
3. Write multi-tabel dalam satu transaksi + rollback.
4. Jangan drop tabel/kolom; tandai `deprecated`.
5. Semua angka & aturan bisnis dari DB/config (`my20fit_activity_config`), tidak hardcode.
6. Audit log untuk create/update/delete.
7. `w20fit_exercises` READ-ONLY. `w20fit_exercise_plans/items` JANGAN ditulis (milik Sport Clinic).
8. Bila data yang dibutuhkan tidak ada (pull Visbody, makro menu official, data event), STOP dan laporkan. Jangan mengarang angka atau dummy di production.

---

## 1. Masalah

- Halaman Activity sekarang terlalu banyak tombol, toggle, dan checklist harian. User tidak tahu harus melakukan apa.
- Analisa tidak konsisten antar tracker (Apple Health, Garmin, Strava, Huawei, Samsung, Mi Fitness). Olahraga yang salah label (mis. padel tercatat "Tennis") menghasilkan analisa yang salah.
- Analisa tidak menjawab pertanyaan praktis user: *habis ini makan apa*, *besok ngapain*.
- Tidak ada jembatan yang jelas ke ekosistem 20FIT (Calories, Coach Chat, Cafe, Arena).

## 2. Tujuan & non-goal

**Tujuan**
- Halaman utama maks 4 kartu, satu aksi utama per kartu.
- Setiap upload menghasilkan analisa yang konsisten dan menjawab 3+1 pertanyaan (§4).
- Analisa tetap jalan untuk semua tracker dengan data minimal (durasi + kalori).
- Menghubungkan user ke Calories, Coach Chat, dan latihan pelengkap dengan konteks yang terisi otomatis.

**Non-goal (eksplisit)**
- Tracking tidur dan minum dalam bentuk apa pun (input, check-in, pengingat, label, field).
- Arahan medis, diagnosis, atau rujukan ke Sport Clinic.
- Form input harian atau checklist.
- Menampilkan data user lain (kecuali Fase 8 opt-in, anonim, agregat).

## 3. Pengguna

| Persona | Data yang biasanya dimiliki | Harapan dari analisa |
|---|---|---|
| (a) Pemula tanpa wearable | Durasi saja (screenshot app/ketik manual), kadang rasa berat | Tahu sudah cukup atau belum, makan apa, besok ngapain. Tanpa istilah teknis. |
| (b) Pemain rutin raket/tim (padel, tennis, badminton, basket, futsal) | Durasi, kalori, HR; kadang steps/jarak | Frekuensi main aman atau tidak, sisi tubuh yang tertinggal, isi ulang setelah main, booking jam kebiasaan. |
| (c) Atlet endurance (lari, sepeda, renang) | Durasi, jarak, pace, HR, elevasi; renang: lap, SWOLF | Tren pace & efisiensi, volume mingguan aman, target long run, km sepatu. |
| (d) Peserta HYROX/hybrid | Durasi, kalori, HR; hasil resmi (total + split 8 station) | Station terlemah, rasio lari vs station, latihan sesuai station, isi ulang & jeda. |
| (e) Mind-body (yoga, pilates) | Durasi, kadang HR & kalori rendah | Konsistensi & streak, keseimbangan dengan kekuatan sesuai goal. Tidak dinilai dari kalori. |

## 4. Kerangka inti: 3+1 pertanyaan

Setiap analisa menjawab, selalu dalam urutan ini:

1. **Sesiku tadi gimana?**
2. **Habis ini makan apa?** (konkret: menu)
3. **Next ngapain & kapan?**
4. **Perkembanganku di mana?** (halaman detail & kartu Tubuhmu)

Kartu Workout di halaman utama menampilkan 1 baris ringkas untuk Q1–Q3 (layar 1b).

## 5. User flow

1. **Visbody → Activity**: scan di studio → claim via `claim_token` → tarik komposisi → `/activity?scan=<id>` → kartu hasil scan sekali (layar 1g) → CTA "Ngobrol dengan Coach".
2. **Upload** (layar 1d): pilih file → extract → konfirmasi olahraga 1 tap → "Seberapa berat rasanya?" (1–10, bisa dilewati) → analisa siap → analisa lengkap (1e).
3. **Insight harian**: router (cron pagi + trigger event) mengisi kartu "Hari Ini".
4. **Activity → Calories**: CTA menu → deep link `calories.20fit.id` via SSO dengan target & filter terisi.
5. **Activity → Coach Chat** (layar 1f): dari insight atau tombol mengambang, pertanyaan terisi dari insight → coach mengusulkan kartu aksi → user tap → aksi dijalankan.
6. **Playlist & program**: dari link "Latihan & playlist" (sekunder) atau "Simpan jadi playlist" di analisa.
7. **Story card** (layar 1i): dari "Bagikan ke story" di analisa lengkap atau rekap.
8. **Rekap mingguan** (layar 1h): cron Minggu malam → tombol "Lihat rekap minggu ini" di kartu Minggu Ini.

## 6. Spesifikasi halaman

### 6.1 Halaman utama `/activity` (layar 1a, 1b, 1c)

Urutan tetap. Tanpa toggle/switch.

| # | Elemen | Isi | Aksi utama | Empty state |
|---|---|---|---|---|
| H | Header | Tanggal, sapaan, chip kesiapan (🟢 Siap / 🟡 Sedang / 🔴 Perlu pulih) | — | Chip disembunyikan bila sesi < baseline (config, default 3) |
| 1 | Hari Ini | 1 insight utama (judul, 1–2 kalimat, 1 tombol, link "Tanya Coach", label "Berdasarkan") + maks 2 baris pendukung; next_target open tampil di sini | Sesuai `action` insight | "Ceritakan goal-mu ke Coach" → Coach Chat |
| 2 | Workout | Belum upload: tombol besar "Upload workout hari ini". Sudah upload: 3 baris (Sesimu · Makan apa · Next) | "Lihat analisa lengkap" | Tombol upload + daftar app yang didukung |
| 3 | Minggu Ini | Body map mingguan (otot terpakai menyala, jarang pudar), total menit, sesi vs target ritme, progress program. Link "Latihan & playlist". Minggu malam: "Lihat rekap minggu ini" | — | "Belum ada sesi" + body map kosong |
| 4 | Tubuhmu | Visbody 3 angka (berat, otot, lemak %) + delta; perkembangan goal bila ≥2 scan | "Lihat detail scan" | CTA "Scan Visbody" |
| F | Tombol mengambang | "Tanya Coach" — konteks otomatis terkirim | — | — |

### 6.2 Analisa lengkap `/activity/upload/<id>` (layar 1e)

Urutan tetap; bagian tanpa data **disembunyikan**.

1. **Sesimu tadi**: banner target (✓ tercapai / diulang ringan) atau "Baseline dimulai ●○○"; 3 angka utama; perbandingan; blok khusus keluarga (mis. split HYROX, per hari untuk trip ski); body map sesi; 1 poin baik + maks 2 poin improve; "Berdasarkan".
2. **Makan apa**: kebutuhan energi hari ini (bar: dasar + aktivitas + workout), isi ulang protein & karbo, protein harian, 3 menu official (+1 Cafe bila relevan), foto makanan opsional.
3. **Next: kapan & latih apa**: hari ideal sesi berikutnya, chip kesiapan + alasan, latihan pelengkap 2–3 gerakan (▶ Cara gerak, Simpan jadi playlist [sekunder], Tanya Coach), warm-up 5–10 mnt, target sesi berikutnya.
4. **Perkembanganmu**: goal (tren Visbody + ETA estimasi), ritme & streak, level per olahraga + alasan, volume mingguan, perlengkapan (km sepatu), 1 artikel.
5. **Lanjutkan di 20FIT** (opsional): maks 1 CTA ekosistem, bisa disembunyikan.
Tombol "Bagikan ke story" di bawah.

### 6.3 Upload pertama

- Q1 tanpa perbandingan; diganti acuan umum (rekomendasi mingguan, intensitas dari HR max estimasi umur, durasi tipikal `sport_profile`, kalori vs BMR) + "Baseline dimulai ●○○".
- Kesiapan disembunyikan.
- Tidak ada CTA ekosistem.
- CTA ringan "Ceritakan goal-mu ke Coach" (hanya bila belum punya program).

### 6.4 Hasil scan `/activity?scan=<id>` (layar 1g)

Tampil sekali (`viewed_at`). 3 angka + delta vs scan sebelumnya, body map segmental, 1 kalimat interpretasi, CTA tunggal "Ngobrol dengan Coach".

### 6.5 Rekap mingguan (layar 1h) & Story card (layar 1i)

Lihat §15 (Fase 7).

## 7. Spesifikasi analisa

### 7.1 Tingkat data

- **Inti (wajib, cukup untuk analisa)**: `activity_type`, `date`, `start_time`, `duration_min`, kalori (atau diestimasi).
- **Penajam (opsional)**: HR avg/max, jarak, pace/kecepatan, elevasi, metrik olahraga (lap, SWOLF, descent, jumlah run, splits HYROX), rasa berat (RPE), venue, Visbody, `ct_meal`.
- Field tidur di file upload **di-ignore**.

### 7.2 Normalisasi kalori

- Dari tracker → dinormalisasi ke **kalori aktif**. Bila `kcal_type='total'`: aktif = total − (BMR × durasi_jam / 24).
- Tanpa angka kalori → MET × berat_kg × jam, `kcal_type='estimated'`. MET dipilih light/moderate/vigorous dari RPE atau zona HR; default moderate.
- Berat: Visbody terakhir > profil.
- Kebutuhan harian = BMR (Visbody > rumus Mifflin-St Jeor dari profil) × `activity_factor` + kalori aktif workout hari itu.
- Kalori/menit dipakai sebagai proxy intensitas **hanya** bila `kcal_type ≠ 'estimated'`.
- `ct_meal` opsional: ada untuk hari itu → aktifkan analisa selisih energi & jeda makan sebelum sesi. Tidak ada → **jangan dianggap 0**, bagian disembunyikan.

### 7.3 Katalog analisa

| ID | Nama | Q | Data minimal | Aturan (key config) | Disembunyikan bila | Contoh copy |
|---|---|---|---|---|---|---|
| A1 | Ringkasan sesi | Q1 | durasi | — | — | "Padel 64 mnt, ±410 kkal aktif." |
| A2 | Vs rata-rata sport_key | Q1 | ≥`baseline_sessions` sesi sport sama | rata-rata durasi/HR/kalori | < baseline | "vs rata-rata padel-mu: +8 mnt, HR −4 bpm." |
| A3 | Intensitas zona HR | Q1 | HR avg + umur | `hr_zones` (% HRmax, HRmax=220−umur) | tanpa HR | "HR 141 ≈ 74% HR maks → sedang." |
| A4 | Tren & efisiensi | Q1 | ≥3 sesi dengan pace/metrik | pace sama ±`pace_tolerance`, HR turun | tanpa metrik | "Pace sama, HR turun 6 bpm — makin efisien." |
| A6 | Otot paling kena | Q1 | sport_key + durasi | §7.13 | sport `other` tanpa riwayat | "1 Bahu kanan · 2 Lengan bawah kanan · 3 Betis" |
| A5 | Rekor & milestone | Q1 | riwayat sport sama | `milestone_thresholds` | tidak ada rekor | "Jarak terjauh 9,8 km dalam satu match." |
| B1 | Energi hari ini | Q2 | durasi + berat | §7.2 | — | "±2.350 kkal: dasar 1.380 + aktivitas 560 + padel 410." |
| B2 | Isi ulang | Q2 | durasi + kalori aktif + berat + goal | `refuel_protein_g_per_kg`, `carb_scale_by_duration`, `refuel_profile` keluarga | mind_body | "Targetkan ±28 g protein & ±65 g karbo dalam 2 jam." |
| B3 | Protein harian | Q2 | berat + goal | `protein_g_per_kg[goal]` | — | "Protein harian ±110 g (goal tambah otot)." |
| B4 | Menu | Q2 | B2/B3 | §7.5 | katalog tanpa makro → STOP | 3 menu + 1 Cafe |
| B5 | Selisih energi & jeda makan | Q2 | ct_meal hari itu dengan jam makan valid | — | tanpa ct_meal | "Kamu makan 1,5 jam sebelum main." |
| C1 | Kesiapan | Q3 | ≥ baseline sesi | §7.7 | < baseline | "Sedang · 3 hari berturut-turut." |
| C2 | Hari ideal berikutnya | Q3 | riwayat jam/hari + jam pulih | `muscle_recovery_hours` | — | "Jumat 19.00 — jam main kebiasaanmu." |
| C3 | Latihan pelengkap | Q3 | riwayat 14 hari | §7.6 | 🔴 → hanya mobilitas atau tanpa | 2–3 gerakan |
| C4 | Warm-up | Q3 | sport_key | `exercise_pattern.is_warmup` | keluarga tanpa warm-up khusus | "Warm-up sebelum main ±8 mnt." |
| C5 | Target sesi berikutnya | Q3 | analisa | §7.8 | — | "Makan karbo ±40 g, 1–2 jam sebelum main." |
| C6 | Langkah ekosistem | Q3 | sumber data tersedia | §7.11 | tanpa data / cap tercapai / upload pertama | "Jumat 19.00 masih tersedia." |
| D1 | Perkembangan goal | Q4 | ≥2 scan Visbody | regresi linear, label estimasi | < 2 scan | "+0,3 kg otot / 4 minggu · ±10 minggu ke 25 kg." |
| D2 | Ritme & konsistensi | Q4 | ≥1 minggu | `weekly_session_target` | — | "4 dari 4 sesi · streak 3 minggu." |
| D3 | Level olahraga | Q4 | riwayat sport | §7.9 | < baseline | "Level padel 2 → 3." |
| D4 | Volume mingguan | Q4 | 7 hari | `weekly_minutes_moderate` 150–300, `weekly_minutes_vigorous` 75–150 | — | "186 mnt — di atas rekomendasi 150 mnt." |
| D5 | Perlengkapan | Q4 | `uses_shoes` + gear aktif | `shoe_km_limit` | tanpa gear | "Sepatu 640/700 km." |
| D6 | Artikel | Q4 | sport/topik | `nutrition_articles`, `my20fit_recipe_article` | tidak ada yang relevan | 1 link |
| E1 | Kaitan Visbody | Q1/Q3 | scan segmental | imbalance > `segmental_imbalance_pct` | tanpa scan | "Lengan kanan ±6% lebih besar dari kiri." |
| E2 | Saran scan ulang | Q4 | scan terakhir | ≥`rescan_weeks` minggu atau ≥`rescan_sessions` sesi | — | "Sudah 6 minggu sejak scan terakhir." |

Batas: maks 1 poin `good`, maks 2 poin `improve` (`max_improve_points`), maks 3 insight per hari (`max_insights_per_day`).

### 7.4 Per keluarga olahraga

Analisa inti (A–D) berlaku untuk **semua** olahraga. Aturan keluarga hanya menambah konteks dan memilih fokus pelengkap. Metrik yang tidak ada → bagian itu dilewati.

| Keluarga | Sport key | Analisa khusus | Pelengkap | Isi ulang | Istilah |
|---|---|---|---|---|---|
| racket_court | padel, tennis, badminton, pickleball, squash, table_tennis | Intensitas & durasi vs sebelumnya; frekuensi main minggu ini; dominasi satu sisi (`is_unilateral`) | Stabilitas bahu & rotator cuff, forearm/grip, rotasi & anti-rotasi core, kelincahan lateral, sisi non-dominan | Sesi > 90 mnt → karbo lebih tinggi | "main", "sesi padel" |
| team_court_field | basketball, futsal, football, mini_soccer, volleyball | Beban intermiten & berat; frekuensi match; jeda setelah match | Plyometric & landing control, stabilitas ankle & lutut, hamstring (Nordic/hinge), core | Match → karbo tinggi + protein | "main", "match", "game" |
| endurance | run, run_treadmill, trail_run, cycling, indoor_cycling, swim_pool, swim_open_water, rowing, walk, hiking | Tren pace/kecepatan; efisiensi; volume jarak mingguan vs 4 minggu (naik > `endurance_volume_jump_pct` → kesiapan turun); long session; renang: lap, SWOLF, gaya | Lari/hiking: glutes, calves, single-leg; sepeda: posterior chain, mobilitas pinggul; renang: lats, rear delts, mobilitas bahu; rowing: hinge & pull | Sesuai durasi | "lari", "long run", "ride" |
| hybrid_conditioning | hyrox, crossfit, hiit, bootcamp, circuit | Beban sangat tinggi → jeda & isi ulang prioritas. HYROX dengan hasil resmi: split lari & 8 station, station terlemah vs rata-rata, rasio lari vs station, vs race/simulasi sebelumnya | Sesuai station terlemah: sled → leg drive & pull; wall ball → squat + push vertikal; farmers carry → grip & carry; burpee broad jump/lunges → power & single-leg. Tanpa splits → pola gerak kurang 14 hari | Karbo + protein tinggi; sebelum race → karbo lebih awal | "race", "simulasi" |
| strength | strength, functional, calisthenics | Volume (reps × kg) & record dari set_log; pola gerak tertinggal; frekuensi per kelompok otot | Pola gerak kurang (pull vs push, hinge vs squat), unilateral | Protein fokus utama | "sesi", "latihan" |
| combat | boxing, muay_thai, kickboxing, martial_arts | Intensitas & durasi; frekuensi; beban bahu (pukulan) & pinggul (tendangan) | Rotator cuff & rear delts, mobilitas pinggul, core anti-rotasi, upper back | Sesuai durasi | "sesi" |
| mind_body | yoga, pilates, stretching, barre | Konsistensi & streak; menit mingguan; kontribusi ke keseimbangan jenis latihan. **Jangan menilai dari kalori** | Sesuai goal (tambah otot → kekuatan; pelari → mobilitas lari) | Tidak ada isi ulang khusus; kebutuhan harian saja | "sesi" |
| outdoor_skill | ski, snowboard, surfing, climbing, golf | Ski: descent, jumlah run, max speed, beban kaki multi-hari. ≥2 hari berturut-turut sport sama → **ringkasan per trip**. Climbing: grip & tarikan. Surfing: bahu. Golf: rotasi satu sisi | Ski/snowboard: quads eccentric, stabilitas lutut, balance; climbing: push antagonis, forearm extensor; surfing: rear delts, thoracic; golf: anti-rotasi, sisi non-dominan | Sesuai beban trip | "trip", "run" |
| dance_fun | dance, zumba, aerobics | Durasi, intensitas, konsistensi | Kekuatan bawah & core | Sesuai durasi | "sesi", "kelas" |
| other | fallback | Analisa inti + keseimbangan dari riwayat | Dari riwayat 14 hari | Sesuai durasi | Label: "Analisa umum karena jenis olahraga belum dikenali" |

#### Contoh kartu lengkap

Format per contoh: **Q1 / Q2 / Q3 / Q4 / Ekosistem**. Semua angka ilustrasi.

**Padel** (racket_court, Apple Watch "Tennis" → dikoreksi, sesi ke-6, 20FIT Arena)
- Q1: 64 mnt · ±410 kkal aktif · HR 141. vs rata-rata padel-mu +8 mnt, HR −4 bpm. Main 3× minggu ini, sisi kanan dominan. + Durasi stabil 3 sesi. ↑ Sisi kiri jarang dilatih. ↑ Jeda 1 hari sebelum main lagi.
- Q2: ±2.350 kkal hari ini. Isi ulang ±28 g protein, ±65 g karbo dalam 2 jam. 3 menu official + 1 menu Cafe (sesi di Arena, nutrisi terverifikasi).
- Q3: 🟡 Sedang. Ideal Jumat 19.00. Pelengkap: Single-arm Row (kiri dulu), Pallof Press, Band External Rotation · ±18 mnt. Warm-up: arm circle, lunge + rotasi, lateral shuffle, band pull-apart. Target: karbo ±40 g, 1–2 jam sebelum main.
- Q4: Goal tambah otot +0,3 kg / 4 minggu. Ritme 4/4. Level padel 2 → 3.
- Ekosistem: Booking court Jumat 19.00.

**Badminton** (racket_court, Mi Fitness "Badminton")
- Q1: 75 mnt · ±480 kkal · HR 146. Main 2× minggu ini. + Intensitas tinggi stabil. ↑ Bahu kanan & pergelangan menanggung beban.
- Q2: Isi ulang ±25 g protein, ±70 g karbo. 3 menu.
- Q3: 🟢 Siap. Pelengkap: rotator cuff (sisi non-dominan), wrist extensor, lateral lunge. Target: tambah 1 sesi pelengkap 15 mnt.
- Q4: Ritme 2/3. Level badminton 2.
- Ekosistem: tidak ada (tidak ada data event).

**Basketball** (team_court_field, game ke-3 berturut-turut)
- Q1: 48 mnt · ±520 kkal · HR 158 (+7 dari game pertama). ↑ 3 game tanpa jeda. ↑ Landing control jarang dilatih.
- Q2: Karbo tinggi + protein: ±30 g P, ±85 g karbo.
- Q3: 🔴 Perlu pulih. Hari ini mobilitas saja. Mulai Rabu: Drop Landing, Single-leg Calf Raise, Nordic Hamstring. Target: maks 2 game berturut-turut, lalu 1 hari jeda.
- Q4: Ritme terlalu rapat. Level tetap 2.
- Ekosistem: tidak ada (kesiapan 🔴).

**Football** (team_court_field, Garmin dengan jarak)
- Q1: 90 mnt · 9,8 km · ±780 kkal. **Milestone: jarak terjauh.** ↑ Hamstring jarang dilatih.
- Q2: ±32 g P, ±110 g karbo dalam 2 jam.
- Q3: 🟡. Kamis latihan ringan. Pelengkap: Nordic Hamstring, Copenhagen Plank, Box Jump. Target: jarak 9+ km di match berikutnya.
- Q4: Ritme 1 match/minggu, streak 4 minggu.
- Ekosistem: booking mini soccer Sabtu 16.00 (jam kebiasaan).

**Yoga** (mind_body, hanya durasi, upload pertama, tanpa ct_meal)
- Q1: 60 mnt. Baseline dimulai ●○○. Kalori ±110 (estimated) — **tidak dipakai untuk penilaian**. + Sesi 60 mnt memenuhi target mobilitas.
- Q2: Tidak ada isi ulang khusus. Kebutuhan harian ±2.050 kkal, protein ±110 g. 3 menu tetap muncul.
- Q3: Kesiapan disembunyikan. Pelengkap sesuai goal tambah otot: Goblet Squat, Push-up, Dumbbell Row. Target: 1 sesi kekuatan ±25 mnt minggu ini.
- Q4: Ritme 1 sesi. CTA "Ceritakan goal-mu ke Coach".

**Pilates** (mind_body, sesi ke-8)
- Q1: 50 mnt. Streak 4 minggu, 2×/minggu. + Konsisten. ↑ Kardio 0 mnt minggu ini.
- Q2: Kebutuhan harian saja.
- Q3: 🟢. Pelengkap sesuai goal turun lemak: jalan cepat 30 mnt 2×. Target: 60 mnt kardio minggu ini.
- Q4: Keseimbangan jenis latihan: mobilitas 100 / kekuatan 0 / kardio 0.

**Skiing** (outdoor_skill, 3 hari berturut-turut → trip)
- Q1: Ringkasan trip: 3 hari · 8.900 m descent · 41 run. Per hari: 16/14/11 run. ↑ Paha depan cepat lelah di hari ke-3.
- Q2: Karbo tinggi hari ini: ±30 g P, ±110 g karbo.
- Q3: 🔴 (beban kaki 3 hari). Hindari latihan kaki berat 2 hari. Pelengkap (mulai 4 minggu sebelum trip berikutnya): Tempo Squat, Single-leg Balance Reach, Nordic Hamstring.
- Q4: Trip pertama musim ini.

**HYROX** (hybrid_conditioning, hasil resmi dengan splits)
- Q1: 1:28:40 · −4:12 vs simulasi. Split 8 station; terlemah: Wall Balls 7:15 (36% di atas rata-rata station), Sled Push 6:40. Rasio lari : station 47 : 53.
- Q2: ±40 g P, ±120 g karbo. Beban sangat tinggi.
- Q3: 🔴. Ideal Selasa (2 hari jeda). Pelengkap: Thruster, Heavy Sled Push, Wall Ball EMOM · ±30 mnt. Target: Wall Balls < 6:30.
- Q4: Station terlemah sama seperti simulasi lalu.
- Ekosistem: Simulasi HYROX 25 Okt (bila data event ada).
- Varian: tercatat "HIIT" di Apple → wajib konfirmasi → hybrid_conditioning tanpa splits → pelengkap dari pola gerak 14 hari.

**Lari** (endurance, HR + pace, sesi ke-6, gear aktif)
- Q1: 8,2 km · 5:42/km · HR 148. Pace sama 3 minggu lalu, HR −6 bpm.
- Q2: ±25 g P, ±70 g karbo.
- Q3: 🟡 (volume +20% vs 4 minggu). Long run Sabtu. Pelengkap: Single-leg RDL, Bulgarian Split Squat, Eccentric Calf Raise. Target: long run 15 km pace 6:00, HR ≤ 150.
- Q4: Level lari 3 → 4. Sepatu 640/700 km.
- Ekosistem: 20FIT Shop (sepatu mendekati batas km).

**Other** ("Sepak takraw" → Lainnya)
- Label "Analisa umum karena jenis olahraga belum dikenali". Tercatat di `my20fit_sport_request`.
- Q1: 55 mnt · ±380 kkal (estimated, MET moderate × 62 kg × jam) · RPE 6.
- Q2: Isi ulang ±22 g P, ±50 g karbo.
- Q3: Pelengkap dari riwayat 14 hari (gerak tarik kurang).

#### Upload pertama vs sesi ke-6 (padel)

| Bagian | Upload pertama | Sesi ke-6 |
|---|---|---|
| Banner | "Baseline dimulai ●○○ — perbandingan muncul setelah 3 sesi padel." | "✓ Target tercapai — kamu makan 1,5 jam sebelum main." |
| Q1 | Acuan umum: padel 60–90 mnt; HR 141 ≈ 74% HR maks | vs rata-rata: +8 mnt, HR −4 bpm |
| Q3 kesiapan | Disembunyikan | 🟡 Sedang + 3 alasan |
| Q4 | Ritme saja | Goal, ritme, level |
| Ekosistem | Tidak ada | Booking court |
| Coach CTA | "Ceritakan goal-mu ke Coach" (bila belum ada program) | Link "Tanya Coach" biasa |

### 7.5 Logika menu

1. Sumber: katalog official Calories (lokasi ditentukan Fase 0) + `cf_menu_nutrition` dengan `verified_at` tidak null.
2. Filter tipe diet user (`halal`, `high-protein`, `low-carb`, `normal`, `pescatarian`, `vegan`, `vegetarian`).
3. Skor = kedekatan protein & karbo ke target isi ulang; kalori dalam `menu_kcal_window`.
4. Prioritaskan `my20fit_menu_save`; kecualikan yang ditolak di `my20fit_menu_reaction`; hindari menu di `my20fit_menu_event` 3 hari terakhir.
5. Tampil 3 menu official + 1 menu Cafe **hanya bila** `venue` = 20FIT Arena dan nutrisi terverifikasi.
6. CTA: "Lihat resep" (deep link `calories.20fit.id` via SSO) / "Pesan" (20FIT Cafe).
7. Katalog official tanpa makro → STOP bagian menu & laporkan.
8. Opsional sekali per upload: "Foto makanan setelah olahraga?" → pipeline foto `ct_meal` yang sudah ada. Bisa dilewati.

### 7.6 Keseimbangan & latihan pelengkap

- Jendela 14 hari: pola gerak (`sport_profile.movement_patterns` + `exercise_pattern` dari set_log), depan vs belakang & atas vs bawah (`muscle_keys`), kiri vs kanan (`is_unilateral` + segmental Visbody), jenis latihan (menit cardio/kekuatan/mobilitas vs `training_mix_target[goal]`).
- Ambil kekurangan terbesar → 2–3 gerakan dari `w20fit_exercises` via `muscle_map` & `exercise_pattern`, sesuai level & alat user. Sets/reps default dari config, estimasi menit, hari ideal (setelah otot pulih).
- Ikuti kesiapan: 🟢 kekuatan · 🟡 versi ringan/stabilitas · 🔴 hanya mobilitas atau tanpa rekomendasi.
- Tampil langsung di analisa: [▶ Cara gerak] (YouTube privacy-enhanced `youtube-nocookie.com` + `cue_teknik`) · [Simpan jadi playlist] (sekunder) · [Tanya Coach].

### 7.7 Kesiapan

Input: hari berturut-turut aktif, rasio beban kalori 7 hari vs rata-rata 28 hari, otot yang sama dipakai < `muscle_recovery_hours`, RPE vs HR (RPE tinggi + HR normal = lelah). Status dari ambang config (`readiness_thresholds`). Butuh ≥ baseline sesi. Status 🔴 → router tidak boleh mengeluarkan insight latihan berat hari itu.

### 7.8 Siklus target

1 `my20fit_next_target` per analisa (`target_type`: duration, pre_fuel, protein, rest_day, complement, metric, frequency) → tampil di kartu Hari Ini → upload berikutnya sport sama: cek → `met`/`missed` → tampil di atas analisa ("✓ Target tercapai" / target diulang dengan bahasa ringan, tanpa menghakimi).

### 7.9 Level olahraga

`my20fit_sport_level` per user per sport_key, skala 1–5. Aturan transparan dari `sport_level_rules`: frekuensi 4 minggu, durasi rata-rata, intensitas (zona HR), tren metrik. Naik/turun selalu disertai alasan 1 kalimat. Tidak ditampilkan sebelum baseline.

### 7.10 Milestone

Pakai `my20fit_coach_achievement` bila strukturnya cocok (Fase 0); bila tidak, `my20fit_milestone`. Jenis: jarak/durasi terjauh, streak, total sesi, level naik, target tercapai beruntun. Ambang dari `milestone_thresholds`.

### 7.11 Langkah ekosistem

- Kandidat: booking court/kelas di hari & jam kebiasaan (`booking_products`, `arena_class_menus`); event relevan (simulasi HYROX, turnamen padel); sesi coach manusia (stagnan / level naik); 20FIT Shop (sepatu lewat batas km).
- Maks 1 per analisa. Hanya bila relevan dengan pola user, sesuai `ecosystem_frequency_cap`, **selalu di bawah** CTA nutrisi/coach, tidak pernah jadi insight utama, tidak muncul di upload pertama atau saat 🔴.
- Catat impression, click, dismiss. Sumber data belum ada → lewati, jangan dummy.

### 7.12 Konfirmasi olahraga & olahraga tidak dikenal

- Label tracker dicocokkan ke `sport_profile.aliases` (EN & ID dari Apple Health, Garmin, Strava, Samsung Health, Huawei Health, Mi Fitness; contoh: "Racquetball/Squash", "Functional Strength Training", "Mixed Cardio", "Cross Training", "Downhill Skiing", "Outdoor Run", "Pool Swim").
- Selalu tampilkan konfirmasi 1 tap (4 olahraga paling mungkin + "Lainnya"). Label ambigu ("Other", "Mixed Cardio", "Workout") → jangan menebak.
- "Lainnya" → user ketik nama → family `other` (MET moderate) + upsert `my20fit_sport_request`.
- Koreksi user disimpan sebagai alias kandidat per user (label sama di sesi berikutnya langsung terpilih).

### 7.13 Otot paling kena (semua olahraga, termasuk game)

Berlaku untuk olahraga berbentuk game/match (padel, basket, sepak bola, dll) yang tidak punya data per gerakan. Hasil berupa **estimasi**, selalu diberi label "Estimasi".

1. **Bobot dasar**: `my20fit_sport_profile.muscle_weights` (jsonb, kolom baru) — bobot 0–1 per 19 muscle key untuk tiap sport_key. Contoh padel: front_delts 0.9, forearms 0.85, calves 0.75, quads 0.7, obliques 0.6. Draft bobot dikonfirmasi di Fase 1 bersama seed MET.
2. **Pengali sesi**:
   - Durasi: durasi / `typical_duration_min` (dibatasi `impact_duration_cap`).
   - Intensitas: zona HR → pengali dari `impact_intensity_factor`; tanpa HR → RPE; tanpa keduanya → moderate.
   - Sisi dominan: bila `is_unilateral`, otot atas sisi dominan × `impact_dominant_factor`, sisi lain dikurangi. Sisi dominan dari profil user (tangan dominan, input sekali, opsional) atau segmental Visbody; tanpa data → tidak dibagi kiri/kanan.
   - Metrik penajam bila ada: jarak (lari/sepak bola) menaikkan kaki; splits HYROX memakai bobot per station; descent ski menaikkan quads; set_log (strength) memakai volume nyata per exercise_pattern (bukan estimasi).
   - Beban beruntun: otot yang sama dipakai dalam < `muscle_recovery_hours` → skor ditambah sisa beban sebelumnya (dipakai juga oleh Kesiapan §7.7).
3. **Output**: skor 0–100 per muscle key → top 5 ditampilkan berurutan dengan bar + estimasi jam pulih (`muscle_recovery_hours` × pengali intensitas). Body map sesi menyala sesuai skor (≥80 menyala penuh, 60–79 sedang, < 60 pudar).
4. **Dipakai ulang oleh**: Kesiapan (§7.7), Latihan pelengkap (§7.6 — hindari melatih berat otot yang skornya tinggi dan belum pulih), body map mingguan (akumulasi 7 hari), story card ("Fokus hari ini" = otot skor tertinggi).
5. Disimpan di `analysis.q1_session.muscle_impact: [{ muscle_key, score, side|null, recovery_h }]`; `muscles_worked` = key dengan skor ≥ `impact_min_score`.
6. Sport `other` tanpa riwayat → bagian disembunyikan.
7. Copy: "Otot paling kena" + "Estimasi dari pola gerak <istilah olahraga> × durasi × intensitas". Jangan menyebut "cedera" atau "nyeri".

## 8. Router & Coach Chat

### 8.1 Konteks

RPC `get_user_context(auth_user_id)`: profil, goal, `consent_health`, Visbody terakhir + delta, workout 14 hari, kesiapan, keseimbangan, level, program aktif, next_target open, insight aktif, ct_meal bila ada. Dipakai router, kartu Activity, AI coach, dan calories.20fit.id. `consent_health=false` → data Visbody/kesehatan tidak dikirim ke model; ganti dengan CTA minta consent.

### 8.2 Router

- Trigger: `workout_upload`, `visbody_scan`, `meal_logged`, `playlist_done`, cron pagi, cron Minggu malam.
- Skor domain (bobot dari config) → 1 insight utama + maks 2 pendukung; expire insight lama yang duplikat.

| Domain | Aksi | Catatan |
|---|---|---|
| nutrition | `open_calories` (target + filter menu terisi) | |
| recovery | hari ringan (mobilitas pendek / jeda) | Bila utama → tidak ada insight latihan berat hari itu |
| training | latihan pelengkap | |
| progress | milestone / level / goal | |
| ecosystem | booking / event / shop | Maks 1, tidak pernah utama |
| coach | `ask_coach` | Lihat 8.3 |

### 8.3 Kartu utama menjadi "Ngobrol dengan Coach" bila

Scan pertama tanpa program · stagnan ≥3 minggu · goal tidak sejalan dengan pola latihan · 3× mengabaikan rekomendasi yang sama · sinyal tidak wajar (HR/pola beban ekstrem → hari ringan + coach, **bukan medis**).

### 8.4 Coach Chat

- Setiap pesan menyertakan `get_user_context` + insight pemicu. Dibuka dari insight dengan pertanyaan terisi (contoh: "Minggu ini aku padel 5x tanpa jeda, perlu dikurangi?").
- Coach tidak boleh menetapkan angka berbeda dari snapshot tanpa melalui action.
- Coach (Angie, Tom, Ben, Stella) masing-masing punya spesialisasi; ditampilkan di header chat.

### 8.5 Kartu aksi coach

Structured output → `my20fit_coach_action` (`proposed`) → kartu di chat:
- **Terapkan target makan** → `my20fit_coach_meal_plan` → tampil di calories.20fit.id.
- **Simpan latihan / playlist** → `my20fit_playlist`.
- **Jadikan program** → `my20fit_workout_plan` (`source='coach_chat'`, hanya satu `is_active`).

Jalan hanya setelah user tap, lewat fungsi yang sama dengan Activity. Catat `my20fit_coach_cta_event`, re-run router. Ditolak → tidak diusulkan ulang di sesi itu.

## 9. Pedoman copy

- Bahasa Indonesia santai. Maks 2 kalimat per poin. Angka dibulatkan; estimasi pakai "±".
- Istilah mengikuti olahraga: "main" (padel/raket/tim), "race/simulasi" (HYROX), "trip" (ski), "sesi" (yoga/pilates), "lari", "match".
- Setiap insight punya "Berdasarkan: …" yang menyebut sumber data.
- Target diulang dengan bahasa ringan: "Coba lagi minggu ini" — bukan "Kamu gagal".
- **Larangan**: menghakimi, angka palsu/tanpa sumber, klaim medis atau diagnosis, kata "cedera pasti", rujukan Sport Clinic, kata atau label terkait tidur & minum.
- Satu bahasa per tampilan — jangan campur Indonesia dan Inggris dalam satu layar.

## 10. Model data (ringkas)

Detail kolom ada di Fase 1 prompt build. Ringkasan:

| Tabel | Jenis | Isi |
|---|---|---|
| `my20fit_activity_config` | referensi | Semua angka & aturan (key/value jsonb) |
| `my20fit_sport_family` | referensi | 10 keluarga + `analysis_rules`, `complement_focus`, `refuel_profile`, `vocab` |
| `my20fit_sport_profile` | referensi | ±46 sport_key + aliases, MET (light/moderate/vigorous, `met_source`), muscle_keys, `muscle_weights` (jsonb), movement_patterns, `is_unilateral`, `uses_shoes` |
| `my20fit_sport_request` | admin | Olahraga tidak dikenal |
| `my20fit_muscle_map` | referensi | `otot_target` mentah → 19 key kanonik |
| `my20fit_exercise_pattern` | referensi | Pola gerak per exercise, `is_warmup` |
| `cf_menu_nutrition` | referensi | Makro menu Cafe (hanya verified yang dipakai) |
| `my20fit_activity_uploads` + kolom | user | `analysis`, `rpe`, `kcal_type`, `sport_key`, `sport_confirmed`, `venue` |
| `my20fit_insight` | user | Insight harian dari router |
| `my20fit_next_target` | user | Siklus target |
| `my20fit_sport_level` | user | Level per olahraga |
| `my20fit_milestone` / `my20fit_coach_achievement` | user | Milestone |
| `my20fit_gear` | user | Sepatu (opsional) |
| `my20fit_weekly_recap` | user | Rekap mingguan |
| `my20fit_playlist`, `my20fit_playlist_item` | user | Playlist |
| `my20fit_coach_action` + kolom di chat_session & cta_event | user | Kartu aksi coach |

Kolom deprecated (jangan dipakai): `my20fit_today_plans.sleep_plan`, `hydration_plan`, `sleep_logged`, `hydration_logged`. `my20fit_daily_plan` tidak dipakai.

**RLS**: tabel user → owner-only (`auth.uid() = auth_user_id`; item via join). Tabel referensi → select authenticated. Insert insight/next_target/coach_action/analysis/level/milestone/recap hanya dari server (RPC security definer + cek `auth.uid()`).

**Output `analysis` (jsonb)**:
```json
{
  "sport_key": "", "family_key": "", "data_basis": [], "kcal_type": "", "baseline_sessions": 0, "is_first_session": false,
  "q1_session": { "duration_min": 0, "kcal_active": 0, "muscle_impact": [{ "muscle_key": "", "score": 0, "side": null, "recovery_h": 0 }], "vs_baseline": {}, "optional_metrics": {}, "records": [], "milestone": null },
  "q2_fuel": { "daily_need_kcal": 0, "breakdown": {}, "refuel": { "protein_g": 0, "carbs_g": 0 }, "daily_protein_g": 0, "intake_gap": null,
               "menus": [{ "source": "", "menu_id": "", "name": "", "kcal": 0, "protein_g": 0, "reason": "" }] },
  "q3_next": { "readiness": { "status": "", "reasons": [] }, "next_session_day": "", "balance": { "gap_type": "", "explanation": "", "exercises": [], "est_min": 0 },
               "warmup": { "exercises": [], "est_min": 0 }, "next_target_id": "", "ecosystem": null },
  "q4_progress": { "goal": null, "rhythm": {}, "sport_level": null, "gear": null, "article_id": null },
  "good": [], "improve": [{ "domain": "", "text": "", "action": {} }], "muscles_worked": [], "confidence": 0
}
```

## 11. Metrik sukses & event

| Metrik | Definisi | Event |
|---|---|---|
| Upload rate | upload / user aktif / minggu | `activity_upload_completed` |
| Buka detail | % analisa yang dibuka halaman lengkap | `analysis_opened` |
| CTR Calories | klik CTA menu / tampil | `cta_calories_click` |
| CTR Tanya Coach | klik / tampil | `cta_coach_click` |
| Aksi coach diterima | accepted / proposed | `coach_action_decided` |
| Target tercapai | % next_target `met` | `next_target_checked` |
| Retensi | D7 / D30 user yang upload | — |
| Ekosistem | CTR & dismiss rate | `eco_impression`, `eco_click`, `eco_dismiss` |
| Konfirmasi olahraga | % koreksi dari label tracker | `sport_confirmed` |

## 12. Rollout

- Feature flag per fase: `activity_v2_home`, `activity_v2_analysis`, `activity_v2_router`, `activity_v2_coach_actions`, `activity_v2_story`, `activity_v2_recap`, `activity_v2_community` (default OFF).
- Migrasi dari Activity lama: inventaris Fase 0 → tiap komponen KEEP / MERGE / REMOVE dengan konfirmasi. Data lama tetap terbaca; analisa ulang upload 14 hari terakhir saat flag aktif (backfill via RPC server).
- Rilis bertahap: internal → 10% → 50% → 100%, pantau metrik §11.

## 13. Open questions

1. Siapa validator nutrisi menu 20FIT Cafe (`cf_menu_nutrition.verified_by`)?
2. Apakah akses pull data komposisi Visbody (endpoint + credential) sudah tersedia? `raw_webhook` tidak berisi komposisi.
3. Apakah katalog menu official Calories punya protein/karbo/lemak per menu? Di mana lokasinya?
4. Sumber data event/kelas/turnamen untuk CTA ekosistem — tabel mana, siapa yang mengisi?
5. Apakah booking menyimpan venue per sesi (untuk deteksi "main di 20FIT Arena")?
6. Apakah `ct_meal` menyimpan jam makan sebenarnya atau hanya `created_at`?
7. Join `my20fit_coach_chat_session.coach_id` (TEXT) vs `my20fit_coaches.id` (UUID) — perlu kolom mapping?

---

## Lampiran A — Peta layar desain

| Layar | Isi | Bagian PRD |
|---|---|---|
| 1a | Activity user baru (empty state 4 kartu) | §6.1 |
| 1b | Activity user aktif, sudah upload | §6.1 |
| 1c | Activity hari ke-5 tanpa jeda (recovery utama), tombol rekap | §6.1, §8.2 |
| 1d | Upload 3 langkah + konfirmasi olahraga + Lainnya | §5.2, §7.12 |
| 1e | Analisa lengkap per keluarga (Padel, Basket, Sepak bola, Lari, HYROX, Yoga, Ski, Lainnya) + mode upload pertama | §6.2, §7 |
| 1f | Coach chat + kartu aksi | §8.4, §8.5 |
| 1g | Hasil scan Visbody | §6.4 |
| 1h | Rekap mingguan | §15 |
| 1i | Story card 9:16 | §15 |

## Lampiran B — Fase build (ringkas, detail di prompt build)

- **Fase 0** Audit read-only (inventaris komponen, katalog menu, pipeline upload, webhook Visbody, join coach_id, ct_meal, achievement/event/venue, RLS). STOP.
- **Fase 1** Fondasi data (§10). Draft seed sport_profile/MET/muscle_map/exercise_pattern dikonfirmasi dulu.
- **Fase 2** Visbody → Activity. Pull tidak tersedia → STOP.
- **Fase 3** UI halaman utama (§6.1).
- **Fase 4** Upload & analisa (§7).
- **Fase 5** Router & Coach Chat (§8).
- **Fase 6** Playlist & program: library filter tujuan/otot/alat/level; playlist dengan sets/reps/rest/reorder; estimasi durasi live Σ[sets × (reps × `sec_per_rep` atau duration_sec) + (sets−1) × rest] + `transition_sec` × (n−1); player → set_log → router `playlist_done`; program `plan.days[].playlist_id`.
- **Fase 7** <a id="15"></a>Story card & rekap: story 1080×1920 client-side (foto user opsional di belakang, body map otot hari ini, "Fokus hari ini: <otot>", durasi, kalori, record/milestone/level/target, nama olahraga, logo 20FIT), Web Share API (files) + fallback download, tidak disimpan kecuali "Simpan". Rekap mingguan cron Minggu malam → `my20fit_weekly_recap`: total sesi, menit, olahraga, body map mingguan, target met, level naik, 1 fokus minggu depan + CTA Coach, bisa dibagikan sebagai story.
- **Fase 8** Dibanding komunitas (opsional, flag OFF): opt-in, persentil anonim per sport_key & kelompok umur/jenis kelamin, hanya bila kelompok ≥30 user. Konfirmasi sebelum dibangun.

## Lampiran C — Test (authenticated key)

1. Yoga, hanya durasi, upload pertama, tanpa ct_meal → baseline, kcal estimated, tanpa penilaian kalori, menu tetap muncul.
2. Padel Apple "Tennis" → koreksi → pelengkap sisi non-dominan.
3. Badminton Mi Fitness → racket_court.
4. Basketball 3 game berturut-turut → 🟡/🔴, landing & ankle, hari ringan.
5. Football dengan jarak → jarak terjauh jadi milestone.
6. Lari HR + pace sesi ke-6 → tren, efisiensi, target jarak, km sepatu bila gear aktif.
7. HYROX hasil resmi → station terlemah + pelengkap sesuai station; HYROX tercatat "HIIT" → konfirmasi.
8. Ski 3 hari → ringkasan trip.
9. "Sepak takraw" → `other` + `sport_request`.
10. Sesi di 20FIT Arena + Cafe verified → 1 menu Cafe; tanpa data event → tanpa CTA ekosistem.
11. Target "makan sebelum main" → met/missed di upload berikutnya.
12. Insight → Tanya Coach → terapkan target makan → `coach_meal_plan` & calories.20fit.id ter-update.
13. `consent_health=false` → tanpa data Visbody ke model.
14. Tidak ada teks/kolom tidur atau minum di UI.
15. Maks 1 CTA ekosistem per analisa & tidak pernah jadi insight utama.
16. User A tidak bisa membaca data user B.
17. Padel tanpa HR (hanya durasi) → "Otot paling kena" tetap tampil dari bobot sport + durasi, label Estimasi, tanpa pembagian kiri/kanan bila sisi dominan tidak diketahui.
18. Basket 3 game beruntun → skor betis & paha bertambah dari sisa beban, kesiapan ikut turun.

Laporan akhir per fase: yang dibuat, yang dihapus, tabel/kolom baru, hasil test RLS.
