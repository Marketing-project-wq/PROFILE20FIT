-- 030: Rating & ulasan kelas dari member (Riwayat & Transaksi di /profile).
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4). Aditif & idempoten.
-- Penulisan SELURUHNYA lewat server (service_role, POST /api/class-reviews) setelah server
-- memastikan booking_code memang milik user (arena-api /member/bookings by nomor HP profil),
-- statusnya confirmed, dan jadwal kelasnya sudah lewat. Data kelas (nama, tanggal, instruktur)
-- diambil dari arena-api di server, bukan dari client.
-- RLS: user hanya boleh MEMBACA ulasannya sendiri.

create table if not exists public.my20fit_class_reviews (
  id             uuid primary key default gen_random_uuid(),
  auth_user_id   uuid not null references auth.users(id) on delete cascade,
  booking_code   text not null,
  class_name     text,
  schedule_date  date,
  start_time     text,
  instructor     text,
  rating         smallint not null,
  comment        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint my20fit_class_reviews_uniq unique (auth_user_id, booking_code),
  constraint my20fit_class_reviews_rating_chk check (rating between 1 and 5),
  constraint my20fit_class_reviews_comment_len_chk check (comment is null or char_length(comment) <= 1000),
  constraint my20fit_class_reviews_code_len_chk check (char_length(booking_code) between 1 and 80)
);
create index if not exists my20fit_class_reviews_instructor_idx on public.my20fit_class_reviews (instructor, schedule_date);

alter table public.my20fit_class_reviews enable row level security;
drop policy if exists p_class_reviews_sel on public.my20fit_class_reviews;
create policy p_class_reviews_sel on public.my20fit_class_reviews
  for select using (auth.uid() = auth_user_id);
