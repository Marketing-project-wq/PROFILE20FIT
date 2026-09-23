# Visbody S20 → my.20fit.id — semua yang dibutuhkan untuk menyambungkannya

> **Status saat dokumen ini ditulis (2026-09-22):** kode integrasi sudah ada di `staging`
> (merge `728a19a`), migration `019` sudah dijalankan pemilik — kedua tabel ada, **0 baris**.
> Yang belum ada: **kredensial** dan **pendaftaran URL ke Visbody**. Selama dua hal itu
> kosong, tidak ada satu pun hasil timbangan yang bisa masuk.
>
> Dokumen ini adalah daftar kerja pemilik. Agent tidak bisa mengerjakan bagian mana pun
> darinya: Railway Variables tidak bisa di-set dari sini (CLAUDE.md §3), dan tiga rahasia
> di Bagian 1 hanya Visbody yang punya.

---

## Ringkasan satu layar

| # | Langkah | Siapa | Blocker? |
|---|---|---|---|
| 1 | Minta 3 rahasia + 4 konfirmasi ke Visbody | pemilik → Visbody | **YA — ini akar semuanya** |
| 2 | Buat sendiri 2 rahasia device | pemilik | tidak |
| 3 | Isi 5–6 variabel di Railway (staging dulu) | pemilik | tidak |
| 4 | Daftarkan 3 URL kita ke Visbody | pemilik → Visbody | **YA** |
| 5 | Uji tanpa timbangan (skrip) | pemilik | tidak |
| 6 | Uji dengan timbangan (satu orang naik) | pemilik | tidak |
| 7 | Kalau lolos: ulangi 3 & 4 untuk produksi | pemilik | tidak |

Urutannya tidak bisa dibalik: 5 baru berarti setelah 1 & 3; 6 baru berarti setelah 4.

---

## Bagian 1 — Yang HARUS diminta ke Visbody

Tanpa tiga nilai ini, integrasi **tidak bisa jalan sama sekali**. Tidak ada cara kita
membuatnya sendiri: itu identitas akun kita di sisi mereka dan kunci yang mereka pakai
menandatangani webhook.

| Yang diminta | Dipakai untuk | Kalau kosong |
|---|---|---|
| `account_key` | identitas akun 20FIT di WellnessHub API | tidak bisa ambil data ukur sama sekali |
| `account_secret` | pasangan di atas, untuk menukar token | idem |
| `webhook_secret` | verifikasi tanda tangan webhook | **semua webhook ditolak 401** — scan tidak pernah tercatat |

Selain itu, empat hal yang perlu **dikonfirmasi tertulis** (bukan diasumsikan):

1. **Serial number (SN) timbangan S20** yang terpasang di lokasi 20FIT — dan kalau lebih
   dari satu unit, SN semuanya.
2. **Nama header tanda tangan webhook.** Kode kita sekarang membaca
   `x-visbody-timestamp` dan `x-visbody-signature`.
3. **Cara tanda tangan dihitung.** Kode kita mengharapkan
   `HMAC-SHA256( "<timestamp>.<raw body>", webhook_secret )`, hasilnya hex, dikirim dengan
   awalan `sha256=`.
4. **Contoh body webhook asli** (satu contoh nyata sudah cukup). Kode kita membaca kunci:
   `scan_id`, `device_sn` (atau `device_id`), `scan_time`, `event_id`,
   `measured_items.body_composition`, dan `user_info.{name,sex,age,height,birthday,third_uid}`.

> **Sebagian sudah terjawab (23 Sep 2026).** Pemilik membaca
> <https://developer.visbody.ai/integration/v2/> lalu merangkumnya, dan rangkuman itu
> **cocok** dengan yang sudah terlanjur dikodekan: header `x-visbody-timestamp` /
> `x-visbody-signature`, HMAC-SHA256 atas `"<timestamp>.<raw body>"` berawalan `sha256=`,
> endpoint `/api/v2/{token,scan,user/bind,pdf,list}`, dan alur device token + qrcode.
>
> Yang **masih** perlu diminta: **contoh body webhook asli**. Yang dirangkum adalah contoh
> *respons scan*, bukan *payload webhook* — dua hal berbeda, dan verifikasi signature
> bergantung pada yang kedua.
>
> Catatan kejujuran: saya **tidak bisa membuka** halaman dokumentasinya — domainnya
> diblokir kebijakan jaringan sesi ini (`CONNECT tunnel failed, response 403`). Jadi yang
> mencocokkan adalah rangkuman pemilik, bukan pembacaan saya atas dokumen aslinya.

