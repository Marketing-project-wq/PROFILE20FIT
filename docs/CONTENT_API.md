# Content API v1 — konten menu buat produk 20FIT lain

API **read-only, key-gated** untuk produk 20FIT lain menarik **konten menu yang publik/published**
(artikel & resep) dari my.20fit.id. Semua produk 20FIT share Supabase yang sama
(`cpvzwqptzcxnwzfzgrmt`), jadi API ini bukan syarat teknis — dia **satu pintu terkontrol**:
key per-consumer, rate-limit, cuma konten publik, bisa dicabut tanpa buka DB.

- **Base URL:** `https://my.20fit.id/api/content/v1`
- **Metode:** `GET` saja (read-only).
- **Data:** cuma **published/publik**. Data privat (submission belum-approve, `auth_user_id`,
  `anon_id`, IP hash, dll) **tidak pernah** dikembalikan.

## Autentikasi

Kirim **API key di header** — jangan di URL.

```
x-api-key: <KEY>
# atau
Authorization: Bearer <KEY>
```

- Key di-set di server (Railway) lewat env **`CONTENT_API_KEYS`**, format `"namaProduk:key,lain:key2"`.
  Tiap consumer punya key sendiri. Lihat `.env.example`.
- **Panggil dari SERVER produk consumer**, bukan dari browser — supaya key tidak bocor.
- Key kosong → semua endpoint balas `503` (API nonaktif). Key salah/absen → `401`.
- Rate limit: 600 request / 5 menit / IP.

**Cek key valid:**
```bash
curl -s https://my.20fit.id/api/content/v1 -H "x-api-key: $KEY"
# -> { ok:true, consumer:"<namamu>", version:"v1", endpoints:[...] }
```

## Endpoint

### Artikel

`GET /api/content/v1/articles?category=&limit=20&offset=0`
Daftar artikel terbit (ringkasan, tanpa body). `limit` maks 50.
```json
{ "ok": true, "total": 67, "has_more": true, "articles": [
  { "id":"…","slug":"…",
    "title":{"id":"…","en":"…"}, "excerpt":{"id":"…","en":"…"},
    "category":{"id":"…","en":"…"}, "cover_url":"…", "author_name":"…", "published_at":"…" }
]}
```

`GET /api/content/v1/articles/:slug`
Satu artikel + **body** (2 bahasa). `404` kalau tak ada/tak terbit.
```json
{ "ok": true, "article": { …ringkasan…, "body":{"id":"# md…","en":"# md…"},
  "cover":{"url":"…","width":1200,"height":800} } }
```

`GET /api/content/v1/article-categories`
```json
{ "ok": true, "categories": [ { "id":"tips-gizi", "label":{"id":"Tips Gizi","en":"Nutrition Tips"}, "count": 6 } ] }
```

### Resep

`GET /api/content/v1/recipes?lang=id&source=all&diet=&q=&limit=50&offset=0`
Resep **resmi** (dari katalog 20FIT) + **member approved+published**, dinormalisasi & ditandai
`source`. `lang` = `id`|`en` (untuk nama/bahan/langkah resep resmi). `source` = `all`|`official`|`member`.
`limit` maks 100.
```json
{ "ok": true, "total": 120, "has_more": true, "lang":"id", "recipes": [
  { "key":"official:idn-a-01", "source":"official", "id":"idn-a-01",
    "name":"Nasi Goreng", "kcal":450, "macros":{"p":20,"c":60,"f":12,"fiber":null,"sugar":null,"sodium":null},
    "nutrition_is_estimate": true, "diet_types":["high-protein"], "category":"Rice",
    "ingredients":"…", "steps":"…", "steps_json":null,
    "servings":1, "cook_minutes":15, "prep_minutes":null,
    "equipment":null, "prep_note":null, "photo_url":null, "emoji":"🍚", "contributor":"20FIT Kitchen" }
]}
```

`GET /api/content/v1/recipes/:key?lang=id`
Satu resep. `key` = `official:<id>` atau `member:<uuid>`. `404` kalau tak ada.

## Catatan penting

- **Angka gizi = PERKIRAAN** (`nutrition_is_estimate: true` di tiap resep). Jangan disajikan
  sebagai angka pasti / saran ahli gizi di produk consumer.
- **CORS:** API ini dipanggil server-to-server; tidak ada header CORS khusus. Jangan panggil dari
  browser (key akan bocor + kena CORS).
- **Cache:** respons pakai `Cache-Control: public` (60–300 dtk). Aman di-cache di sisi consumer.
- **Sumber tunggal:** data = tabel/katalog yang sama dengan recipe.20fit.id. Tidak ada koleksi
  kembar; kalau konten di-update di CMS, API ikut ter-update.

## Setup (server my.20fit)

1. Set env `CONTENT_API_KEYS` di Railway (production/staging), mis. `calories:<rand>,gym:<rand>`
   (`openssl rand -hex 24` untuk tiap key).
2. Kasih tiap produk consumer key-nya (lewat kanal aman, bukan commit).
3. Consumer panggil `GET /api/content/v1/...` dari server-nya dengan header `x-api-key`.

Tanpa perubahan tabel apa pun — key murni di env server.
