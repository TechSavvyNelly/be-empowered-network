-- ============================================================
--  Be Empowered Network — run this once in Supabase → SQL Editor
--  (Dashboard → SQL Editor → New query → paste → Run)
--
--  Fixes the two things the live database is currently missing.
--  Everything here is idempotent: running it twice is harmless.
--  It prints a report at the end so you can see what happened.
-- ============================================================


-- ------------------------------------------------------------
-- FIX 1 — events have no `type`
--
-- The table only ever stored `mode` (online / in-person). The site
-- guesses the type from the slug as a stopgap, but staff cannot set
-- it on a new event, so anything added in the admin page would be
-- filed as a peer circle no matter what it really is.
-- ------------------------------------------------------------

alter table public.events
  add column if not exists type text not null default 'circle';

-- Backfill from the slug, which already encodes the type.
update public.events set type = case
  when id like 'circle-%'   then 'circle'
  when id like 'training-%' then 'training'
  when id like 'webinar-%'  then 'webinar'
  when id like 'wmhd-%'     then 'campaign'
  when id like 'schools-%'  then 'campaign'
  else 'circle'
end
where type = 'circle';

alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check
  check (type in ('circle', 'campaign', 'training', 'webinar'));


-- ------------------------------------------------------------
-- FIX 2 — the first admin can never be created
--
-- The guard on profiles.is_admin refuses any change unless the
-- current session is already an admin. In the SQL Editor there is no
-- session, so there is no admin, so nobody can ever become one — and
-- admin.html stays locked to everyone, permanently.
--
-- The guard now applies only to real browser sessions. A null session
-- (this SQL Editor, service_role, a migration) may set the flag. That
-- opens nothing up from the website: the "update own profile" policy
-- requires auth.uid() = id, which a null session can never satisfy,
-- so an anonymous visitor cannot reach this trigger at all.
-- ------------------------------------------------------------

create or replace function public.guard_is_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin then
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


-- ------------------------------------------------------------
-- FIX 3 — make hello@beempowerednetwork.org an admin
--
-- This only works once that address has signed up at /signin.html
-- AND clicked the confirmation link in the inbox. If it has not yet,
-- this step is skipped with a notice and nothing else is affected —
-- sign up, then run this file again.
-- ------------------------------------------------------------

do $$
declare
  uid uuid;
begin
  select id into uid from auth.users
   where lower(email) = lower('hello@beempowerednetwork.org');

  if uid is null then
    raise notice 'SKIPPED: hello@beempowerednetwork.org has not signed up yet. Sign up at /signin.html, confirm the email, then run this file again.';
  else
    update public.profiles set is_admin = true where id = uid;
    raise notice 'OK: hello@beempowerednetwork.org is now an admin.';
  end if;
end $$;


-- ------------------------------------------------------------
--  REPORT — check these three results
-- ------------------------------------------------------------

-- 1. Every event should now have a sensible type.
select type, count(*) as events
from public.events
group by type
order by type;

-- 2. The guard should allow a null session (this is the fix).
select 'guard allows SQL Editor' as check,
       position('auth.uid() is not null' in pg_get_functiondef(
         'public.guard_is_admin()'::regprocedure)) > 0 as fixed;

-- 3. Who is an admin? Empty means the account has not signed up yet.
select u.email, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where p.is_admin;
