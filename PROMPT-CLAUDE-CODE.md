# Prompt untuk Claude Code — 5 Modul Baru Admin Dashboard my.20fit.id

Copy seluruh isi file ini ke Claude Code. Desain UI-nya sudah ada di `Admin Dashboard 20FIT.dc.html`
(project design) — pakai itu sebagai acuan layout, bukan bikin tata letak baru.

---

## KONTEKS & ATURAN

Stack: Vanilla HTML/CSS/JS (tanpa framework), Node/Express, Supabase, Railway. Chart = inline SVG.
Design system: `css/20fit-design-system.css` + `glass-app.css`. Merah brand `#E4002B`.
Font: Barlow Condensed (heading/angka), Manrope (body), JetBrains Mono (tanggal/uang/ID).
Bilingual ID & EN via `js/i18n.js` — teks ID 15–30% lebih panjang, label harus toleran memanjang.

Aturan yang tidak boleh dilanggar:

1. **Audit dulu, jangan duplikat.** Voucher, corporate, dan menu review sudah ada versi lamanya di
   `admin-dashboard.html`; email sudah ada di `admin-email.html`. Laporkan mana yang dipakai ulang.
2. Semua modul masuk ke **dashboard yang sama** — navigasi, filter periode, pola tabel, export CSV,
   role/permission, dan design system yang sama. Bukan aplikasi terpisah, bukan login terpisah.
3. Semua perubahan schema lewat **migration reversible**.
4. Semua fitur baru di belakang **feature flag**, deploy **staging dulu**.
5. Setiap aksi sensitif masuk **audit log**: siapa, kapan, ubah apa, dari nilai apa ke nilai apa.
6. Jangan mengarang data. Kalau datanya belum ada, tulis "BELUM ADA" dan berhenti.
7. Kalau ragu → berhenti dan tanya, jangan menebak.

---

## FONDASI BERSAMA — bangun sebelum modul apa pun

Kalau ini dibangun belakangan, setiap halaman akan punya versinya sendiri dan sistemnya terpecah.

1. **Komponen filter periode** — preset (hari ini, 7 hari, 30 hari, bulan ini, bulan lalu, kustom) +
   mode perbandingan periode sebelumnya. Pilihan tersimpan saat pindah halaman dan muncul di URL.
2. **Pola tabel standar** — posisi search, filter, sorting, pagination, dan tombol export selalu sama.
3. **Layanan export CSV** — mengikuti filter aktif, bukan seluruh tabel. Data besar diproses background
   lalu kirim link unduhan. Nama file `users_2026-08-01_2026-08-31.csv`.
4. **Sistem segmen user** — ini penghubung semua modul. Segmen dibuat sekali, dipakai ulang untuk
   voucher, email campaign, banner, dan filter laporan. Segmen hanya boleh dibentuk dari atribut
   netral: status membership, bahasa, lokasi studio, riwayat pembelian, tanggal daftar, tingkat
   aktivitas. **Dilarang** dibentuk dari data makanan, berat badan, komposisi tubuh, atau target
   kalori — terapkan sebagai validasi, bukan catatan.
5. **Role & permission + audit log.** Role: `superadmin` (semua), `marketing` (voucher, campaign,
   banner, segmen, laporan — TIDAK boleh ubah harga/kredit/lihat data kesehatan), `staff studio`
   (user & aktivitas), `finance` (revenue & transaksi & kontrak corporate), `viewer` (baca saja).
   Tegakkan di server (query + middleware), bukan disembunyikan di UI.

---

## MODUL 1 — VOUCHER

### Schema

```
Voucher: id, code (unik), name, description,
         discount_type (percentage|fixed_amount|free_scans), discount_value,
         applicable_packages, min_purchase, max_discount,
         usage_limit_total, usage_limit_per_user,
         valid_from, valid_until, target_segment_id, is_active, created_by, created_at

VoucherRedemption: id, voucher_id, user_id, transaction_id, discount_amount, redeemed_at

VoucherAttempt: id, code_tried, user_id, result (ok|expired|quota_full|not_applicable|not_found|
                per_user_limit), created_at        ← wajib, ini sumber data "kode gagal"
```

### Halaman buat voucher
- Generator kode otomatis + opsi input manual, **cek duplikat sebelum simpan**
- Preview aturan dalam satu kalimat: "Diskon 20%, maks Rp 30.000, berlaku untuk paket 10 & 150 kredit,
  1× per user, 1–30 Sep 2026"
- **Bulk generate** 100 kode unik sekaligus untuk satu kampanye
- Target segmen opsional, ambil dari sistem segmen fondasi

