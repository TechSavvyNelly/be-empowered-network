-- Grant admin to the organisation's own account.
--
-- Run this AFTER:
--   1. supabase-migration-first-admin.sql has been run once, and
--   2. hello@beempowerednetwork.org has signed up at /signin.html and
--      clicked the confirmation link in the inbox.
--
-- Change the address below to grant admin to someone else later.

update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where lower(email) = lower('hello@beempowerednetwork.org')
);

-- Check it worked: this should return one row with is_admin = true.
select p.id, p.email, p.full_name, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('hello@beempowerednetwork.org');
