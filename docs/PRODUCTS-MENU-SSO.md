# 20FIT Products Menu + SSO — Panduan untuk Developer

> **Sumber kebenaran lintas produk 20FIT.** Dokumen ini disimpan di repo
> `profile20fit` (my.20fit.id) supaya tim produk lain — `recepie`/`workout`/
> `calorietracker`/`medicalscanner`/dll — bisa memasang Products menu + SSO yang
> seragam. Isi di bawah adalah spec yang diberikan pemilik proyek, disimpan apa
> adanya. Bagian **"Catatan editor"** di bawah BUKAN bagian dari spec asli — itu
> pemetaan jujur ke kondisi my.20fit saat ini, supaya tidak menyesatkan.

---

> ### Catatan editor (status implementasi di my.20fit, per 2026-09-23 — BUKAN bagian spec)
>
> Spec di bawah ditulis dengan contoh React. **my.20fit.id sendiri stack-nya
> vanilla HTML/CSS/JS (tanpa React/bundler — lihat `CLAUDE.md` §5)**, jadi
> konsepnya sama tapi implementasinya beda. Yang sudah terpasang & yang masih beda:
>
> - **Menu:** di my.20fit dipasang lewat `js/universal-nav.js` (grid embedded di
>   dropdown "Products" pada `dashboard.html`), bukan komponen React `ProductsMenu`.
>   16 produk, 5 grup, ikon dari SVG repo — sudah sesuai spec §1–§2.
> - **SSO:** my.20fit saat ini pakai `Auth.ssoTo(key, subPath)` (relay token lewat
>   URL fragment, peta tujuan "ECO" di `js/auth.js`), **belum** pakai edge function
>   `sso-generate` / `sso-consume` seperti di §4. Model edge-function di §4 adalah
>   desain yang diusulkan spec ini; **konfirmasi ke pemilik apakah kedua edge
>   function itu sudah di-deploy** sebelum tim lain menggantungkan diri padanya
>   (FAQ di bawah sendiri menyebut ada fallback kalau belum deploy). BELUM
>   TERVERIFIKASI apakah `sso-generate`/`sso-consume` sudah live.
> - **Host recipe:** produksi live = `recepie.20fit.id` (ejaan ini memang dipakai;
>   `menu.20fit.id` belum ada DNS — lihat `js/auth.js`). MENU_ITEMS §2 menulis
>   `recipe.20fit.id`; `getCurrentAppId()` §5 sudah memetakan kedua ejaan
>   (`recipe.20fit.id` **dan** `recepie.20fit.id`). Samakan `url` recipe dengan host
>   yang benar-benar live sebelum dipakai.
> - **Host calorie:** `calorietracker.20fit.id` benar & live (`calories.20fit.id`
>   NXDOMAIN — jangan dipakai). Sudah sesuai spec.
> - **Booking di my.20fit:** halaman yang ADA = `book-class.html`, `book-coach.html`,
>   `book-doctor.html`, dan `classes.html`. **Tidak ada `book-recovery.html`** — di
>   my.20fit "Book Recovery" dilayani via `/classes?venue=clinic`. Spec §2 menulis
>   `/book-recovery`; sesuaikan target ke rute yang benar-benar ada di produk kamu.
> - **Anon key:** literal `SUPABASE_ANON_KEY` di §4 adalah key **publik** (role=anon,
>   dilindungi RLS) — aman di client dan memang sudah di-commit di repo ini
>   (`js/auth.js`, `server.js`) serta di-allowlist di `.gitleaks.toml`. Yang **tidak
>   boleh** pernah masuk kode/commit adalah `service_role` key (rahasia → env only,
>   lihat `CLAUDE.md` §3).

---

## Apa Ini?

Dokumen ini berisi semua yang kamu butuhkan untuk memasang Products menu dan Single Sign-On (SSO) di produk 20FIT yang kamu kerjakan. Ikuti panduan ini persis — jangan improvisasi.