### Aturan backend — ini soal uang
- **Validasi & pemakaian kuota harus atomik** (transaksi DB / row lock / `UPDATE ... WHERE used <
  limit RETURNING`). Kalau limit 100 dan 5 user menukar bersamaan, jangan sampai terpakai 103.
  Tulis test untuk kasus bersamaan ini.
- Voucher kedaluwarsa nonaktif otomatis, tidak perlu dimatikan manual
- Voucher yang pernah dipakai **tidak bisa dihapus** — hanya dinonaktifkan, jejak transaksi utuh
- Voucher masuk ke alur pembayaran Xendit yang sudah ada: `amount` tetap, `net_amount` setelah diskon

### Halaman tracking voucher
Tabel perbandingan antar voucher, **urut revenue bersih**, kolom: kode, aturan, dipakai/kuota,
diskon diberikan (Rp), **revenue bersih**, **% pembeli baru**, status.

- **Kolom % pembeli baru adalah pertanyaan terpentingnya**: pecah pemakai voucher menjadi
  pertama-kali-beli vs sudah-pernah-beli. Voucher yang hanya ditebus pelanggan lama justru
  mengurangi revenue — beri penanda visual kalau angkanya di bawah 40%.
- Redemption rate: dari yang mencoba, berapa yang jadi bayar (butuh `VoucherAttempt`)
- Paket mana yang paling sering ditebus dengan voucher itu
- Grafik pemakaian per hari
- **Tabel "kode gagal"**: kode yang dicoba tapi ditolak + alasannya + berapa kali. Termasuk salah
  ketik (`CORP2OFIT` vs `CORP20FIT`) — ini sumber komplain yang paling sering tidak terlihat.
- Export CSV di semua tabel

---

## MODUL 2 — CORPORATE

### Schema

```
Organization:       id, name, contact_person, contact_email, contract_start, contract_end,
                    seat_limit, is_active, notes
OrganizationMember: id, organization_id, user_id, status (invited|active|removed), joined_at
OrganizationAdmin:  id, organization_id, user_id, role
```

### KEPUTUSAN PRIVASI — baca sebelum ngoding

**Corporate hanya melihat data AGREGAT, tidak pernah per individu.** Kalau HR bisa melihat berat
badan, komposisi tubuh, atau catatan makanan karyawan tertentu, karyawan berhenti mencatat jujur dan
programnya jadi tidak berguna — selain itu ini risiko hukum.

Boleh dilihat corporate: jumlah karyawan terdaftar vs kuota, tingkat partisipasi (% aktif 30 hari),
total scan kelompok, rata-rata & tren kelompok, tanggal kontrak & sisa kuota.

**Tidak boleh**: data individual karyawan mana pun, daftar nama beserta angka kesehatannya, dan apa
pun yang bisa mengidentifikasi individu dari agregat.

**Ambang minimum 5 anggota aktif** — kelompok/divisi dengan anggota aktif di bawah 5 tidak
ditampilkan angkanya, tulis "Disembunyikan · di bawah ambang". Terapkan di **query dan permission**,
bukan disembunyikan di UI.

Kalau ada kontrak yang menuntut akses individual: **jangan bangun**, laporkan — itu butuh
persetujuan eksplisit dari karyawan bersangkutan, bukan dari HR-nya.

### Halaman internal 20FIT
Daftar organisasi (status kontrak, seat terpakai/limit, partisipasi 30 hari, sisa hari kontrak),
buat organisasi + atur kuota & masa kontrak, kelola anggota (undang lewat email, import CSV, hapus),
tunjuk admin organisasi, **peringatan kontrak berakhir < 30 hari**, laporan pemakaian per organisasi
+ export CSV.

### Portal klien
Akun terbatas untuk perusahaan mitra: metrik agregat di atas, filter periode yang sama, export
laporan agregat, dan catatan jelas bahwa data individual tidak ditampilkan demi privasi karyawan.
Login corporate memakai sistem auth yang sama dengan scope organisasi, bukan auth baru.

---

## MODUL 3 — APPROVAL MENU DIET

### Bedakan dua kasus dulu — laporkan kalau tidak jelas dari kode
- **Menu untuk diri sendiri** (`visibility = private`) → **tidak perlu approval.** Jangan pasang
  gerbang di sini, itu hanya menghambat pemakaian harian.
- **Menu yang dibagikan** (`visibility = shared`) → ini yang direview, karena begitu dibagikan isinya
  menjadi saran gizi untuk orang lain. Modul ini hanya untuk kasus kedua.

