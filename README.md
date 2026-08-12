# Handoff: Admin Dashboard my.20fit.id — tampilan baru

## Overview
Redesign penuh admin dashboard `my.20fit.id`: satu sistem dengan navigasi bergrup, filter periode
bersama, pola tabel seragam, role/permission yang ditegakkan di UI dan server, plus lima modul baru
(Voucher, Menu diet, Corporate + portal klien, Email campaign, Banner). Dua kemampuan lintas halaman:
**pemilih bahasa ID/EN** dan **mode terang/gelap**, keduanya tersimpan per admin.

## About the design files
File dalam bundel ini adalah **referensi desain**, bukan kode produksi untuk disalin apa adanya:

- `admin-shell.html` — skeleton markup vanilla (shell + Overview + Voucher + Corporate) memakai
  class dari `admin-theme.css` dan atribut `data-*` yang dibaca `admin-shell.js`. Ini paling dekat
  dengan stack yang sudah ada (vanilla HTML/CSS/JS, tanpa framework) — boleh dipakai langsung sebagai
  titik awal, tapi datanya harus datang dari `/api/admin/*`, bukan hardcode.
- `admin-theme.css` — token tema (light/dark) + primitives (nav, tabel, tombol, tag, chart, callout).
  Load **setelah** `css/20fit-design-system.css`.
- `admin-shell.js` — perilaku shell: tema, bahasa, routing section/tab lewat URL, search/sort/
  pagination tabel, toast, konfirmasi dua langkah untuk aksi destruktif.
- `Admin Dashboard 20FIT.dc.html` — prototipe interaktif lengkap (semua 10 section, semua modul,
  semua state). Pakai ini sebagai **sumber kebenaran perilaku dan layout**; jangan port kodenya —
  formatnya bukan stack project.
- `PROMPT-CLAUDE-CODE.md` — spesifikasi backend untuk 5 modul (schema, endpoint, aturan keamanan).

Tugasnya: **membangun ulang tampilan ini di codebase yang ada** (vanilla + Express + Supabase),
memakai pola yang sudah dipakai project, bukan membawa framework baru.

## Fidelity
**High-fidelity.** Warna, tipografi, spasi, dan interaksi sudah final. Recreate se-presisi mungkin.
Angka pada mock adalah data sintetis yang meniru bentuk data nyata (892 profil, 26 pending,
15 failed, paket 150 kredit = Rp 150.000, 10 kredit = Rp 25.000, banyak order `paid` via voucher
dengan `net_amount` = 0).

## Design tokens

Warna (light → dark):

| Token | Light | Dark | Dipakai untuk |
|---|---|---|---|
| `--bg` | `#f3f2f2` | `#171615` | latar halaman |
| `--surface` | `#eae9e9` | `#221f1e` | baris terpilih, hover, preview |
| `--ink` | `#201e1d` | `#f2efed` | teks utama, garis, isi bar chart |
| `--ink-2` | `#605d5d` | `#b7b2af` | teks sekunder |
| `--ink-3` | `#7d7979` | `#918c89` | catatan kecil |
| `--ink-4` | `#9b9797` | `#6d6865` | label grup nav, angka mati |
| `--line` | `#d7d3d3` | `#3a3634` | garis dalam (tabel, sel) |
| `--line-2` | `#bab6b6` | `#524d4a` | border input, placeholder |
| `--accent` | `#e4002b` | `#ff3b57` | brand red — aksi utama, alert |
| `--accent-ink` | `#ae0021` | `#ff9783` | merah untuk teks seukuran paragraf |
| `--accent-soft` | `#ff9783` | `#8c2a14` | bar pending/failed |

Catatan: mock desain dibuat pada aksen `#ec3013` (design system Modernist). Untuk implementasi
gunakan **`#E4002B`** sesuai `--fit-red` dan `#FF3B57` untuk dark, seperti di tabel ini.

Tipografi (3 peran, sesuai project):
- `Barlow Condensed` 600/700 UPPERCASE — judul halaman (26px), heading section (12px, letter-spacing
  .12em), label tombol, angka statistik besar (34px, `letter-spacing:-0.03em`, tabular-nums).
- `Manrope` 400/500/700 — body 13px, catatan 11px/1.5, nama orang.
- `JetBrains Mono` — tanggal, uang, email, ID, reff_no, kode voucher, password.

Spasi: 4 / 8 / 12 / 16 / 20 / 24 / 32. Radius: **0 di seluruh admin**. Garis: **1px**; hierarki
dibawa oleh spasi dan bobot huruf, bukan garis tebal. Tanpa shadow, tanpa gradient.

## Screens / views

