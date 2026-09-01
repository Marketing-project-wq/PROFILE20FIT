-- Tahap 1 (audit foto menu): tambah kolom metadata ke my20fit_foodimg.
-- BELUM DIJALANKAN — draft untuk direview dulu (aturan kerja §5).
--
-- CATATAN PENTING soal food_key: my20fit_foodimg di-keyed oleh id resep KATALOG RESMI
-- (js/recipes.js, mis. "rice-chicken", "idn-a-01") plus suffix versi prompt
-- (-px/-v2/-v3/-v4/-v6/-v8/-ai-id). Ini BUKAN keyspace yang sama dengan
-- my20fit_food_ref.food_key (mis. "nasi kuning", "soto ayam" — dipakai fitur SCAN
-- kalori, sistem terpisah). Jadi kolom food_key di bawah TIDAK diberi foreign key
-- ke my20fit_food_ref — akan selalu 0 baris yang cocok kalau dipaksakan. Nilainya
-- adalah id resep katalog (hasil strip suffix dari kolom id), bukan food_ref.food_key.

alter table public.my20fit_foodimg
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists bytes integer,
  add column if not exists source text,
  add column if not exists food_key text,
  add column if not exists prompt_used text,
  add column if not exists generated_at timestamptz;

alter table public.my20fit_foodimg drop constraint if exists my20fit_foodimg_source_check;
alter table public.my20fit_foodimg
  add constraint my20fit_foodimg_source_check
  check (source is null or source in ('gemini', 'upload', 'external', 'unknown'));

comment on column public.my20fit_foodimg.width is
  'Lebar gambar asli dalam piksel, diukur langsung dari berkas.';
comment on column public.my20fit_foodimg.height is
  'Tinggi gambar asli dalam piksel, diukur langsung dari berkas.';
comment on column public.my20fit_foodimg.bytes is
  'Ukuran berkas dalam byte.';
comment on column public.my20fit_foodimg.source is
  'Asal gambar: gemini (AI generate via OpenRouter), upload (unggahan manual/admin), '
  'external (hotlink domain lain), unknown (tak bisa dipastikan dari data yang ada).';
comment on column public.my20fit_foodimg.food_key is
  'Id resep katalog resmi (js/recipes.js) yang dituju gambar ini (bukan '
  'my20fit_food_ref.food_key — lihat catatan di atas file migration ini).';
comment on column public.my20fit_foodimg.prompt_used is
  'Prompt yang dipakai edge function my20fit-foodimg saat generate. NULL untuk baris '
  'lama yang promptnya tidak pernah dicatat (fitur pencatatan baru ditambah di Tahap 1 ini).';
comment on column public.my20fit_foodimg.generated_at is
  'Waktu generate AI selesai. NULL utk baris non-AI atau baris lama tanpa catatan '
  '(dipakai created_at sbg perkiraan saat backfill).';

create index if not exists my20fit_foodimg_food_key_idx on public.my20fit_foodimg (food_key);
