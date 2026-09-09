# Permintaan teknis ke tim ticket.20fit.id

> Dibuat 2026-09-08 · diperbarui 2026-09-09 (OTP dihapus dari my.20fit — lihat §4b).
> Semua angka di bawah adalah **hasil pengukuran**, bukan perkiraan. Kalau ada yang
> keliru, tolong dikoreksi — kami akan ukur ulang.

## 1. Konteks

my.20fit.id punya widget **"Tiket Saya"**. Widget itu memanggil server kami, server
memanggil edge function `ticket-embed`, dan edge function memanggil
`https://ticket.20fit.id/api/embed/v1` memakai APP KEY (`TICKET_EMBED_KEY`).

Alurnya sekarang:

1. `POST /partner/user-token` — tukar email user jadi `userToken`.
2. `GET /me/tickets` dengan header `X-Embed-User-Token: <userToken>`.

Langkah 2 **bekerja dengan benar** setiap kali tokennya terbit. Yang gagal langkah 1.

## 2. Yang sudah kami ukur

Tidak ada OpenAPI/dokumentasi yang terekspos (`/openapi.json`, `/docs`, dst. → 404 HTML),
jadi peta di bawah kami susun dari respons dan header `Allow`-nya sendiri.

| Endpoint | Hasil terukur |
|---|---|
| `GET /events`, `GET /events/{slug}` | 200, katalog |
| `POST /orders` (`Allow: OPTIONS, POST`) | membuat pesanan; wajib `eventId`(uuid), `method`, `buyer.email`, `items[>=1]` |
| `GET /orders/{orderId}?email=` | baca **satu** pesanan, di-scope email pembeli. Tanpa `?email` → 400 `email query param required` |
| `POST /partner/user-token` | lihat §3 |
| `POST /otp/request`, `POST /otp/verify` | menerima email apa pun (email fiktif pun `{"ok":true}` di `/otp/request`) |
| `GET /me/tickets` (`Allow: GET, HEAD, OPTIONS`) | **wajib** `X-Embed-User-Token`; `?email=` tidak menggantikannya (tetap 401) |
| `GET /tickets/{code}/qr` | butuh `userToken` |

**Tidak ada endpoint yang mendaftar tiket atau pesanan per email.** Pesanan hanya bisa
dibaca per `orderId` (+email), dan tiket hanya bisa didaftar dengan `userToken`.

## 3. Masalah utama: `/partner/user-token` menolak pembeli asli

- **8 dari 8** pembeli tiket asli (email persis sama dengan yang dipakai membeli)
  → **404 `{"error":"user_not_found"}`**.
- **3 user yang belum pernah membeli apa pun** → **200** (token terbit).
- Satu email **fiktif** → **404**, identik dengan respons pembeli asli.
- Pencocokan **case-insensitive** (email HURUF BESAR tetap 200), jadi ini bukan soal
  normalisasi/spasi. Kami juga sudah pastikan data kami bersih: email profil vs
  `auth.users` **0 beda dari 1374**, dan email pembeli **0 beda dari 921**.
- Di log edge function 24 jam: **141 dari 143** panggilan `/partner/user-token` → 404.

**Kesimpulan sementara kami (mohon dikonfirmasi):** endpoint ini menjawab pertanyaan
*"apakah email ini punya AKUN di ticket.20fit.id?"*, **bukan** *"apakah email ini punya
TIKET?"*. Pembeli tamu (guest checkout) tidak punya akun, jadi tiketnya tak pernah bisa
kami tampilkan lewat jalur ini.

## 4. Tidak ada jalur pemberitahuan pembelian sama sekali

Kami tidak menerima **webhook** apa pun dari ticket.20fit.id. Satu-satunya sinkronisasi
kami (`sync-ticket-events`) hanya menarik `/events` dan menyimpan `sold_count` **agregat** —
tidak pernah identitas pembeli.

Akibatnya terlihat langsung pada kasus nyata 2026-09-08:

| | Live `/events` | DB kami (`sold_count`, sync 2026-09-07 21:00) | Selisih |
|---|---|---|---|
| Indonesia Sports Summit 2026 — Jakarta Hybrid Race | **1233** | 1162 | **+71** |
| (Invitation Only) Sports Summit | 16 | 14 | +2 |

Pembayaran **berhasil dan tercatat di ticket.20fit.id** (+71 terjual sejak sync), tapi di
sisi kami **nol baris** — kami tidak punya cara apa pun untuk tahu siapa pembelinya.

## 4b. Syarat dari pemilik produk: TANPA OTP

Keputusan pemilik my.20fit.id (2026-09-08): **user harus bisa langsung melihat tiket yang
sudah dia beli — tanpa disuruh memasukkan kode OTP.**