Sepuluh section, dikelompokkan di sidebar 232px (sticky, `border-right:1px solid var(--ink)`):

**Pantau** — Overview · Aktivitas scan · Revenue (badge `41`)
**Kelola** — User & segmen · Voucher · Menu diet (badge = panjang antrian) · Marketing · Corporate (badge `2`)
**Sistem** — Laporan · Pengaturan

Item nav: `width:100%`, padding 10/16, `border-left:2px` (accent saat aktif), fill `--surface` saat
aktif/hover, badge merah flush kanan.

Header (sticky, `border-bottom:1px solid var(--ink)`, padding 16/24/12): kicker uppercase 10px →
judul 26px → pertanyaan yang dijawab halaman (12px, `--ink-2`, max 62ch). Kanan atas, dari atas ke
bawah: segmented **ID | EN**, segmented **Terang | Gelap**; lalu segmented periode (Hari ini / 7 hari
/ 30 hari / Bulan ini / Kustom), chip **Bandingkan periode**, tombol **Export CSV**.

1. **Overview** — 6 KPI dalam grid 3 kolom, masing-masing dengan delta % periode sebelumnya
   (▲ ink / ▼ accent, garis bawah 2px); panel *Perlu tindakan sekarang* (alert pending/failed,
   order paid tanpa `gateway_reference_id`, kesehatan email) dengan tombol yang melompat ke section
   terkait; bar chart 14 hari (paid ink + pending/failed `--accent-soft`); funnel 4 tahap dengan
   drop-off; callout **Belum ada data** untuk metrik yang belum diinstrumentasi (akurasi kalori,
   device admin, frekuensi halaman admin) — jangan diisi angka karangan.
2. **Aktivitas scan** — 4 KPI, histogram 24 jam (jam puncak diwarnai accent), tabel user paling
   aktif, callout data koreksi kalori belum ada.
3. **Revenue** — 4 KPI (realized, gross termasuk voucher, pending, failed), search `reff_no`/nama +
   chip filter (Semua/paid/pending/failed/voucher), tabel order dengan kolom `net` dan **alasan
   gagal**, panel revenue per paket (bar), panel rekonsiliasi Xendit.
4. **User & segmen** — search + 5 chip filter + pagination (5–10 baris/halaman) + state kosong;
   panel detail user di kanan: fakta (kredit, scan, terdaftar, plus, bahasa, akuisisi UTM; field
   kesehatan hanya untuk role yang berhak), riwayat ledger, timeline email/push, aksi (Ganti email /
   Sesuaikan kredit / Catatan admin) yang dikunci per role; grid **Segmen tersimpan** (nama, ukuran,
   aturan, dipakai di mana).
5. **Voucher** — 4 KPI (voucher aktif, diskon diberikan, revenue dari voucher, % pembeli baru);
   tabel perbandingan **sortable** (klik header) urut default revenue bersih, kolom **% pembeli baru**
   diberi warna accent bila < 40%; grafik pemakaian harian; tabel **kode gagal** + alasan; form buat
   voucher (generate kode + cek duplikat, preview aturan satu kalimat, bulk generate 100 kode).
6. **Menu diet** — 3 tab: *Antrian review* (hanya `visibility = shared`, urut terlama, detail item +
   makro + riwayat penolakan pembuat, alasan penolakan baku + catatan, Approve/Reject, riwayat
   review); *Katalog menu* (search, penanda resmi/user, pengikut, Arsipkan/Terbitkan, Hapus dua
   langkah); *Buat menu admin* (item makanan dinamis, total kalori live, preview tampilan member,
   Terbitkan / Simpan draf, peringatan bila total < 1.200 kkal).
7. **Marketing** — 7 tab: *Email analytics* (tabel per campaign: Kirim, Delivery %, **Click %** —
   kolom paling menonjol dengan header inverse —, CTO %, Open % diredam, bounce hard/soft, revenue;
   link terpopuler; panel kesehatan email; **drill-down per user**: klik / buka-tak-klik / belum buka
   / bounce+alasan / lapor spam, masing-masing dengan click rate personal dan export CSV);
   *Kirim campaign* (nama, subject ID & EN, segmen + jumlah penerima, preview desktop & mobile,
   checklist pengaman, konfirmasi ketik `KIRIM <jumlah>`, kill switch); *Banner* (tabel prioritas +
   CTR + konversi, ↑/↓ urutan, aktif/nonaktif, editor ID & EN dengan rasio 3:1, validasi `cta_url`,
   preview persis di bawah kartu AQI); *Konten*; *Shortlink*; *Push*; *Lead*.
