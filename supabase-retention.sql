-- ============================================================
--  Be Empowered Network — data retention and consent records
--  Supabase → SQL Editor → New query → paste → Run.
--
--  The privacy notice promises that we delete things on a schedule.
--  This is the part that actually does it. A promise with no job
--  behind it is worse than no promise, because it is a statement to
--  a regulator that turns out not to be true.
--
--  Safe to run more than once.
-- ============================================================


-- ------------------------------------------------------------
--  1. Record consent, not just collect it
--
--  NDPA 2023 s.26 and GDPR Art. 7(1) both ask the controller to be
--  able to DEMONSTRATE that consent was given. A ticked box that
--  leaves no trace cannot do that. The site now sends consent_at;
--  these columns give it somewhere to live.
-- ------------------------------------------------------------

alter table public.enquiries
  add column if not exists consent_at    timestamptz,
  add column if not exists consent_text  text,
  add column if not exists erase_after   timestamptz;

-- Backfill the deletion date for rows already in the table.
update public.enquiries
   set erase_after = created_at + interval '24 months'
 where erase_after is null;

-- New rows get their own deletion date at insert time, so the
-- retention period travels with the record instead of living only
-- in a policy document somebody has to remember.
create or replace function public.set_enquiry_erase_after()
returns trigger
language plpgsql
as $$
begin
  if new.erase_after is null then
    new.erase_after := coalesce(new.created_at, now()) + interval '24 months';
  end if;
  -- Lift consent_at out of meta if the form put it there.
  if new.consent_at is null and new.meta ? 'consent_at' then
    begin
      new.consent_at := (new.meta ->> 'consent_at')::timestamptz;
    exception when others then
      null;   -- a malformed value must never block someone's message
    end;
  end if;
  return new;
end $$;

drop trigger if exists enquiries_set_erase_after on public.enquiries;
create trigger enquiries_set_erase_after
  before insert on public.enquiries
  for each row execute function public.set_enquiry_erase_after();


-- ------------------------------------------------------------
--  2. The retention sweep
--
--  Runs as the table owner so it can delete regardless of RLS.
--  Every period here matches what privacy.html tells people. If you
--  change one, change the other in the same sitting.
-- ------------------------------------------------------------

create or replace function public.run_retention()
returns table (what text, removed bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  -- Enquiries: 24 months after the last exchange.
  delete from public.enquiries where erase_after < now();
  get diagnostics n = row_count;
  what := 'enquiries'; removed := n; return next;

  -- RSVPs: 12 months after the event they belong to.
  delete from public.rsvps r
   using public.events e
   where r.event_id = e.id
     and coalesce(e.ends_at, e.starts_at) < now() - interval '12 months';
  get diagnostics n = row_count;
  what := 'rsvps'; removed := n; return next;

  -- Newsletter: 30 days after unsubscribing, so a re-import cannot
  -- quietly put someone back on a list they have left.
  delete from public.subscribers
   where status = 'unsubscribed'
     and unsubscribed_at < now() - interval '30 days';
  get diagnostics n = row_count;
  what := 'newsletter'; removed := n; return next;

  -- Someone who asked for the newsletter but never clicked the
  -- confirmation link has not consented. Holding their address
  -- indefinitely on the chance they come back is not a lawful basis.
  delete from public.subscribers
   where status = 'pending'
     and created_at < now() - interval '30 days';
  get diagnostics n = row_count;
  what := 'unconfirmed signups'; removed := n; return next;

exception
  when undefined_table then
    -- One missing table must not stop the rest of the sweep.
    what := 'skipped: a table in this sweep does not exist'; removed := 0; return next;
end $$;

revoke all on function public.run_retention() from public, anon, authenticated;


-- ------------------------------------------------------------
--  3. Run it nightly
--
--  pg_cron is available on Supabase but off by default.
-- ------------------------------------------------------------

create extension if not exists pg_cron with schema extensions;

select cron.unschedule('ben-retention')
 where exists (select 1 from cron.job where jobname = 'ben-retention');

select cron.schedule('ben-retention', '30 2 * * *', $$select public.run_retention();$$);


-- ------------------------------------------------------------
--  4. Report
-- ------------------------------------------------------------

select * from public.run_retention();

select jobname, schedule, active from cron.job where jobname = 'ben-retention';

select count(*) as enquiries_held,
       min(created_at)::date as oldest,
       count(*) filter (where consent_at is not null) as with_recorded_consent
  from public.enquiries;