## 1. Products Menu — Apa yang Harus Dipasang

Setiap produk 20FIT harus punya tombol "Products" di bagian atas halaman. Saat diklik, muncul dropdown berisi semua produk 20FIT dalam layout grid 3 kolom, dikelompokkan per kategori.

### Tampilan Tombol

Di top-right halaman, sejajar dengan user avatar:

```
[👤 Profile User ▼]  [🔲 Products ▼]  [EN]  [ID]  [Dark]
```

* Profile User = avatar + nama user yang sedang login (misal "jeff"). Klik → dropdown profil (Profil Saya, Riwayat Pembelian, Pengaturan, Keluar). Kalau belum login, tampilkan tombol "Masuk".
* Products = tombol yang buka mega menu semua produk 20FIT (lihat di bawah).

### Tampilan Dropdown (saat diklik)

```
ALL 20FIT PRODUCTS

  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ [icon]   │  │ [icon]   │  │ [icon]   │
  │ Home     │  │ My 20FIT │  │ Recipe   │
  └──────────┘  └──────────┘  └──────────┘

HEALTH
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Calorie  │  │ MCU      │  │ Body     │
  │ Tracker  │  │ Scanner  │  │ Scan     │
  └──────────┘  └──────────┘  └──────────┘

ACTIVITY
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Workout  │  │ Progress │  │ Media    │
  └──────────┘  └──────────┘  └──────────┘

EVENT
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Photo    │  │ Ticket   │  │ Talent   │
  └──────────┘  └──────────┘  └──────────┘

BOOKING
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Book     │  │ Book     │  │ Book     │
  │ Class    │  │ Coach    │  │ Doctor   │
  └──────────┘  └──────────┘  └──────────┘
  ┌──────────┐
  │ Book     │
  │ Recovery │
  └──────────┘
```

* Produk yang sedang aktif (halaman ini) ditandai border hijau + "Kamu di sini"
* Icon pakai SVG dari repo `profile20fit` (folder icons) — bukan emoji
* Klik di luar dropdown → tutup
* Tekan Escape → tutup
* Mobile: fullscreen overlay, 2 kolom

## 2. Data Menu — Copy Persis

```javascript
const MENU_ITEMS = [
  // === Utama ===
  { id: 'home', label: 'Home', description: 'Direktori Olahraga', icon: 'home', url: 'https://20fit.id', color: '#1a1a1a' },
  { id: 'my20fit', label: 'My 20FIT', description: 'Member Portal', icon: 'my20fit', url: 'https://my.20fit.id', color: '#6366F1' },
  { id: 'recipe', label: 'Recipe', description: 'Menu & Resep Sehat', icon: 'recipe', url: 'https://recipe.20fit.id', color: '#16A34A' },

  // === Health ===
  { id: 'calorie', label: 'Calorie Tracker', description: 'Hitung Kalori Harian', icon: 'calorie', url: 'https://calorietracker.20fit.id', color: '#F97316' },
  { id: 'mcu', label: 'MCU Scanner', description: 'Baca Hasil Medical Check-Up', icon: 'mcu', url: 'https://medicalscanner.20fit.id', color: '#0EA5E9' },
  { id: 'bodyscan', label: 'Body Scan', description: 'Visbody Body Composition', icon: 'bodyscan', url: 'https://my.20fit.id/body-scan', color: '#EC4899' },

  // === Activity ===
  { id: 'workout', label: 'Workout', description: 'Streaming Latihan', icon: 'workout', url: 'https://workout.20fit.id', color: '#EF4444' },
  { id: 'progress', label: 'Progress', description: 'Tracking Progres Fitness', icon: 'progress', url: 'https://my.20fit.id/progress', color: '#F43F5E' },
  { id: 'media', label: 'Media', description: 'Blog & Artikel', icon: 'media', url: 'https://media.20fit.id', color: '#8B5CF6' },

  // === Event ===
  { id: 'photo', label: 'Photo', description: 'Foto Event', icon: 'photo', url: 'https://photo.20fit.id', color: '#EC4899' },
  { id: 'ticket', label: 'Ticket', description: 'Tiket & Event', icon: 'ticket', url: 'https://ticket.20fit.id', color: '#14B8A6' },
  { id: 'talent', label: 'Talent', description: 'Talent & Event Organizer', icon: 'talent', url: 'https://talent.20fit.id', color: '#3B82F6' },

  // === Booking ===
  { id: 'book-class', label: 'Book Class', description: 'Arena & Gym', icon: 'bookclass', url: 'https://my.20fit.id/book-class', color: '#F59E0B' },
  { id: 'book-coach', label: 'Book Coach', description: 'Personal Training', icon: 'bookcoach', url: 'https://my.20fit.id/book-coach', color: '#F59E0B' },
  { id: 'book-doctor', label: 'Book Doctor', description: 'Konsultasi Dokter', icon: 'bookdoctor', url: 'https://my.20fit.id/book-doctor', color: '#0EA5E9' },
  { id: 'book-recovery', label: 'Book Recovery', description: 'Fisioterapi & Recovery', icon: 'bookrecovery', url: 'https://my.20fit.id/book-recovery', color: '#EF4444' },
];

const MENU_GROUPS = [
  { label: null, items: ['home', 'my20fit', 'recipe'] },
  { label: 'Health', items: ['calorie', 'mcu', 'bodyscan'] },
  { label: 'Activity', items: ['workout', 'progress', 'media'] },
  { label: 'Event', items: ['photo', 'ticket', 'talent'] },
  { label: 'Booking', items: ['book-class', 'book-coach', 'book-doctor', 'book-recovery'] },
];
```

