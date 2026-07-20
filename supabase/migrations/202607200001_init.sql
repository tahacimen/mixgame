create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'player' check (role in ('admin', 'editor', 'player')),
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  category text not null check (char_length(category) between 1 and 40),
  url text unique not null check (url ~ '^https?://'),
  image_url text,
  description text,
  hue text,
  background text,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.games enable row level security;

create or replace function public.can_edit_games()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "games authenticated read" on public.games;
create policy "games authenticated read"
on public.games for select
to authenticated
using (true);

drop policy if exists "games editors insert" on public.games;
create policy "games editors insert"
on public.games for insert
to authenticated
with check (public.can_edit_games());

drop policy if exists "games editors update" on public.games;
create policy "games editors update"
on public.games for update
to authenticated
using (public.can_edit_games())
with check (public.can_edit_games());

drop policy if exists "games editors delete" on public.games;
create policy "games editors delete"
on public.games for delete
to authenticated
using (public.can_edit_games());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-covers', 'game-covers', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "covers public read" on storage.objects;
create policy "covers public read"
on storage.objects for select
to public
using (bucket_id = 'game-covers');

drop policy if exists "covers editors upload" on storage.objects;
create policy "covers editors upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'game-covers' and public.can_edit_games());

drop policy if exists "covers editors update" on storage.objects;
create policy "covers editors update"
on storage.objects for update
to authenticated
using (bucket_id = 'game-covers' and public.can_edit_games());

drop policy if exists "covers editors delete" on storage.objects;
create policy "covers editors delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'game-covers' and public.can_edit_games());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
before update on public.games
for each row execute function public.set_updated_at();

alter publication supabase_realtime add table public.games;