### Schema

```
DietMenu:      id, user_id, title, description, items (JSON), total_calories, macros,
               visibility (private|shared), status (pending|approved|rejected),
               reviewed_by, reviewed_at, rejection_reason, created_at
MenuReviewLog: id, menu_id, reviewer_id, action, reason, created_at
```

### Halaman review
- Antrian menu `shared` + `pending`, **urut terlama**, dengan search & filter
- Detail: isi menu per waktu makan, total kalori, makro, pembuat, dan **riwayat pembuat** (pernah
  ditolak berapa kali — tandai merah)
- Approve / Reject dengan **alasan wajib**, pilihan baku: informasi gizi tidak akurat · kalori tidak
  masuk akal/tidak aman · mengandung klaim medis · tidak sesuai pedoman gizi · spam/tidak relevan —
  plus kolom catatan bebas
- **Pedoman reviewer tampil di halaman**: tolak kalori sangat rendah yang tidak aman (di bawah 1.200
  kkal untuk dewasa tanpa pengawasan), klaim medis ("menyembuhkan diabetes"), informasi gizi yang
  jelas salah (makro tidak cocok dengan totalnya), dan menu yang mendorong pola makan ekstrem atau
  puasa berlebihan. Ini bukan formalitas — menu salah yang tersebar bisa membahayakan pengikutnya.
- Riwayat review lengkap, bisa difilter

### Notifikasi
Pembuat diberi tahu hasil + alasannya dalam **ID & EN**, dengan kalimat netral dan membantu, bukan
menghakimi.

---

## MODUL 4 — EMAIL CAMPAIGN (Resend, sudah ada di Railway)

Pakai integrasi Resend yang sudah ada. **Jangan bikin integrasi baru.**

**Cek dulu dan laporkan**: apakah *open tracking* dan *click tracking* sudah aktif di Resend ›
Domains. Tanpa itu event `email.opened` dan `email.clicked` tidak pernah terkirim dan click rate
mustahil dihitung. Kalau belum aktif, hentikan modul analitik dan beri tahu saya.

### Schema

```
EmailCampaign: id, name, subject_id, subject_en, body_id, body_en, target_segment_id,
               status (draft|scheduled|sending|sent|paused), scheduled_at, sent_at,
               created_by, total_recipients
```
Plus tabel yang sudah ada: `message_log`, `email_events`, `suppression_list`, `user_comm_prefs`.

### Halaman buat & kirim campaign
- Editor konten + **preview desktop & mobile**
- Penerima **dari sistem segmen fondasi** — jangan bikin targeting terpisah
- **Tampilkan jumlah penerima sebelum kirim**, beserta berapa yang dikecualikan dan alasannya
- Jadwalkan atau kirim sekarang; **kirim tes** ke alamat tertentu dulu; duplikat campaign lama
- Bahasa email mengikuti `user_comm_prefs.lang`

Pengaman wajib, semua aktif:
- **Cek suppression list** — jangan pernah kirim ke hard bounce atau pelapor spam
- **Hormati unsubscribe**, tanpa kecuali
- **Frequency cap lintas channel** (email otomatis + campaign + push dihitung bersama) — usulan
  3 per 7 hari, konfirmasi ke saya
- **Idempotency key `{campaign_id}/{user_id}`** supaya retry tidak menggandakan kirim
- **Konfirmasi ganda**: tampilkan jumlah penerima dan minta admin mengetik `KIRIM <jumlah>`
- **Kill switch** menghentikan campaign yang sedang berjalan, tanpa deploy
- Batch maksimal 100 per panggilan; **batch atomik** — satu alamat invalid menggagalkan seluruh
  batch, jadi validasi semua alamat lebih dulu

### Analitik per campaign
Terkirim, delivered, **delivery rate %**, dibuka, **open rate %**, diklik, **click rate %** (dari
terkirim), **click-to-open %** (dari yang membuka), **bounce rate % dipisah hard vs soft**,
**complaint rate %**, unsubscribe dari campaign ini, dan **link mana yang paling banyak diklik**.

**Hierarki tampilan: click rate paling menonjol.** Open rate diberi label kecil "tidak akurat" —
pemblokiran gambar dan Apple Mail Privacy Protection membuatnya tidak bisa dipakai untuk keputusan.

### Drill-down per user (per campaign)
Lima daftar, masing-masing dengan export CSV:
1. **Yang mengklik** — nama, email, link apa, kapan
2. Membuka tapi tidak mengklik
3. Tidak membuka
4. **Bounce beserta alasannya** (alamat tidak ada / mailbox penuh / domain tidak valid) + tombol
   tandai alamat sebagai tidak valid → masuk suppression