## 3. SSO — Satu Akun, Langsung Masuk

### Masalah

Supabase Auth simpan session di localStorage. localStorage itu per-subdomain. Jadi kalau user login di `calorietracker.20fit.id`, session-nya tidak terlihat di `recipe.20fit.id`.

### Solusi: Token Relay

Saat user klik menu untuk pindah ke subdomain lain:

```
1. App saat ini generate ONE-TIME TOKEN (expire 60 detik)
2. Redirect ke: target.20fit.id?sso_token=xxx
3. App target consume token → set session lokal
4. User langsung masuk ✅
```

### ATURAN PALING PENTING

```
✅ Klik menu → navigateWithSSO(url) → langsung masuk di produk tujuan
❌ Klik menu → window.location.href = url → SALAH, session tidak terbawa

Harus: navigateWithSSO()
Bukan: window.location.href
```

## 4. File yang WAJIB Ada — `lib/auth-sso.js`

Copy file ini persis ke project kamu. Jangan bikin versi sendiri.

```javascript
// lib/auth-sso.js
// WAJIB IDENTIK di semua produk 20FIT

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cpvzwqptzcxnwzfzgrmt.supabase.co';
// Ini anon key PUBLIK project 20FIT (role=anon, dilindungi RLS) — aman dipakai
// di sisi client & aman di-commit. JANGAN pernah taruh `service_role` key di sini:
// itu rahasia dan hanya boleh lewat env server (lihat CLAUDE.md §3).
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwdnp3cXB0emN4bnd6Znpncm10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MzE0MzksImV4cCI6MjA5MTIwNzQzOX0.DIP-tTFxa3GHMhT6b1Tq-Zz0a24P-vbU9ixEtITbqpI';
const AUTH_HUB = 'https://my.20fit.id';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Cek auth saat app load (WAJIB login → redirect kalau belum) ───
export async function checkAuthOrRedirect() {
  const ssoToken = new URLSearchParams(window.location.search).get('sso_token');
  if (ssoToken) {
    const session = await consumeSSOToken(ssoToken);
    window.history.replaceState({}, '', window.location.pathname);
    if (session) return session.user;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;
  window.location.href = `${AUTH_HUB}/auth/login?redirect=${encodeURIComponent(window.location.href)}`;
  return null;
}

// ─── Cek auth TANPA redirect (untuk landing page yang boleh guest) ───
export async function getSessionSilent() {
  const ssoToken = new URLSearchParams(window.location.search).get('sso_token');
  if (ssoToken) {
    const session = await consumeSSOToken(ssoToken);
    window.history.replaceState({}, '', window.location.pathname);
    return session;
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── PAKAI INI saat klik menu ke subdomain lain ───
export async function navigateWithSSO(targetUrl) {
  const { data: { session } } = await supabase.auth.getSession();

  // Belum login → redirect ke login hub
  if (!session) {
    window.location.href = `${AUTH_HUB}/auth/login?redirect=${encodeURIComponent(targetUrl)}`;
    return;
  }

  // Target = subdomain sama → langsung navigate
  const currentHost = window.location.hostname;
  const targetHost = new URL(targetUrl).hostname;
  if (currentHost === targetHost) {
    window.location.href = targetUrl;
    return;
  }

  // Target = subdomain beda → generate SSO token, redirect dengan token
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sso-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ redirect_to: targetHost }),
    });
    if (!res.ok) throw new Error('Token generation failed');
    const { token } = await res.json();
    const sep = targetUrl.includes('?') ? '&' : '?';
    window.location.href = `${targetUrl}${sep}sso_token=${token}`;
  } catch {
    window.location.href = targetUrl; // fallback
  }
}

// ─── Internal: consume SSO token ───
async function consumeSSOToken(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/sso-consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;
    const { access_token, refresh_token } = await res.json();
    const { data } = await supabase.auth.setSession({ access_token, refresh_token });
    return data.session;
  } catch { return null; }
}

// ─── Logout ───
export async function logoutEverywhere() {
  await supabase.auth.signOut();
  window.location.href = `${AUTH_HUB}/auth/login?action=logout`;
}
```

