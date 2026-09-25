-- Migration: give events a real `type`.
--
-- Why: the events table only ever stored `mode` (online / in-person).
-- data-sync.js was guessing the type from the mode, so every online event
-- was labelled "Peer circle" (including trainings and webinars), every
-- in-person event showed a tag reading literally "event", and the
-- Campaign and Training filters on /events.html always came back empty.
--
-- Run this once in Supabase → SQL Editor. It is safe to re-run.

alter table public.events
  add column if not exists type text not null default 'circle';

-- Backfill from the slug, which already encodes the type
-- (circle-*, training-*, webinar-*, wmhd-*, schools-*).
update public.events set type = case
  when id like 'circle-%'   then 'circle'
  when id like 'training-%' then 'training'
  when id like 'webinar-%'  then 'webinar'
  when id like 'wmhd-%'     then 'campaign'
  when id like 'schools-%'  then 'campaign'
  else 'circle'
end
where type = 'circle';   -- i.e. only rows still on the default

alter table public.events drop constraint if exists events_type_check;
alter table public.events
  add constraint events_type_check
  check (type in ('circle', 'campaign', 'training', 'webinar'));
