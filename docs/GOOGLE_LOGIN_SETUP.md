# Panduan Setup Login Google — my.20fit.id

> **Untuk:** pemilik repo (zidni@20fit.id) · **Dibuat:** 2026-09-17
> Panduan klik-per-klik. Tidak perlu paham teknis — ikuti saja urutannya.
> Nilai yang harus di-copy sudah ditulis PERSIS di sini, bukan contoh/placeholder.

---

## Ringkasan 10 detik

Login Google di web **tidak lagi** memakai tombol Google Identity Services (GIS).
Sekarang jalurnya: **browser → Supabase → Google → balik ke my.20fit.id**.

Artinya yang menentukan berhasil/gagal adalah **Google Cloud Console + Supabase**.
**Railway TIDAK menentukan login Google di web** (lihat Bagian C — Railway hanya
untuk app mobile).

Error yang kamu lihat sekarang — `Error 400: redirect_uri_mismatch` — artinya:
Google menerima permintaannya, tapi **alamat balik (redirect URI) milik Supabase
belum didaftarkan** di OAuth client Google. Itu satu kolom yang harus diisi.
Bagian A menyelesaikannya.

**Urutan wajib: A → B → D.** Bagian C opsional (hanya untuk app mobile).

---

## Nilai-nilai yang akan dipakai (copy dari sini)

| Nama | Nilai PERSIS |
|---|---|
| **Redirect URI Supabase** (paling penting) | `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback` |
| Origin produksi | `https://my.20fit.id` |
| Origin staging | `https://profile20fit-staging.up.railway.app` |
| Redirect balik ke app (produksi) | `https://my.20fit.id/login` |
| Redirect balik ke app (staging) | `https://profile20fit-staging.up.railway.app/login` |
| Project Supabase | `20FIT ALL DATA` (ref `cpvzwqptzcxnwzfzgrmt`) |
| Project Google Cloud | nomor `26509397037` |

> **Cek dulu alamat staging.** Nilai staging di atas diambil dari alamat yang
> terlihat di browser kamu. Kalau di Railway alamatnya beda, pakai yang di Railway.
> Cara cek: Railway → service `profile20fit` → tab **Settings** → bagian
> **Domains**. Salin persis, **tanpa garis miring di ujung**.

---

# BAGIAN A — Google Cloud Console

Tujuan: bikin OAuth client bertipe **Web application**, lalu daftarkan alamat
balik milik Supabase.

### A1. Masuk

1. Buka `https://console.cloud.google.com/`
2. Login pakai akun Google yang punya akses project 20FIT.
3. Di **kiri atas**, di sebelah tulisan "Google Cloud", ada **kotak pemilih
   project**. Klik kotak itu.
4. Pilih project dengan nomor **`26509397037`**.
   (Nomor project kelihatan di kolom "ID" pada daftar. Kalau tidak ketemu,
   ketik nomornya di kotak pencarian di jendela itu.)
5. Pastikan nama project yang terpilih sudah berubah di kiri atas.

### A2. Buka halaman Credentials

1. Klik ikon **☰** (tiga garis) di **paling kiri atas**.
2. Pilih **APIs & Services**.
3. Pilih **Credentials**.

Kamu sekarang di halaman berisi daftar "OAuth 2.0 Client IDs".

### A3. Lihat dulu: apa sudah ada client Web?

Di tabel **OAuth 2.0 Client IDs**, perhatikan kolom **Type**.

- Kalau **sudah ada** baris bertipe **Web application** → **lewati A4**,
  langsung ke **A5** dan klik baris itu untuk mengeditnya.
- Kalau **belum ada** (yang ada hanya `iOS` / `Android`) → lanjut **A4**.

> Baris bertipe **iOS** JANGAN dihapus dan JANGAN diubah — itu dipakai app mobile.

### A4. Bikin OAuth client "Web application"

1. Di bagian atas halaman, klik **+ CREATE CREDENTIALS**.
2. Pilih **OAuth client ID**.
3. Kolom **Application type** → pilih **Web application**.
   ⚠️ Harus **Web application**. Bukan iOS, bukan Android. Ini inti masalahnya.
4. Kolom **Name** → ketik: `my.20fit.id web`
   (Nama bebas, cuma label. Tidak berpengaruh ke fungsi.)
5. Jangan klik CREATE dulu — isi dulu A5 dan A6 di halaman yang sama.

### A5. Authorized redirect URIs — INI YANG MEMPERBAIKI ERROR KAMU

Cari bagian **Authorized redirect URIs** (biasanya di bawah).

1. Klik **+ ADD URI**.
2. Tempel PERSIS:

```
https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback
```

3. Periksa ulang: tidak ada spasi, tidak ada garis miring `/` di ujung,
   dan diawali `https://`.