### Pesan siap kirim ke Visbody

```
Subject: API + webhook credentials for 20FIT (Visbody S20 integration)

Hi Visbody team,

We are integrating our Visbody S20 unit with our member portal (my.20fit.id).
Our backend is ready; we need the following from you:

1) account_key and account_secret for the WellnessHub API
   (https://api-wellnesshub.visbody.ai)
2) webhook_secret, so we can verify the signature of your webhook calls
3) The serial number(s) of the S20 unit(s) registered to our account

And confirmation of four technical details:

4) The exact header names you send the webhook signature in.
   We currently read: x-visbody-timestamp and x-visbody-signature
5) How the signature is computed.
   We currently expect: HMAC-SHA256 over "<timestamp>.<raw request body>",
   hex-encoded, prefixed with "sha256="
6) One real example of a webhook payload body
7) Whether the /api/v2 endpoints we plan to call are correct:
   GET  /api/v2/token?account_key=...&account_secret=...
   GET  /api/v2/scan/{scan_id}?unit_group=metric&precision=2
   POST /api/v2/user/bind
   GET  /api/v2/pdf/{scan_id}?unit_group=metric
   GET  /api/v2/list?third_uid=...&page=&size=

Separately, we will provide three HTTPS endpoints on our side for the device
and your cloud to call, plus a device key/secret pair we generate. We will send
those in a follow-up once you confirm the above.

Thanks,
20FIT
```

Kirim rahasianya lewat jalur yang wajar (password manager / kanal privat), **jangan lewat
chat grup, jangan lewat email biasa kalau bisa dihindari, dan jangan pernah ditempel ke
kode/PR/issue** — CI gitleaks memblokirnya, dan itu memang disengaja.

---

## Bagian 2 — Yang kamu buat SENDIRI

Dua nilai ini **milik kita**, bukan dari Visbody. Gunanya arah sebaliknya: timbangan
memakainya untuk membuka sesi ke server kita di `GET /api/visbody/token`.

Buat dua string acak (jalankan di terminal mana pun):

```bash
openssl rand -hex 24   # -> VISBODY_DEVICE_KEY
openssl rand -hex 32   # -> VISBODY_DEVICE_SECRET
```

Simpan keduanya di password manager. Nanti diberikan ke Visbody bersama URL di Bagian 4.

---

## Bagian 3 — Isi Railway Variables

**Staging dulu** (CLAUDE.md §1). Nama variabelnya persis seperti ini — beda satu huruf =
tidak terbaca:

| Variabel | Isi dari | Wajib |
|---|---|---|
| `VISBODY_ACCOUNT_KEY` | Visbody (Bagian 1) | ya |
| `VISBODY_ACCOUNT_SECRET` | Visbody (Bagian 1) | ya |
| `VISBODY_WEBHOOK_SECRET` | Visbody (Bagian 1) | ya |
| `VISBODY_DEVICE_KEY` | dibuat sendiri (Bagian 2) | ya |
| `VISBODY_DEVICE_SECRET` | dibuat sendiri (Bagian 2) | ya |
| `VISBODY_API_URL` | — | tidak; default `https://api-wellnesshub.visbody.ai` |

Satu variabel lama yang perlu **dicek sudah benar**, karena isi QR dibangun darinya:

| `APP_BASE_URL` | harus base URL lingkungan itu sendiri (`https://my.20fit.id` di produksi, URL staging di staging). Kalau salah, QR di layar timbangan mengarah ke tempat yang salah. |
|---|---|

Setelah variabel diisi, Railway redeploy otomatis. Tunggu deploy selesai sebelum menguji.

---

## Bagian 4 — URL yang didaftarkan ke Visbody

Tiga endpoint di sisi kita. Ganti `<BASE>` dengan URL lingkungan yang sedang disetel
(staging dulu, produksi belakangan):

