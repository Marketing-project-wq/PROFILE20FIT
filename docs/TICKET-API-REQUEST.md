# Permintaan teknis ke tim ticket.20fit.id

> Dibuat 2026-09-08. Semua angka di bawah adalah **hasil pengukuran**, bukan
> perkiraan. Kalau ada yang keliru, tolong dikoreksi — kami akan ukur ulang.

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

## 5. Yang kami minta (urut preferensi)

1. **Webhook pembelian.** POST ke endpoint kami saat pesanan lunas, ditandatangani
   (HMAC header, secret dibagi di luar jalur). Payload minimal: `orderId`, `status`,
   `event` (id/slug), daftar tipe tiket + kode tiket, dan `buyer.email` (+ `buyer.phone`
   kalau ada). Ini yang membuat tiket muncul **otomatis**.
2. **Endpoint partner baca pesanan per email.** Mis. `GET /partner/orders?email=...`
   dengan APP KEY (server-to-server, bukan dari browser). Ini cukup untuk menarik
   on-demand tanpa webhook.
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