> **Kenapa alamat Supabase, bukan alamat kita?** Karena alur loginnya lewat
> Supabase. Google mengembalikan user ke Supabase dulu, baru Supabase
> mengembalikan ke my.20fit.id. Google cuma perlu tahu alamat Supabase.
> Inilah sebabnya error kamu berbunyi `redirect_uri_mismatch`.

### A6. Authorized JavaScript origins — opsional

Bagian ini **tidak dipakai** oleh alur login yang sekarang. Boleh dikosongkan.

Kalau kamu ingin mengisinya untuk jaga-jaga (tidak merusak apa pun),
klik **+ ADD URI** dan tambahkan dua baris ini, satu per satu:

```
https://my.20fit.id
https://profile20fit-staging.up.railway.app
```

⚠️ Tanpa garis miring di ujung, tanpa `/login`.

### A7. Simpan & ambil kredensialnya

1. Klik tombol **CREATE** (atau **SAVE** kalau kamu sedang mengedit client lama).
2. Muncul jendela **"OAuth client created"** berisi dua nilai:
   - **Client ID** — bentuknya panjang, diakhiri `.apps.googleusercontent.com`
   - **Client secret** — bentuknya acak, biasanya diawali `GOCSPX-`
3. **Copy KEDUANYA** ke notepad/notes. Kamu butuh keduanya di Bagian B.
   - Kalau jendelanya terlanjur tertutup: klik nama client-nya di daftar
     Credentials, nilainya ada di kanan atas. Secret bisa dilihat/dibuat ulang
     dari situ.

> 🔒 **Jangan tempel Client secret ke chat, GitHub, atau file di repo.**
> Tempatnya cuma di dashboard Supabase (Bagian B).

---

# BAGIAN B — Supabase

Tujuan: masukkan kredensial dari Bagian A, dan izinkan alamat balik ke app kita.

### B1. Masuk

1. Buka `https://supabase.com/dashboard`
2. Login.
3. Pilih project **`20FIT ALL DATA`**.

### B2. Isi provider Google

1. Di menu kiri, klik ikon **Authentication** (gembok).
2. Klik **Sign In / Providers** (di beberapa versi namanya **Providers**).
3. Di daftar provider, cari **Google**. Klik untuk membukanya.
4. Nyalakan tombol **Enable Sign in with Google** sampai posisinya **ON/hijau**.
5. Isi kolomnya:

| Kolom di Supabase | Isi dengan |
|---|---|
| **Client IDs** (atau "Client ID (for OAuth)") | **Client ID** dari langkah A7 |
| **Client Secret** (atau "Client Secret (for OAuth)") | **Client secret** dari langkah A7 |

6. Kalau kolom **Client IDs** sudah berisi nilai lama (client iOS):
   **jangan hapus** — tambahkan yang baru **dipisah koma**, tanpa spasi:
   `<client-id-lama>,<client-id-web-baru>`
   Kolom itu memang menerima banyak nilai.
   Client **secret** tetap satu: pakai secret client **Web**.
7. Di bawah kolom itu Supabase menampilkan **Callback URL (for OAuth)**.
   **Cocokkan** dengan yang kamu daftarkan di A5. Harus sama persis:
   `https://cpvzwqptzcxnwzfzgrmt.supabase.co/auth/v1/callback`
8. Klik **Save**.

### B3. Izinkan alamat balik ke app kita — JANGAN DILEWAT

Kalau langkah ini dilewat, login "berhasil" tapi user dilempar ke halaman yang
salah (biasanya balik ke Site URL), dan kelihatan seperti gagal.

1. Masih di **Authentication**, klik **URL Configuration**.
2. **Site URL** → isi: `https://my.20fit.id`
3. **Redirect URLs** → klik **Add URL**, tambahkan **satu per satu**:

```
https://my.20fit.id/login
https://my.20fit.id/**
https://profile20fit-staging.up.railway.app/login
https://profile20fit-staging.up.railway.app/**
```

4. Klik **Save**.

---

# BAGIAN C — Railway (OPSIONAL, bukan untuk web)

**Baca ini dulu:** mengisi env Railway **tidak akan** memperbaiki
"Access blocked" di web. Tombol Google di web sama sekali tidak memakai env ini.
Kalau tujuanmu cuma "web bisa login Google", **lewati bagian ini** — A + B sudah cukup.

Env ini hanya dipakai server saat **app mobile** mengirim ID token Google ke
`/api/fitco-google-login`. Isi bagian ini **hanya kalau** login Google di app
mobile juga bermasalah.

1. Buka `https://railway.app/` → login → pilih project **profile20fit**.
2. Klik service-nya, lalu tab **Variables**.
3. Pastikan kamu di environment yang benar (pemilih **staging / production**
   ada di bagian atas). **Isi di dua-duanya, bergantian.**