| Arah | URL | Keterangan |
|---|---|---|
| Visbody Cloud → kita | `POST <BASE>/api/visbody/webhook` | dipanggil tiap selesai scan |
| Timbangan → kita | `GET <BASE>/api/visbody/token?key=…&secret=…` | `key`/`secret` = `VISBODY_DEVICE_KEY`/`SECRET` dari Bagian 2 |
| Timbangan → kita | `GET <BASE>/api/visbody/qrcode?token=…&scan_id=…&device_id=…` | kita balas QR (SVG base64) yang ditampilkan di layar timbangan |

Berikan ke Visbody: **ketiga URL + `VISBODY_DEVICE_KEY` + `VISBODY_DEVICE_SECRET`**.

QR-nya berisi: `<APP_BASE_URL>/body-scan?claim=<scan_id>&device=<device_id>`.

---

## Bagian 5 — Uji TANPA timbangan

Ini membuktikan `VISBODY_WEBHOOK_SECRET` sudah benar dan route-nya hidup, sebelum
melibatkan Visbody dan tanpa siapa pun naik timbangan.

```bash
VISBODY_WEBHOOK_SECRET='<nilai dari Visbody>' \
  ./scripts/visbody-test-webhook.sh https://<url-staging>
```

Yang diharapkan: skenario 1 → `200 {"code":0}`; skenario 2, 3, 4 → `401`.

- Semua `404` → deploy belum membawa route `/api/visbody/*`.
- Skenario 1 balas `401` → `VISBODY_WEBHOOK_SECRET` belum terisi atau beda.
- Skenario 3 balas `500` → bukan versi kode ini yang jalan (justru itu bug yang sudah
  diperbaiki di sini).

**Skrip ini menulis satu baris uji ke DB.** Ditandai `scan_id` berawalan `TEST-` dan
`auth_user_id` NULL, jadi tidak muncul di halaman member mana pun. Hapus setelah selesai:

```sql
delete from public.my20fit_visbody_scan where scan_id like 'TEST-%';
```

---

## Bagian 6 — Uji DENGAN timbangan (satu orang, satu kali naik)

1. Satu orang yang **punya akun my.20fit.id** dan sedang login di ponselnya naik timbangan.
2. Selesai scan, cek baris masuk:
   ```sql
   select scan_id, device_sn, status, auth_user_id, scan_time
   from public.my20fit_visbody_scan order by created_at desc limit 5;
   ```
   Harus ada baris baru `status = 'received'`, `auth_user_id` NULL. **Kalau tidak ada
   baris sama sekali → webhook tidak sampai** (balik ke Bagian 4/5, jangan lanjut).
3. Orang itu memindai **QR di layar timbangan** dengan ponselnya → terbuka
   `/body-scan?claim=…` → tekan tombol klaim.
4. Cek lagi:
   ```sql
   select s.scan_id, s.status, s.last_error, b.body_weight, b.body_fat_percentage
   from public.my20fit_visbody_scan s
   left join public.my20fit_visbody_body b using (scan_id)
   order by s.created_at desc limit 5;
   ```
   Yang diharapkan: `status = 'data_fetched'` dan baris hasil ukur terisi.
5. Buka `/body-scan` dan `/activity` sebagai orang itu. Kartu "Status Tubuh" di `/activity`
   harus berganti dari BMI perkiraan menjadi angka terukur.

**Jendela klaim 30 menit.** Lewat itu, QR-nya menolak dengan `claim_expired` — disengaja,
karena tautan QR tidak memuat rahasia apa pun. Kalau 30 menit terasa terlalu pendek di
lapangan, itu satu angka di `server.js` (`VISBODY_CLAIM_WINDOW_MS`) — bilang saja.

---

## Bagian 7 — Kalau gagal, di mana bacanya

Penyebab kegagalan pengambilan data **disimpan**, tidak dibuang:

```sql
select scan_id, status, last_error, updated_at
from public.my20fit_visbody_scan
where status = 'failed' order by updated_at desc limit 10;
```

