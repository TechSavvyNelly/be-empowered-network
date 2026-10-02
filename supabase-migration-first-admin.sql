-- Migration: make it possible to create the FIRST admin.
--
-- The guard on profiles.is_admin refused any change unless the *current*
-- session was already an admin. In the SQL Editor auth.uid() is null, so
-- there was no admin, so nobody could ever be made one: a deadlock that
-- left admin.html permanently unreachable.
--
-- Fix: the guard still applies to anyone signed in through the browser,
-- but not to a null session (the SQL Editor, service_role, migrations).
-- That opens no hole from the site: the "update own profile" RLS policy
-- requires auth.uid() = id, which a null session can never satisfy, so an
-- anonymous visitor cannot reach this trigger in the first place.
--
-- Run this once in Supabase -> SQL Editor. Safe to re-run.

create or replace function public.guard_is_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin then
    -- Only guard real browser sessions. A null auth.uid() means the SQL
    -- Editor, service_role or a migration, which is how the first admin
    -- is created. RLS already blocks anonymous visitors from here.
    if auth.uid() is not null
       and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin) then
      raise exception 'is_admin can only be changed by an admin';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists profiles_guard_admin on public.profiles;
create trigger profiles_guard_admin before update on public.profiles
  for each row execute function public.guard_is_admin();
