-- Seed data, generated from the original events.js / directory.js.
-- Run after supabase-schema.sql. Re-running is safe.

insert into public.events (id, title, summary, starts_at, ends_at, location, mode) values
  ('circle-2026-10-03', 'Online Peer Support Circle', 'Our monthly open circle for adults. Come as you are, listen or share, no diagnosis needed. Facilitated by two trained volunteers.', '2026-10-03T19:00:00+01', '2026-10-03T20:30:00+01', 'Online (link sent after RSVP)', 'online'),
  ('wmhd-2026', 'World Mental Health Day: Walk & Talk', 'A community walk followed by an open conversation on this year''s World Mental Health Day theme. Families, students and workplaces welcome.', '2026-10-10T08:00:00+01', '2026-10-10T11:00:00+01', 'Venue to be announced', 'in-person'),
  ('training-2026-10-24', 'Volunteer Facilitator Training (Part 1)', 'The first of two sessions for new circle facilitators: listening skills, group safety, boundaries and when to refer on. Open to accepted volunteers.', '2026-10-24T10:00:00+01', '2026-10-24T14:00:00+01', 'Online', 'online'),
  ('circle-2026-11-07', 'Online Peer Support Circle', 'Our monthly open circle for adults. Come as you are, listen or share, no diagnosis needed.', '2026-11-07T19:00:00+01', '2026-11-07T20:30:00+01', 'Online (link sent after RSVP)', 'online'),
  ('webinar-2026-11-21', 'Workplace Wellbeing: Spotting Burnout Early', 'A lunchtime session for line managers and HR: the early signs of burnout, how to open a supportive conversation, and what to do next.', '2026-11-21T12:00:00+01', '2026-11-21T13:00:00+01', 'Online webinar', 'online'),
  ('circle-2026-09-05', 'Online Peer Support Circle', 'September''s monthly circle.', '2026-09-05T19:00:00+01', '2026-09-05T20:30:00+01', 'Online', 'online'),
  ('wmhd-2025', 'World Mental Health Day 2025: Community Conversation', 'An open conversation on mental health in the workplace, with a panel of volunteers, an employer and a clinician, followed by a peer circle taster.', '2025-10-10T10:00:00+01', '2025-10-10T13:00:00+01', 'Community hall (in person)', 'in-person'),
  ('training-2025-06', 'Volunteer Facilitator Training Cohort', 'A full-day training for our new cohort of peer circle facilitators: active listening, group safety and referral pathways.', '2025-06-14T10:00:00+01', '2025-06-14T15:00:00+01', 'Online', 'online'),
  ('schools-2025-03', 'Secondary School Mental Health Week', 'A week of student assemblies and teacher sessions on stress, anxiety and where to get help, delivered with partner schools.', '2025-03-17T09:00:00+01', '2025-03-21T14:00:00+01', 'Partner secondary schools', 'in-person'),
  ('wmhd-2024', 'World Mental Health Day 2024: Walk & Talk', 'Our annual community walk followed by open-mic stories from people with lived experience.', '2024-10-12T08:00:00+01', '2024-10-12T11:00:00+01', 'In person', 'in-person')
on conflict (id) do nothing;

insert into public.directory_entries (name, category, state, description, phone, phone_href, url, sort_order)
select * from (values
  ('Federal Neuropsychiatric Hospital, Yaba', 'hospital', 'Lagos', 'Public psychiatric hospital: emergency psychiatry, outpatient clinics, inpatient care, child and adolescent services, drug and alcohol unit.', null, null, null, 0),
  ('Lagos University Teaching Hospital (LUTH), Psychiatry Department', 'hospital', 'Lagos', 'Psychiatry outpatient clinic and inpatient care within a teaching hospital; clinical psychology services.', null, null, null, 1),
  ('Neuropsychiatric Hospital, Aro', 'hospital', 'Ogun', 'One of Nigeria''s oldest psychiatric hospitals (Abeokuta). Outpatient, inpatient, rehabilitation and community psychiatry.', null, null, null, 2),
  ('Federal Neuropsychiatric Hospital, Enugu', 'hospital', 'Enugu', 'Public psychiatric hospital serving the South-East: emergency, outpatient and inpatient care.', null, null, null, 3),
  ('Federal Neuropsychiatric Hospital, Kaduna', 'hospital', 'Kaduna', 'Public psychiatric hospital (Barnawa) serving the North-West: emergency, outpatient, inpatient and substance-use services.', null, null, null, 4),
  ('Federal Neuropsychiatric Hospital, Maiduguri', 'hospital', 'Borno', 'Public psychiatric hospital serving the North-East, including trauma-related care.', null, null, null, 5),
  ('Federal Neuropsychiatric Hospital, Calabar', 'hospital', 'Cross River', 'Public psychiatric hospital serving the South-South.', null, null, null, 6),
  ('Federal Neuropsychiatric Hospital, Benin City', 'hospital', 'Edo', 'Public psychiatric hospital (Uselu): outpatient and inpatient psychiatric care.', null, null, null, 7),
  ('Federal Neuropsychiatric Hospital, Sokoto', 'hospital', 'Sokoto', 'Public psychiatric hospital (Kware) serving the far North-West.', null, null, null, 8),
  ('University College Hospital (UCH), Ibadan — Psychiatry', 'hospital', 'Oyo', 'Psychiatry department of a teaching hospital: outpatient clinics, inpatient care, child psychiatry.', null, null, null, 9),
  ('Nigeria Emergency Number', 'helpline', 'Nationwide', 'National emergency line for police, fire and medical emergencies, including a person at immediate risk of harming themselves.', '112', 'tel:112', null, 10),
  ('Mentally Aware Nigeria Initiative (MANI)', 'helpline', 'Nationwide', 'Youth-led NGO running a peer support line and online communities; campaigns on stigma and suicide prevention.', '0809 111 6264', 'tel:+2348091116264', 'https://mentallyaware.org', 11),
  ('Nigeria Suicide Prevention Initiative (NSPI)', 'helpline', 'Nationwide', 'Suicide prevention charity with a counselling line and awareness training.', '0806 210 6493', 'tel:+2348062106493', null, 12),
  ('She Writes Woman', 'ngo', 'Lagos, Nationwide', 'Women-led mental health organisation: safe-space peer support, a support line, and mental health first-aid training.', null, null, 'https://shewriteswoman.org', 13),
  ('Asido Foundation', 'ngo', 'Oyo, Nationwide', 'Ibadan-based NGO providing free counselling, peer support and mental health advocacy, with a strong campus presence.', null, null, 'https://asidofoundation.com', 14),
  ('Be Empowered Network', 'ngo', 'Nationwide', 'That''s us: free peer support circles (in person and online), school, workplace and faith-leader programmes, and signposting to professional care.', null, null, 'get-help.html', 15),
  ('Online therapy platforms', 'online', 'Nationwide', 'Several Nigerian platforms connect you with licensed therapists by video, voice or chat at lower cost than in-person clinics. Check that the therapist is registered and ask about fees before booking.', null, null, null, 16)
) as v(name, category, state, description, phone, phone_href, url, sort_order)
where not exists (select 1 from public.directory_entries d where d.name = v.name);