8. **Corporate** — 3 tab: *Akun & kontrak* (alert kontrak < 30 hari, tabel organisasi dengan
   **Buka dashboard** dan **Kelola akses**, form buat organisasi: kuota seat + masa kontrak);
   *Akses & password* (akun portal per organisasi: buat akun email + role `hr_admin`/`viewer` →
   **password sementara tampil sekali**, reset password, setel password manual min 10 karakter,
   aktif/nonaktif); *Dashboard klien* (agregat saja, judul mengikuti organisasi yang dipilih).
9. **Laporan** — report terjadwal + report kustom (metrik, segmen, nama file).
10. **Pengaturan** — feature flag & kill switch (toggle), paket & harga (superadmin), role admin
    (superadmin), audit log.

## Interactions & behaviour

- **Bahasa** — seluruh teks berganti ID↔EN, termasuk header tabel, label form, placeholder, dan
  catatan. Di skeleton ini pakai `data-i18n="<english>"` pada elemen; JS menyimpan teks Indonesia
  asli lalu menukar. Di produksi sambungkan ke `js/i18n.js` yang sudah ada. Ingat: teks ID 15–30%
  lebih panjang — jangan pakai lebar tetap untuk label.
- **Tema** — `document.documentElement.dataset.theme = 'dark'`; semua warna hanya lewat token. Wajib:
  token design system (`--color-text`, `--color-bg`, `--color-surface`, `--color-divider`, ramp
  neutral/accent) **juga** di-remap di blok dark, kalau tidak komponen design system (tombol, input,
  header tabel, label field) tetap tinta terang dan tak terbaca.
- **Filter periode** satu komponen dipakai di semua halaman, tersimpan saat pindah halaman dan
  tercermin di URL supaya bisa dibagikan. Mode perbandingan menampilkan delta % di setiap angka.
- **Routing** section dan tab lewat query string (`?section=corporate&tab=access`).
- **Tabel** pola seragam: posisi search, chip filter, sorting (klik `th`, `aria-sort`), pagination,
  dan Export CSV selalu di tempat yang sama. Export mengikuti filter aktif.
- **Aksi destruktif** dua langkah: label berubah jadi *Yakin hapus?* (auto-batal 4 detik).
- **Kirim campaign** tombol kirim nonaktif sampai admin mengetik `KIRIM <jumlah penerima>`; lalu
  status `sending` → `sent`; kill switch menghentikannya.
- **Toast** kiri bawah (di atas sidebar 248px), 2,8 detik, `border-left` accent — untuk konfirmasi
  aksi yang akan tercatat di audit log.
- **Password portal corporate** hanya tampil sekali setelah dibuat/di-reset; disimpan sebagai hash;
  akun wajib ganti saat login pertama; setiap reset masuk audit log.
- **Role & permission** mengubah dashboard, bukan cuma label: `marketing` → nav Overview, User,
  Voucher, Marketing, Laporan; tombol Ganti email & Sesuaikan kredit nonaktif; data kesehatan
  dipangkas **di API**. `finance` → Revenue, Voucher, Corporate, Laporan. `staff` → tanpa Revenue &
  Marketing. `viewer` → read-only. Harga & role admin hanya superadmin. Strip *Batas role* di header
  menjelaskan batasannya.

## State management

Per admin (persist di localStorage / preferensi user): `lang`, `theme`, `period`, `compare`.
Per halaman (URL): `section`, `tab`, `query`, `filter`, `page`, `sort`.
Data dari server: profil & segmen, ledger kredit, order, campaign + event email, voucher +
redemption + attempt, menu + review log, organisasi + member + akun portal, banner + event.

## Assets
Tidak ada gambar dalam desain. Ikon: Lucide (inline SVG, `currentColor`) — atau set ikon yang sudah
dipakai project. Slot gambar banner adalah placeholder 3:1 yang diisi admin saat upload.

## Files
- `admin-shell.html` — skeleton markup + atribut perilaku
- `admin-theme.css` — token & primitives
- `admin-shell.js` — perilaku shell
- `Admin Dashboard 20FIT.dc.html` — prototipe interaktif lengkap (referensi perilaku)
- `PROMPT-CLAUDE-CODE.md` — spesifikasi backend 5 modul

## Yang perlu diputuskan pemilik produk
1. Ambang minimum anggota aktif corporate (mock pakai 5).
2. Frequency cap email + push per user per hari & minggu (mock pakai 3 / 7 hari).
3. Open & click tracking sudah aktif di Resend › Domains? Tanpa itu click rate tidak bisa dihitung.
4. Menu diet user memang bisa dibagikan ke user lain (kalau tidak, modul review tidak perlu).
5. `admin.html` lama dipensiunkan atau tetap fallback.
