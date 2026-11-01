-- ============================================================
--  Be Empowered Network — run this once in Supabase → SQL Editor
--  (Dashboard → SQL Editor → New query → paste → Run)
--
--  Brings the live database up to date with the site, and loads the
--  Support A Widow editions as event rows.
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
-- FIX 3 — make the organisation's account an admin
--
--  >>> PUT YOUR ADMIN EMAIL ON THE LINE MARKED "admin_email" BELOW. <<<
--
-- It must be an address you can actually receive mail at, because you
-- sign up with it at /signin.html and have to click a confirmation link.
--
-- This step only works once that address has signed up AND confirmed.
-- If it has not yet, the step is skipped with a notice and nothing else
-- is affected — sign up, then run this file again.
-- ------------------------------------------------------------

do $$
declare
  admin_email text := 'hello@beempowerednetwork.org';   -- <<< CHANGE THIS
  uid uuid;
begin
  select id into uid from auth.users
   where lower(email) = lower(admin_email);

  if uid is null then
    raise notice 'SKIPPED: % has not signed up yet. Sign up at /signin.html, confirm the email, then run this file again.', admin_email;
  else
    update public.profiles set is_admin = true where id = uid;
    raise notice 'OK: % is now an admin.', admin_email;
  end if;
end $$;


-- ------------------------------------------------------------
-- FIX 4 — Support A Widow is not in the database at all
--
-- The initiative has its own page on the site, but none of its
-- editions exist as event rows, so they never appear in the events
-- list and staff cannot edit them in admin.html.
--
-- The three past editions below are dated from their own campaign
-- flyers. Edition 4.0 (the MEBS Global business grants) is NOT here
-- because nobody has given me its date yet — add it with the template
-- at the bottom of this section once you know it.
--
-- Re-running this is safe: existing rows are updated, not duplicated.
-- ------------------------------------------------------------

insert into public.events
  (id, title, summary, starts_at, ends_at, location, mode, type, is_published)
values
  ('saw-2021-12', 'Support A Widow 1.0',
   'The first edition: an appeal for food items and cash gifts, shared with widows on Christmas Eve.',
   '2021-12-24 10:00+01', '2021-12-24 16:00+01', 'Lagos', 'in-person', 'campaign', true),
  ('saw-2022-12', 'Support A Widow 2.0',
   'Packed food items, cash gifts and clothes, distributed to widows on Christmas Eve.',
   '2022-12-24 10:00+01', '2022-12-24 16:00+01', 'Lagos', 'in-person', 'campaign', true),
  ('saw-2023-12', 'Support A Widow 3.0',
   'A donation drive for food items, cash gifts and clothes, distributed to widows before Christmas.',
   '2023-12-23 10:00+01', '2023-12-23 16:00+01', 'Lagos', 'in-person', 'campaign', true)
on conflict (id) do update set
  title      = excluded.title,
  summary    = excluded.summary,
  starts_at  = excluded.starts_at,
  ends_at    = excluded.ends_at,
  location   = excluded.location,
  mode       = excluded.mode,
  type       = excluded.type,
  updated_at = now();


-- The edition coming this December.
--
--  >>> PUT THE REAL DATE ON THE "saw5_starts" LINE BELOW, THEN RUN. <<<
--
-- Left as null, this step is skipped and nothing else is affected, so
-- you can run the file now and come back to it when the date is fixed.
-- Do not invent a date: this row drives the countdown on the events
-- page and the calendar file people download.

do $$
declare
  saw5_starts timestamptz := null;   -- <<< e.g. '2026-12-19 10:00+01'
  saw5_ends   timestamptz := null;   -- <<< e.g. '2026-12-19 15:00+01'
  saw5_place  text        := 'Lagos (venue to be confirmed)';
begin
  if saw5_starts is null then
    raise notice 'SKIPPED: Support A Widow 5.0 has no date yet. Set saw5_starts above and run this file again.';
  else
    insert into public.events
      (id, title, summary, starts_at, ends_at, location, mode, type, is_published)
    values
      ('saw-2026-12', 'Support A Widow 5.0',
       'Skills acquisition and digital awareness training, health assessments for 30 widows, and school fees and back-to-school kits for 30 children.',
       saw5_starts, coalesce(saw5_ends, saw5_starts), saw5_place, 'in-person', 'campaign', true)
    on conflict (id) do update set
      title = excluded.title, summary = excluded.summary,
      starts_at = excluded.starts_at, ends_at = excluded.ends_at,
      location = excluded.location, updated_at = now();
    raise notice 'OK: Support A Widow 5.0 is scheduled for %.', saw5_starts;
  end if;
end $$;


-- Template for edition 4.0, once you know when it ran. Uncomment,
-- set the date, and run again.
--
-- insert into public.events
--   (id, title, summary, starts_at, ends_at, location, mode, type, is_published)
-- values
--   ('saw-4', 'Support A Widow 4.0',
--    'N100,000 each to 25 widows running small businesses in Nigeria, with the support of MEBS Global.',
--    '????-??-?? 10:00+01', '????-??-?? 16:00+01', 'Lagos', 'in-person', 'campaign', true)
-- on conflict (id) do update set
--   title = excluded.title, summary = excluded.summary,
--   starts_at = excluded.starts_at, updated_at = now();


-- ------------------------------------------------------------
--  REPORT — check these four results
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

-- 4. The Support A Widow editions should be listed here.
select id, title, starts_at::date as held_on, type, is_published
from public.events
where id like 'saw-%'
order by starts_at;
