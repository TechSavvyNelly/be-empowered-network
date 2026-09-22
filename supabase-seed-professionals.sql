-- Professional bodies, registers and find-a-therapist routes.
--
-- Every entry below was checked against the organisation's own site in
-- September 2026 before being added. Two URLs that looked plausible
-- (nigerianpsychologicalassociation.org, psychiatristsnigeria.org) do not
-- resolve at all and were dropped rather than guessed at.
--
-- Where no phone number could be confirmed from a primary source, the
-- entry carries a website only. A wrong number on a mental health page is
-- worse than no number.
--
-- Unattributed crisis numbers (Liberia, Cote d'Ivoire, Togo) were left out:
-- a bare number with no named organisation behind it cannot be verified or
-- kept current.

insert into public.directory_entries
  (name, category, state, description, phone, phone_href, url, sort_order)
select * from (values

  -- ---------- Nigeria: crisis ----------
  ('SURPIN — Suicide Research and Prevention Initiative (LUTH)', 'helpline', 'Nationwide',
   'A 24-hour helpline run from Lagos University Teaching Hospital offering counselling, support and referral for people who are depressed, anxious or thinking of taking their own life. Operates across all 36 states and the FCT.',
   '0800 078 7746 (toll free)', 'tel:08000787746', 'https://www.surpinng.com/', 100),

  -- ---------- Nigeria: how to find and check a professional ----------
  ('Association of Psychiatrists in Nigeria (APN)', 'professional', 'Nationwide',
   'The national body for psychiatrists — doctors who can diagnose, prescribe and admit. Useful for finding accredited psychiatrists and teaching-hospital clinics near you.',
   null, null, 'https://www.apn.org.ng/', 101),

  ('Medical and Dental Council of Nigeria (MDCN)', 'professional', 'Nationwide',
   'The statutory regulator for all doctors in Nigeria, including psychiatrists. Use it to check that someone calling themselves a psychiatrist is actually registered before you pay for an appointment.',
   null, null, 'https://www.mdcn.gov.ng', 102),

  ('Nigerian Psychological Association (NPA)', 'professional', 'Nationwide',
   'The apex professional body for psychologists in Nigeria. Sets training standards and maintains a membership register.',
   null, null, 'https://npass.org.ng/', 103),

  ('Nigerian Association of Clinical Psychologists (NACP)', 'professional', 'Nationwide',
   'Founded in 1980, the professional body specifically for clinical psychologists — the people who deliver talking therapy such as CBT.',
   null, null, 'https://nacp.com.ng/', 104),

  ('Association for Counsellors, Matchmaking & Psychotherapy of Nigeria (ACMPN)', 'professional', 'Nationwide',
   'Professional body for counsellors and psychotherapists, setting standards of practice and holding a register of members.',
   null, null, 'https://acmpn.org/', 105),

  ('TherapyRoute — Nigeria', 'online', 'Nationwide',
   'A searchable listing of therapists practising in Nigeria, filterable by city and specialism. Listings are self-submitted, so check credentials against the professional bodies above.',
   null, null, 'https://www.therapyroute.com/therapists/nigeria', 106),

  ('MyTherapist.ng', 'online', 'Nationwide',
   'Nigerian directory and booking service for therapists and counsellors, including online sessions.',
   null, null, 'https://mytherapist.ng', 107),

  ('Nigerian Mental Health', 'online', 'Nationwide',
   'A community-maintained list of Nigerian helplines and mental health services, kept reasonably current.',
   null, null, 'https://www.nigerianmentalhealth.org/helplines', 108),

  ('Idimma Foundation', 'ngo', 'Nationwide',
   'Nigerian mental health NGO working on awareness, support and access to care.',
   null, null, 'https://idimma.org/', 109),

  -- ---------- West Africa ----------
  ('Ghana Mental Health Authority', 'helpline', 'Ghana',
   'The government body overseeing mental health services in Ghana, operating a public support line.',
   '024 447 1279', 'tel:+233244471279', null, 120),

  ('Mental Health Coalition Sierra Leone', 'ngo', 'Sierra Leone',
   'Coalition of organisations and individuals working on mental health advocacy, support and service access in Sierra Leone.',
   '078 522 787', 'tel:+23278522787', 'https://mentalhealthcoalitionsl.com', 121),

  ('Centre de Guidance Infantile et Familiale', 'helpline', 'Senegal',
   'Child and family guidance centre in Dakar offering mental health support and counselling.',
   '33 889 38 00', 'tel:+221338893800', null, 122),

  ('ABMS — Association Béninoise pour le Marketing Social', 'helpline', 'Benin',
   'Beninese health organisation running a public support line covering mental health and wellbeing.',
   '7344', 'tel:7344', 'https://abmsbj.org', 123)

) as v(name, category, state, description, phone, phone_href, url, sort_order)
where not exists (select 1 from public.directory_entries d where d.name = v.name);
