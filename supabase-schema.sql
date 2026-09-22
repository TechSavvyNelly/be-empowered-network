-- Be Empowered Network — auth + profile storage
-- Run once in Supabase → SQL Editor.
--
-- auth.users is managed by Supabase and holds the email, phone and
-- provider identities. This adds the fields the site needs on top,
-- one row per user, readable and writable only by that user.

create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  full_name     text,
  email         text,
  phone         text,                 -- E.164, e.g. +2348012345678
  phone_verified boolean not null default false,
  newsletter    boolean not null default true,
  events        boolean not null default true,
  volunteering  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in person can only ever touch their own row.
drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile"   on public.profiles for select using  (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update using  (auth.uid() = id) with check (auth.uid() = id);

-- Create the profile row automatically when a user signs up, including
-- via Google or Apple (where the name arrives in raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();