## 5. Deteksi Halaman Aktif

Supaya menu bisa highlight "Kamu di sini" dengan benar:

```javascript
function getCurrentAppId() {
  const host = window.location.hostname;
  const path = window.location.pathname;

  const hostMap = {
    '20fit.id': 'home', 'www.20fit.id': 'home',
    'my.20fit.id': 'my20fit',
    'recipe.20fit.id': 'recipe', 'recepie.20fit.id': 'recipe',
    'calorietracker.20fit.id': 'calorie',
    'medicalscanner.20fit.id': 'mcu',
    'media.20fit.id': 'media',
    'workout.20fit.id': 'workout',
    'photo.20fit.id': 'photo',
    'ticket.20fit.id': 'ticket',
    'talent.20fit.id': 'talent',
  };

  // Halaman di dalam my.20fit.id → cek path
  if (host === 'my.20fit.id' || host.includes('profile20fit')) {
    const pathMap = {
      '/body-scan': 'bodyscan',
      '/progress': 'progress',
      '/book-class': 'book-class',
      '/book-coach': 'book-coach',
      '/book-doctor': 'book-doctor',
      '/book-recovery': 'book-recovery',
      '/calories': 'calorie',
      '/mcu': 'mcu',
      '/recipes': 'recipe',
    };
    for (const [prefix, id] of Object.entries(pathMap)) {
      if (path.startsWith(prefix)) return id;
    }
    return 'my20fit';
  }

  return hostMap[host] || null;
}
```

## 6. onClick Menu Item — Smart Routing

```javascript
import { navigateWithSSO } from './lib/auth-sso';

function handleMenuClick(item) {
  const currentHost = window.location.hostname;
  const targetHost = new URL(item.url).hostname;

  if (currentHost === targetHost) {
    // Subdomain sama → SPA navigate (React Router / langsung)
    const path = new URL(item.url).pathname;
    navigate(path); // atau window.location.pathname = path
  } else {
    // Subdomain beda → SSO token relay
    navigateWithSSO(item.url);
  }
}
```