| Gejala | Kemungkinan besar |
|---|---|
| tidak ada baris masuk sama sekali | webhook belum didaftarkan, atau signature ditolak (401) |
| `status` mentok di `received` | tidak ada yang memindai QR / klaim belum ditekan |
| `status` `failed`, `last_error` menyebut token | `VISBODY_ACCOUNT_KEY`/`SECRET` salah |
| `status` `failed`, "balasan Visbody tanpa body_composition" | scan belum selesai diproses di sisi Visbody, atau bentuk balasannya beda dari dugaan |
| klaim balas `409 already_claimed` | scan itu sudah diklaim akun lain — **disengaja, tidak dipindahkan** |

---

## Bagian 8 — Keputusan yang sudah diambil, supaya tidak ditanyakan ulang

- **Scan TIDAK dicocokkan otomatis ke akun lewat nama/email yang diketik di timbangan.**
  Identitas itu tidak terverifikasi; mencocokkannya otomatis = menyerahkan data komposisi
  tubuh seseorang ke akun yang belum tentu dia. Kepemilikan **hanya** lewat member memindai
  QR sendiri. Ini mengikuti aturan pemilik: cocokkan hanya lewat identitas yang PASTI &
  TERVERIFIKASI.
- **Nama tabel pakai prefix `my20fit_visbody_*`**, bukan `visbody_scans` seperti di
  spesifikasi — project Supabase dipakai bersama app lain (CLAUDE.md §4).
- **Nilai yang hilang disimpan NULL, bukan 0.** Berat badan 0 kg itu angka palsu yang akan
  mencemari chart tren.
- **QR dibuat di server kita**, bukan dikirim ke layanan QR pihak ketiga.

## Bagian 8b — Beda dari contoh kode di spesifikasi, disengaja

| Contoh di spesifikasi | Yang dipakai | Alasan |
|---|---|---|
| `timingSafeEqual` tanpa cek panjang | panjang dicek dulu | `timingSafeEqual` **melempar** kalau panjang beda → signature palsu berbuah 500, bukan 401 |
| HMAC atas `JSON.stringify(req.body)` | `req.rawBody` | serialisasi ulang ≠ byte yang ditandatangani Visbody → verifikasi selalu gagal |
| Idempotency: `select….single()` per `event_id` | `upsert` on `scan_id` + unique index parsial `event_id` | `.single()` **error** saat barisnya belum ada — jalur "belum pernah diproses" justru melempar |
| QR lewat `api.qrserver.com` | dibuat di server kita (`js/qrcode-generator.js`) | `scan_id` tidak perlu bocor ke pihak ketiga |

Dua beda kecil lagi: tautan di QR memakai `/body-scan?claim=<scan_id>` (bukan
`/body-scan/bind?…`) supaya tidak perlu route tambahan; dan nama env service key di repo
ini **`SUPABASE_SERVICE_KEY`**, bukan `SUPABASE_SERVICE_ROLE_KEY` seperti di spesifikasi —
jangan bikin variabel baru, yang lama sudah terisi.

`VISBODY_DEVICE_SN` yang disebut spesifikasi **tidak dipakai** kode saat ini: `device_sn`
diambil dari body webhook. Kalau nanti mau menolak webhook dari perangkat di luar milik
20FIT, SN itu bisa jadi allowlist — bilang saja, tapi ingat konsekuensinya waktu unit
bertambah.

## Bagian 9 — Sisa pekerjaan setelah integrasi ini dinyatakan jalan

1. Tambahkan `my20fit_visbody_scan` + `my20fit_visbody_body` ke `USER_DATA_TABLES` di
   `server.js` (ekspor data pribadi user) — belum dilakukan, sengaja, sampai jalurnya
   terbukti hidup.
2. Putuskan kebijakan pembersihan scan yang tak pernah diklaim (mis. > 90 hari).
3. **BMR dari timbangan belum dipakai di `/calories`.** Spesifikasi meminta
   `basal_metabolic_rate × 1.55` ditulis ke `calorie_profiles.daily_calorie_target`.
   **Tabel `calorie_profiles` TIDAK ADA di database ini** — dicek langsung ke
   `information_schema`; yang ada hanya `my20fit_visbody_body` dan `my20fit_visbody_scan`.
   Jadi potongan kode itu tidak bisa dijalankan apa adanya. Lagi pula menimpa target
   kalori milik user perlu keputusan pemilik. Saran tetap: tampilkan BMR sebagai
   **referensi** di samping target, bukan menimpa target diam-diam.
