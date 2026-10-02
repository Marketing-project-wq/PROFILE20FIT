-- 031: Profil olahraga user (Activity multi-sport, Fase 1). Maksimal 2 olahraga per user.
--
-- PREFIX my20fit_ WAJIB (CLAUDE.md §4). Aditif & idempoten. Jalankan MANUAL di Supabase SQL Editor.
-- Batas 2 olahraga DITEGAKKAN DI DB: primary key (auth_user_id, rank) + rank hanya 1|2.
-- Daftar olahraga yang valid (sport_key) & isi paketnya ada di lib/sport-packs/ (config, bukan tabel),
-- jadi DB hanya memeriksa format key. Penulisan lewat server (PUT /api/me/sports -> RPC di bawah).
-- RLS: user hanya boleh MEMBACA miliknya sendiri.

create table if not exists public.my20fit_user_sports (
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  rank          smallint not null,                  -- 1 = olahraga utama, 2 = olahraga kedua
  sport_key     text not null,                      -- lib/sport-packs (hyrox|running|gym|padel|general)
  other_label   text,                               -- nama bebas untuk "Lainnya" (mis. "Tennis")
  play_days     smallint[] not null default '{}',   -- hari biasa main/latihan, ISO: 1=Sen … 7=Min
  level         text,                               -- beginner|regular|competitive
  goal          text,                               -- kunci goals di paket olahraganya
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint my20fit_user_sports_pk primary key (auth_user_id, rank),
  constraint my20fit_user_sports_rank_chk check (rank in (1, 2)),
  constraint my20fit_user_sports_key_chk check (sport_key ~ '^[a-z_]{2,30}$'),
  constraint my20fit_user_sports_other_len_chk check (other_label is null or char_length(other_label) <= 40),
  constraint my20fit_user_sports_days_chk check (cardinality(play_days) <= 7 and play_days <@ array[1,2,3,4,5,6,7]::smallint[]),
  constraint my20fit_user_sports_level_chk check (level is null or level in ('beginner','regular','competitive'))
);
-- Olahraga yang sama tidak boleh dipilih dua kali (untuk "Lainnya" dibedakan dari namanya).
create unique index if not exists my20fit_user_sports_uniq_sport
  on public.my20fit_user_sports (auth_user_id, sport_key, lower(coalesce(other_label, '')));

alter table public.my20fit_user_sports enable row level security;
drop policy if exists p_user_sports_sel on public.my20fit_user_sports;
create policy p_user_sports_sel on public.my20fit_user_sports
  for select using (auth.uid() = auth_user_id);

-- Ganti SELURUH pilihan olahraga user dalam satu transaksi (hapus lalu isi ulang), supaya menukar
-- urutan utama/kedua tidak bentrok dengan unique index & tidak ada kondisi "setengah tersimpan".
-- p_rows = [{rank, sport_key, other_label, play_days, level, goal}] — sudah divalidasi server
-- (lib/sport-packs validateSelection). Riwayat workout/analisa TIDAK disentuh.
create or replace function public.my20fit_set_user_sports(p_uid uuid, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if p_uid is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) not between 1 and 2 then
    raise exception 'pilihan olahraga tidak valid';
  end if;
  delete from public.my20fit_user_sports where auth_user_id = p_uid;
  insert into public.my20fit_user_sports (auth_user_id, rank, sport_key, other_label, play_days, level, goal)
  select p_uid,
         (r->>'rank')::smallint,
         r->>'sport_key',
         nullif(r->>'other_label', ''),
         coalesce((select array_agg(d::smallint) from jsonb_array_elements_text(coalesce(r->'play_days', '[]'::jsonb)) d), '{}'),
         nullif(r->>'level', ''),
         nullif(r->>'goal', '')
  from jsonb_array_elements(p_rows) r;
end;
$function$;

-- Fungsi SECURITY DEFINER hanya boleh dipanggil server (service_role), bukan anon/publik.
revoke execute on function public.my20fit_set_user_sports(uuid, jsonb) from public, anon, authenticated;
grant  execute on function public.my20fit_set_user_sports(uuid, jsonb) to service_role;
