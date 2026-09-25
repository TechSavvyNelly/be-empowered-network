-- Be Empowered Network — full schema
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Access model, in one line: the browser holds only the anon key, so
-- every table below is deny-by-default and opens up only where a policy
-- says so. Anything that must not be reader-visible (enquiries,
-- subscribers) has NO anon policy at all and is written exclusively by
-- Edge Functions using the service_role key.

create extension if not exists pgcrypto;

-- ===================================================================
-- Profiles — one row per signed-in person
-- ===================================================================

create table if not exists public.profiles (
  id             uuid primary key references auth.users on delete cascade,
  full_name      text,
  email          text,
  phone          text,                -- E.164, e.g. +2348031234567
  phone_verified boolean not null default false,
  newsletter     boolean not null default true,
  events         boolean not null default true,
  volunteering   boolean not null default false,
  is_admin       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile"   on public.profiles for select using  (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
-- is_admin is deliberately NOT settable from the browser; see the guard below.
create policy "update own profile" on public.profiles for update using  (auth.uid() = id) with check (auth.uid() = id);

-- Stop anyone promoting themselves to admin through the update policy.
create or replace function public.guard_is_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
      raise exception 'is_admin can only be changed by an admin';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists profiles_guard_admin on public.profiles;
create trigger profiles_guard_admin before update on public.profiles
  for each row execute function public.guard_is_admin();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ===================================================================
-- Events
-- ===================================================================

create table if not exists public.events (
  id           text primary key,          -- slug, matches the old events.js ids
  title        text not null,
  summary      text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  location     text,
  mode         text check (mode in ('online', 'in-person', 'hybrid')),
  type         text not null default 'circle'
                 check (type in ('circle', 'campaign', 'training', 'webinar')),
  capacity     integer,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "anyone reads published events" on public.events;
drop policy if exists "admins write events"           on public.events;

create policy "anyone reads published events" on public.events for select using (is_published or public.is_admin());
create policy "admins write events"           on public.events for all    using (public.is_admin()) with check (public.is_admin());

-- ===================================================================
-- RSVPs
-- ===================================================================

create table if not exists public.rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   text not null references public.events on delete cascade,
  user_id    uuid not null references auth.users on delete cascade,
  note       text,                       -- "data cost is a barrier", etc.
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

alter table public.rsvps enable row level security;

drop policy if exists "read own rsvps"   on public.rsvps;
drop policy if exists "manage own rsvps" on public.rsvps;
drop policy if exists "admins read rsvps" on public.rsvps;

create policy "read own rsvps"    on public.rsvps for select using (auth.uid() = user_id or public.is_admin());
create policy "manage own rsvps"  on public.rsvps for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Count RSVPs without exposing who RSVP'd.
create or replace view public.event_rsvp_counts as
  select event_id, count(*)::int as rsvp_count from public.rsvps group by event_id;

-- ===================================================================
-- Directory
-- ===================================================================

create table if not exists public.directory_entries (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  category     text,                     -- hospital | helpline | ngo | online
  state        text,
  city         text,
  description  text,
  phone        text,
  phone_href   text,
  url          text,
  is_published boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.directory_entries enable row level security;

drop policy if exists "anyone reads published entries" on public.directory_entries;
drop policy if exists "admins write entries"           on public.directory_entries;

create policy "anyone reads published entries" on public.directory_entries for select using (is_published or public.is_admin());
create policy "admins write entries"           on public.directory_entries for all    using (public.is_admin()) with check (public.is_admin());

-- ===================================================================
-- Enquiries — contact form, volunteering, partnerships
-- NO anon policy: written only by the submit-enquiry Edge Function.
-- ===================================================================

create table if not exists public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('contact', 'volunteer', 'partner', 'donation')),
  name       text not null,
  email      text not null,
  phone      text,
  topic      text,
  message    text not null,
  meta       jsonb not null default '{}'::jsonb,   -- extra form fields, user agent
  status     text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);

alter table public.enquiries enable row level security;

drop policy if exists "admins read enquiries"   on public.enquiries;
drop policy if exists "admins update enquiries" on public.enquiries;

create policy "admins read enquiries"   on public.enquiries for select using (public.is_admin());
create policy "admins update enquiries" on public.enquiries for update using (public.is_admin()) with check (public.is_admin());

-- ===================================================================
-- Newsletter subscribers — double opt-in
-- NO anon policy: written only by the newsletter Edge Functions.
-- ===================================================================

create table if not exists public.subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  name            text,
  status          text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed', 'bounced')),
  token           uuid not null default gen_random_uuid(),  -- confirm + unsubscribe link
  source          text,                                     -- footer | signup | get-involved
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);

create unique index if not exists subscribers_email_key on public.subscribers (lower(email));
create index if not exists subscribers_token_idx on public.subscribers (token);

alter table public.subscribers enable row level security;

drop policy if exists "admins read subscribers" on public.subscribers;
create policy "admins read subscribers" on public.subscribers for select using (public.is_admin());

-- ===================================================================
-- Newsletter campaigns
-- ===================================================================

create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  subject    text not null,
  body_html  text not null,
  status     text not null default 'draft' check (status in ('draft', 'sending', 'sent', 'failed')),
  sent_at    timestamptz,
  sent_count integer not null default 0,
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

drop policy if exists "admins manage campaigns" on public.campaigns;
create policy "admins manage campaigns" on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

-- ===================================================================
-- Signup trigger + updated_at
-- ===================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, newsletter, events, volunteering)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', new.phone),
    coalesce((new.raw_user_meta_data->>'newsletter')::boolean, true),
    coalesce((new.raw_user_meta_data->>'events')::boolean, true),
    coalesce((new.raw_user_meta_data->>'volunteering')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_touch  on public.profiles;
drop trigger if exists events_touch    on public.events;
drop trigger if exists directory_touch on public.directory_entries;

create trigger profiles_touch  before update on public.profiles          for each row execute function public.touch_updated_at();
create trigger events_touch    before update on public.events            for each row execute function public.touch_updated_at();
create trigger directory_touch before update on public.directory_entries for each row execute function public.touch_updated_at();
