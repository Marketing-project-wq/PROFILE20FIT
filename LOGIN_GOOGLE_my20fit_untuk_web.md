# Login dengan Google — my.20fit.id Web (terhubung dengan App my20fit)

Dokumen untuk developer **my.20fit.id (web)**. Tujuan: web pakai login Google **yang sama** dengan
aplikasi my20fit, sehingga **akun-nya sama** (user yang login di app dan di web = user yang sama).

> **Kunci utama:** yang bikin akun "nyambung" bukan tombol Google-nya, tapi **project Supabase yang
> sama**. Supabase Auth adalah satu-satunya sumber identitas. Selama web pakai project Supabase yang
> sama (URL + key di bawah), user yang login lewat Google di web = user yang sama dengan di app —
> otomatis, tanpa sinkronisasi tambahan.

Per 21 Sep 2026: project ini punya **2.391 user email** + **286 user Google** (aktif dipakai app).

---

## 1. Kredensial project (aman ditaruh di frontend)

| | Nilai |
|---|---|
| Supabase URL | `https://cpvzwqptzcxnwzfzgrmt.supabase.co` |
| Publishable key (disarankan) | `sb_publishable_0t9vEOYeIo_YM1__X5iNMQ_qXofEozw` |
| Anon key (legacy, alternatif) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI` |

Key `anon`/`publishable` memang untuk dipakai di client (dibatasi RLS). **JANGAN** pakai `service_role`
key di frontend.

Google provider (Client ID & Secret) **sudah dikonfigurasi di Supabase** (server-side). Web **tidak perlu**
bikin/masukin Google Client ID sendiri — cukup panggil Supabase, Supabase yang urus OAuth-nya.

---

## 2. Setup Supabase client (web)

```bash
npm install @supabase/supabase-js
```

```ts
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://cpvzwqptzcxnwzfzgrmt.supabase.co",
  "sb_publishable_0t9vEOYeIo_YM1__X5iNMQ_qXofEozw",
  {
    auth: {
      flowType: "pkce",          // aman untuk web
      detectSessionInUrl: true,   // otomatis proses callback di URL
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
```

---

## 3. Tombol "Login dengan Google"

```ts
async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`, // halaman callback web kamu
      // opsional: minta pilih akun tiap kali
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) console.error(error);
  // Browser akan redirect ke Google → balik ke redirectTo.
}
```

Itu saja untuk memulai OAuth. Supabase menangani seluruh dance OAuth Google (tidak perlu Google SDK,
tidak perlu Client ID di web).

---

## 4. Halaman callback

Buat route `/auth/callback` (sesuai `redirectTo`). Dengan `detectSessionInUrl: true`, supabase-js
otomatis menukar `code` di URL jadi sesi. Yang perlu kamu lakukan cuma tunggu sesinya siap lalu redirect:

```ts
// /auth/callback
import { supabase } from "@/lib/supabase";

useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) window.location.replace("/"); // sudah login
    else window.location.replace("/login?err=oauth");
  });
}, []);
```

(Kalau framework kamu SSR/Next.js dan mau tukar kode di server, pakai `supabase.auth.exchangeCodeForSession(code)`.)

---

## 5. WAJIB: daftarkan Redirect URL web di Supabase Dashboard

Supaya redirect balik ke web diterima, URL callback web harus ada di allowlist.

Buka **Supabase Dashboard → Authentication → URL Configuration**:
- **Site URL**: URL utama (mis. `https://my.20fit.id`).
- **Redirect URLs**: tambahkan semua yang dipakai, mis.:
  - `https://my.20fit.id/auth/callback`
  - `http://localhost:3000/auth/callback` (untuk dev)

⚠️ Kalau URL callback tidak terdaftar, login akan gagal saat balik dari Google. Ini setting yang paling
sering kelupaan. (Butuh akses dashboard — koordinasi dengan admin project / Ferdinand.)

---

## 6. Sesi & user — inilah "terhubung dengan app"

Setelah login, sesi yang kamu dapat identik dengan yang dipakai app:

```ts
const { data: { user } } = await supabase.auth.getUser();
// user.id  → auth_user_id yang SAMA dengan di app (kalau akun-nya sama)
// user.email, user.user_metadata.full_name, user.user_metadata.avatar_url (dari Google)
```

`user.id` (UUID) adalah identitas kanonik. User yang login Google di app dan di web akan punya
`user.id` yang sama → semua data yang ke-key ke `auth_user_id` otomatis nyambung.

Kirim JWT-nya ke API/edge function seperti biasa: `Authorization: Bearer <access_token>`
(`supabase.auth.getSession()` → `session.access_token`). Semua edge function my20fit (mis. `my-history`,
`redeem-fitpoints`, `start-split-payment`) memverifikasi JWT ini — jadi web bisa pakai endpoint yang sama.

---

## 7. Profil user (`my20fit_profile`)

Begitu user baru dibuat (via Google atau email), **trigger otomatis** membuat baris di
`public.my20fit_profile` (`auth_user_id`, `email`, `full_name`, `phone`). Web **tidak perlu** membuatnya
manual.

RLS: tiap user hanya bisa baca/tulis barisnya sendiri (`auth.uid() = auth_user_id`). Contoh baca profil:

```ts
const { data: profile } = await supabase
  .from("my20fit_profile")
  .select("full_name, phone, avatar_url, fitco_user_id")
  .single(); // RLS otomatis membatasi ke user yang login
```

---

## 8. Perilaku "satu akun" & jebakan

- **Google di app == Google di web** → user yang sama (di-key oleh akun Google / email terverifikasi). ✓
- **Email dulu di app, lalu Google di web (email sama)**: Supabase akan **menautkan** ke user yang sama
  bila email Google terverifikasi DAN penautan otomatis identitas aktif. **Verifikasi setting ini** di
  Dashboard → Authentication (Account linking) sebelum go-live — kalau mati, bisa terbentuk 2 akun
  terpisah untuk email yang sama. (Untuk 20FIT, email Google selalu terverifikasi, jadi umumnya aman.)
- App memakai **Google Sign-In native** (ID token), web memakai **OAuth redirect** — beda mekanisme,
  **tapi hasil identitasnya sama** karena project Supabase-nya sama. Web tidak perlu meniru flow native app.

---

## 9. (Lanjutan) Menghubungkan ke FITCO — poin & membership

Login Google + profil sudah cukup untuk "akun yang sama". Tapi **FIT Points & membership** disimpan di
sistem FITCO (MySQL), dijembatani lewat kolom `my20fit_profile.fitco_user_id` (+ `fitco_linked_at`,
`fitco_email_verified`). Trigger di §7 **tidak** mengisi `fitco_user_id` — penautan FITCO adalah langkah
terpisah yang dilakukan app setelah login (login ke FITCO API `api.20fit.id` lalu menyimpan `fitco_user_id`).

Kalau web juga perlu menampilkan/memakai FIT Points & membership, web harus melakukan penautan FITCO
yang sama. **Mekanisme persisnya ada di kode app** — minta tim app meng-share alur `link FITCO`
(endpoint FITCO + cara menyimpan `fitco_user_id`), atau koordinasi dengan Ferdinand untuk prompt
ekstraksi dari repo app. Untuk **login dasar (SSO akun yang sama)**, langkah ini opsional.

---

## 10. Checklist untuk dev web

1. [ ] `npm i @supabase/supabase-js`, init client dgn URL + publishable key di atas (§2).
2. [ ] Tombol Login → `signInWithOAuth({ provider: "google", options:{ redirectTo }})` (§3).
3. [ ] Route `/auth/callback` yang menunggu sesi lalu redirect (§4).
4. [ ] **Daftarkan Redirect URL web** di Supabase Dashboard (§5) — koordinasi admin project.
5. [ ] Pakai `session.access_token` sebagai Bearer untuk manggil edge function my20fit (§6).
6. [ ] (Opsional) tampilkan profil dari `my20fit_profile` (§7).
7. [ ] (Opsional) tautkan FITCO kalau butuh poin/membership (§9).

Pertanyaan implementasi → hubungi tim app / Ferdinand.