Dengan API yang ada sekarang, syarat itu **tidak bisa kami penuhi dari sisi kami**, karena:

- `GET /me/tickets` mewajibkan header `X-Embed-User-Token`;
- `userToken` hanya bisa terbit lewat dua jalan: `POST /partner/user-token` (menuntut email
  punya **akun** — 404 untuk 8 dari 8 pembeli asli) atau **OTP**;
- tidak ada endpoint yang mendaftar tiket/pesanan **per email**, dan tidak ada webhook.

Jadi menghapus OTP tanpa penggantinya berarti pembeli tamu tidak melihat apa pun. Ini
persis yang membuat permintaan di §5 menjadi mendesak: **hanya kalian yang bisa membuat
pengalaman "langsung" itu mungkin.**

> **Update 2026-09-09:** OTP kini **sudah kami hapus sepenuhnya** dari my.20fit.id
> (endpoint `/api/tickets/verify/*` dan seluruh UI-nya dibuang) atas keputusan pemilik.
> Halaman "Tiket Saya" sekarang: (a) untuk email yang **dikenal** penerbit → tampil tiket
> lengkap + QR lewat jalur partner server-ke-server, **tanpa OTP**; (b) untuk email yang
> belum dikenal → tampil pembelian dari **arsip** (nama event, jenis, tanggal, "LUNAS")
> **tanpa QR**, dengan tautan ke ticket.20fit.id. Detail non-kredensial jujur apa adanya;
> QR-nya menunggu §5. Artinya celah di atas kini **live di produksi** — makin mendesak.

Satu pertanyaan tambahan yang murah untuk kalian jawab, dan bisa langsung menyelesaikan
semuanya tanpa endpoint baru: **kalau seorang pembeli tamu kemudian mendaftar akun di
ticket.20fit.id dengan email yang sama, apakah pesanan tamunya otomatis tertaut ke akun
itu?** Kalau ya, `/partner/user-token` akan berhasil untuk mereka dan tiketnya muncul di
my.20fit.id **otomatis, tanpa OTP, tanpa perubahan API apa pun.** Kalau tidak, adakah
cara menautkannya (mis. saat pendaftaran, atau lewat endpoint partner)?

## 5. Yang kami minta (urut preferensi)

1. **Webhook pembelian.** POST ke endpoint kami saat pesanan lunas, ditandatangani
   (HMAC header, secret dibagi di luar jalur). Payload minimal: `orderId`, `status`,
   `event` (id/slug + nama + tanggal + cover), daftar tiket (tiap tiket: `code`,
   `ticketType`, `holderName`, `status` gerbang), `buyer.email` (+ `buyer.phone` kalau ada),
   **dan QR tiap tiket** (payload atau URL gambar). Ini yang membuat tiket + QR muncul
   **otomatis, tanpa OTP**.
2. **Endpoint partner baca tiket + QR per email.** Mis.
   `GET /partner/tickets?email=...` dan `GET /partner/tickets/{code}/qr?email=...` dengan
   APP KEY (server-ke-server, bukan dari browser) — mengembalikan tiket **dan QR** untuk
   email itu **tanpa** `X-Embed-User-Token`/OTP. Ini penukar langsung `/me/tickets` +
   `/tickets/{code}/qr` yang sekarang menuntut token per-user. Cukup untuk menarik on-demand
   tanpa webhook. (Keamanan: email selalu dari sesi login user di sisi kami — lihat §7.)
3. **Kalau (1) dan (2) belum bisa — minimal jawab ini:**
   - Apakah 404 `user_not_found` di `/partner/user-token` memang berarti "email belum
     punya akun"?
   - Adakah cara menerbitkan `userToken` untuk pembeli **tamu** (punya tiket, tanpa akun)?
   - Apakah `POST /otp/verify` menerbitkan `userToken` untuk email tanpa akun? (Kami sudah
     memasang jalur OTP di my.20fit.id — user menekan "Kirim kode ke emailku" lalu
     memasukkan kodenya — tapi kami **belum bisa memastikan** jalur ini berhasil untuk
     pembeli tamu tanpa mengetesnya dengan pembeli asli.)
   - Adakah cara mencari pembeli lewat **nomor HP**, bukan email?

## 6. Yang TIDAK kami minta

Akses database langsung, dump data pembeli, atau endpoint yang bisa membaca tiket orang
lain tanpa bukti kepemilikan. Kami hanya ingin **user melihat tiketnya sendiri**.

## 7. Catatan keamanan dari sisi kami

- APP KEY hanya ada di **secret edge function** (`TICKET_EMBED_KEY`) — tidak pernah di
  frontend, repo, atau commit.
- Email yang dipakai memanggil upstream selalu berasal dari **sesi login user**, bukan
  dari input. User tidak bisa menyebut email orang lain.
