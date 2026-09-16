-- ============================================================
-- 20260908000000_ticket_user_tokens
-- Menyimpan userToken ticket.20fit.id per user my.20fit.
--
-- KENAPA PERLU:
-- Tiket disimpan di ticket.20fit.id, dan satu-satunya cara membacanya adalah
-- `GET /me/tickets` dengan header X-Embed-User-Token. Token itu bisa didapat lewat
-- dua jalur:
--   (a) POST /partner/user-token  -> HANYA berhasil untuk email yang PUNYA AKUN di
--       ticket.20fit.id. Pembeli tamu (mayoritas) balas {"error":"user_not_found"}.
--       Diukur 2026-09-08: 8 dari 8 email pembeli ASLI ditolak 404, dan 141 dari 143
--       panggilan user_token di log 24 jam juga 404.
--   (b) POST /otp/request lalu /otp/verify -> pemilik email membuktikan kepemilikan
--       lewat kode yang dikirim ke emailnya, lalu dapat userToken. Ini yang dipakai
--       pembeli tamu, dan jalur inilah yang selama ini TIDAK PERNAH dipanggil oleh
--       my.20fit sehingga tiket mereka tak pernah muncul.
-- Token dari (b) berumur panjang tapi tidak abadi, jadi disimpan agar user tidak
-- diminta OTP tiap kali membuka halaman.
--
-- KEAMANAN: satu baris per auth_user_id; token TIDAK PERNAH dikirim ke browser —
-- hanya dipakai server saat memanggil edge function. RLS deny-public (tanpa policy)
-- sehingga hanya service key server yang bisa membaca/menulis, konsisten pola my20fit_.
-- ============================================================

create table if not exists my20fit_ticket_tokens (
  auth_user_id uuid primary key,
  email text not null,
  user_token text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table my20fit_ticket_tokens enable row level security;