Semua klik menu item WAJIB lewat `handleMenuClick()`. Jangan pernah langsung `<a href={url}>` tanpa SSO.

## 7. Pasang di App Root

```jsx
import { useEffect, useState } from 'react';
import { getSessionSilent, supabase } from './lib/auth-sso';
import ProductsMenu from './components/ProductsMenu';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionSilent()
      .then((session) => setUser(session?.user || null))
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user || null)
    );
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div>Memuat...</div>;

  return (
    <>
      {/* Products menu di top-right, selalu tampil */}
      <ProductsMenu user={user} />
      {/* ... rest of your app ... */}
    </>
  );
}
```

## 8. Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 9. Contoh Lengkap — Cara User Merasakan Ini

```
nicolezoe83@gmail.com login di calorietracker.20fit.id

1. Klik "Products" di top-right
2. Dropdown muncul — 16 produk, grouped
3. "Calorie Tracker" punya border hijau + "Kamu di sini"
4. Klik "MCU Scanner"
5. Redirect ke medicalscanner.20fit.id?sso_token=xxx
6. medicalscanner consume token → set session
7. Langsung masuk sebagai nicolezoe83@gmail.com ✅
8. TIDAK ADA form login, TIDAK ADA "buat akun"

9. Di medicalscanner, klik "Products" lagi
10. Klik "Recipe"
11. Redirect ke recipe.20fit.id?sso_token=yyy
12. Langsung masuk sebagai nicolezoe83@gmail.com ✅

13. Di recipe, klik "Book Doctor"
14. Redirect ke my.20fit.id/book-doctor?sso_token=zzz
15. Langsung masuk sebagai nicolezoe83@gmail.com ✅

Semua produk, satu akun, tanpa login ulang.
```

## 10. Checklist Sebelum Deploy

```
✅ lib/auth-sso.js ada dan IDENTIK dengan panduan ini
✅ @supabase/supabase-js terinstall
✅ Products menu terpasang di top-right halaman
✅ Menu punya 16 items, 5 groups (sesuai MENU_ITEMS di atas)
✅ Icon pakai SVG dari repo profile20fit, bukan emoji
✅ getCurrentAppId() terpasang — "Kamu di sini" highlight benar
✅ handleMenuClick() pakai navigateWithSSO() untuk beda subdomain
✅ App root handle ?sso_token= di URL saat load (sudah otomatis via auth-sso.js)
✅ Klik di luar dropdown → tutup. Escape → tutup.
✅ Mobile responsive: fullscreen overlay, 2 kolom
✅ Test: login di satu produk → klik menu ke produk lain → langsung masuk tanpa login lagi
```

## FAQ

**Q: Kalau user belum login sama sekali, apa yang terjadi saat klik menu?**
A: `navigateWithSSO()` deteksi tidak ada session → redirect ke `my.20fit.id/auth/login?redirect=...` → setelah login, redirect balik ke produk tujuan.

**Q: Kalau edge function `sso-generate` belum di-deploy?**
A: `navigateWithSSO()` akan fallback ke redirect biasa (tanpa token). User harus login ulang di produk tujuan. Deploy edge function untuk pengalaman SSO penuh.

**Q: User avatar di sebelah Products — dari mana datanya?**
A: Dari `supabase.auth.getUser()` → `user.user_metadata.full_name` dan `user.email`. Kalau ada foto profil: `user.user_metadata.avatar_url`.

**Q: Aku kerja di produk yang pakai framework bukan React (Vue/Svelte/vanilla). Gimana?**
A: Logic-nya sama — `auth-sso.js` cuma pakai Supabase JS client + fetch, tidak ada dependency React. Tinggal adapt component dropdown ke framework kamu. Yang penting: `navigateWithSSO()` dipanggil saat klik menu. (Contoh vanilla yang sudah jalan: `js/universal-nav.js` + `Auth.ssoTo()` di repo ini.)