| Nama variabel (ketik persis) | Isi dengan |
|---|---|
| `GOOGLE_CLIENT_ID` | **Client ID Web** dari langkah A7 |
| `GOOGLE_CLIENT_IDS` | **Client ID iOS** (yang lama, dari daftar Credentials bertipe iOS). Kalau ada Android juga, pisah koma tanpa spasi. |

4. Klik **Add** / **New Variable** kalau namanya belum ada, atau klik nilai yang
   ada untuk mengubahnya.
5. Klik **Deploy** / **Apply changes** kalau Railway memintanya.
   Railway **redeploy otomatis** setelah variabel berubah — tunggu status
   deployment jadi **Success** (sekitar 1–2 menit).

> 🔒 Kedua nilai ini **bukan** rahasia (Client ID boleh publik), tapi tetap jangan
> ditulis ke file di repo — CI akan memblokirnya.

---

# BAGIAN D — Setelah kamu isi: kabari saya

Kabari saya kalau A dan B sudah selesai. Saya akan:

1. **Tes di staging** — buka `/login`, klik "Continue with Google",
   pastikan tidak ada "Access blocked" dan user mendarat di dashboard.
2. **Cek user lama tidak dobel.** Angka pembanding sudah saya catat **hari ini,
   sebelum perubahan**:

   | Ukuran | Sebelum |
   |---|---|
   | Total user (`auth.users`) | **2569** |
   | Email dobel | **0** |
   | User punya identitas Google | **286** |
   | User dengan >1 provider | **20** |

   Setelah beberapa user Google lama login, saya ukur ulang. Kalau "email dobel"
   masih **0** dan "user punya identitas Google" tidak melonjak, artinya tidak ada
   akun kembar.
3. **Cek token tidak nyangkut di URL** (lihat catatan teknis di bawah).
4. Kalau staging mulus → saya minta approval kamu, baru ke production.

---

## Kalau masih gagal — arti pesan errornya

| Pesan di layar | Artinya | Perbaikannya |
|---|---|---|
| `Error 400: redirect_uri_mismatch` | Redirect URI Supabase belum terdaftar di Google | Ulangi **A5** — cek ada tidaknya garis miring di ujung |
| `Error 401: invalid_client` | Client ID/secret di Supabase salah atau tertukar | Ulangi **B2** — copy ulang dari A7 |
| `Access blocked: no registered origin` | Client-nya bertipe iOS, bukan Web | Ulangi **A4** — pastikan **Web application** |
| Login sukses tapi balik ke halaman aneh | Redirect URL belum diizinkan Supabase | Ulangi **B3** |
| "Login Google sedang tidak tersedia" | Provider Google di Supabase belum ON | Ulangi **B2** langkah 4 |

Kalau pesannya lain dari daftar ini, **screenshot layarnya** dan kirim ke saya —
termasuk alamat di address bar (bagian `authError=...` berguna).

---

## Catatan teknis (tidak perlu kamu kerjakan)

- **Jalur web:** `login.html` → `Auth.googleOAuth()` → `supabase.auth.signInWithOAuth`
  dengan `redirectTo = <origin>/login` (`js/auth.js` ~baris 213).
  Tidak ada GIS, tidak ada `GOOGLE_CLIENT_ID` di jalur ini.
- **Jalur mobile:** app kirim ID token → `POST /api/fitco-google-login` →
  `verifyGoogleIdToken` mencocokkan `aud` dengan `GOOGLE_CLIENT_ID` +
  `GOOGLE_CLIENT_IDS` (`server.js` ~baris 1623). Ini yang butuh Bagian C.
- **Akun tidak dobel:** Supabase mencocokkan identitas Google lewat `sub` milik
  Google, bukan lewat Client ID, jadi ganti client seharusnya tidak membuat baris
  `auth.users` baru. **Ini belum saya uji langsung** — karena itu ada langkah
  pengukuran di Bagian D, bukan sekadar janji.
- **Token di URL:** supabase-js yang kita pakai (2.108.2) memakai *implicit flow*,
  jadi Google mengembalikan token di **fragment** URL (`#access_token=...`).
  Fragment **tidak pernah dikirim ke server**, jadi tidak masuk log Railway/Google.
  Setelah sesi terpasang, supabase-js langsung mengosongkan fragment itu
  (`window.location.hash = ""`). Jadi token tidak tertinggal di address bar.
  Alternatif yang lebih ketat (*PKCE flow*, token tidak pernah muncul di URL sama
  sekali) **belum** dipakai karena halaman callback lain di ekosistem 20FIT
  (photo, calorietracker, menu) masih bergantung pada fragment implicit —
  menggantinya berisiko memutus alur yang sudah jalan. **TANYA PEMILIK REPO**
  kalau ingin ditempuh; itu pekerjaan terpisah.