5. Melapor spam

Di setiap baris tampilkan **click rate personal user** lintas campaign. Di halaman detail user
tampilkan timeline semua email yang dia terima (dibuka / diklik) + click rate personalnya. User
dengan click rate nol berbulan-bulan sebaiknya dikeluarkan dari pengiriman — terus mengirim ke
mereka merusak reputasi domain.

### Ringkasan lintas campaign
Satu tabel semua campaign: click rate, CTO, bounce hard/soft, dan **revenue yang dihasilkan**, bisa
diurutkan.

---

## MODUL 5 — PROMOTION / BANNER

### Schema

```
Banner:      id, title, image_url_id, image_url_en, alt_text_id, alt_text_en,
             cta_text_id, cta_text_en, cta_url, cta_type (internal_link|external_link|deeplink),
             placement (mis. below_aqi), target_segment_id, priority,
             starts_at, ends_at, is_active, created_by
BannerEvent: id, banner_id, user_id, event_type (impression|click), created_at
```

### Halaman kelola banner
- Upload gambar dengan **preview persis seperti tampilan aslinya di posisi bawah kartu AQI** di
  `my.20fit.id`
- **Versi gambar & teks terpisah untuk ID dan EN** (image, alt text, CTA text)
- CTA text + tujuan link; **validasi `cta_url` hanya ke domain yang diizinkan** — cegah open redirect
- Jadwal `starts_at` / `ends_at` — banner kedaluwarsa berhenti sendiri
- **Prioritas & urutan** kalau ada beberapa banner aktif di placement yang sama, atur drag-and-drop
- Target segmen opsional; aktif/nonaktif cepat tanpa hapus

Teknis upload: batasi tipe & ukuran file, **bersihkan metadata EXIF** (foto sering membawa koordinat
GPS), kompres + versi responsif, dan tampilkan rasio aspek yang disarankan di form (1200×400, 3:1)
supaya gambar tidak gepeng.

### Tracking banner
Impression, klik, **CTR %** per banner, konversi (dari yang klik berapa yang akhirnya membeli),
perbandingan antar banner, grafik per hari.
**Impression dicatat asinkron dan di-batch** — jangan satu request per tampilan, itu membanjiri
server. Kecualikan bot & preview crawler.

### Batasan konten
Copy banner tidak boleh menghakimi atau memancing rasa tidak aman soal berat badan/bentuk tubuh, dan
tidak boleh memakai countdown atau kelangkaan palsu. Ini aplikasi kesehatan — taktik itu merusak
kepercayaan.

---

## PAGAR YANG BERLAKU DI SEMUA MODUL

- **Targeting segmen** hanya dari atribut netral (lihat fondasi #4). Terapkan sebagai validasi.
- **Export CSV & report terjadwal** tidak pernah memuat detail makanan, kalori per makanan, atau
  komposisi tubuh. Kecualikan di level query.
- **Role marketing**: boleh voucher, campaign, banner, segmen, laporan. Tidak boleh ubah harga, ubah
  kredit user, atau melihat data kesehatan individual.
- Endpoint publik (redirect banner/shortlink, tracking) wajib rate limiting.

---

## URUTAN PENGERJAAN

1. Audit → laporkan apa yang dipakai ulang, tulis `docs/NEW-MODULES-AUDIT.md`
2. **Fondasi bersama** (filter periode, pola tabel, export, segmen, role + audit log)
3. **Voucher** — paling berdiri sendiri, dampak revenue paling langsung
4. **Banner** — paling cepat terlihat hasilnya
5. **Email campaign** — setelah konfirmasi tracking Resend
6. **Approval menu** — setelah keputusan private vs shared
7. **Corporate** — paling banyak menyentuh schema

Commit kecil, satu tujuan per commit. Feature flag. Staging dulu. Setiap modul selesai, laporkan
apa yang perlu saya tes manual.

---

## YANG PERLU KAMU TANYAKAN KE SAYA SEBELUM LANJUT

1. Menu diet user memang bisa dibagikan ke user lain, atau hanya untuk diri sendiri?
2. Ada kontrak corporate yang menuntut akses data individual karyawan?
3. Ambang minimum anggota aktif corporate — pakai 5, atau angka lain?
4. Open & click tracking sudah aktif di dashboard Resend?
5. Frequency cap email + push per user per hari & per minggu, angkanya berapa?
6. `admin.html` lama dipensiunkan atau tetap jadi fallback?
