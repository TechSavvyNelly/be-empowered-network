# Be Empowered Network — website

Static site for Be Empowered Network ("Bee Network"), a Nigerian mental health non-profit
founded February 2017 and registered with the CAC as Incorporated Trustees (CAC/IT/NO 140796).

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 4173
# then visit http://127.0.0.1:4173/
```

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: hero, what we do, story/timeline, help pathway, get involved, CTA |
| `about.html` | Mission, beliefs, history, Board of Trustees (from the CAC certificate) |
| `programmes.html` | Six programmes (peer circles, schools, workplace, faith leaders, campaigns, referral) |
| `get-help.html` | Helplines, four-step pathway, signs to look out for, helping someone else |
| `get-involved.html` | Volunteer form, partnership options, ways to give |
| `contact.html` | Contact details + form (supports `?topic=circle|volunteer|partnership|...`) |
| `events.html` | Upcoming events with filters, RSVP and add-to-calendar; highlights + past events |
| `account.html` | Sign in / create account, newsletter preferences, your RSVPs |
| `directory.html` | Searchable mental health directory (hospitals, helplines, NGOs, online) |
| `styles.css` | Design tokens (light + dark), components |
| `main.js` | Theme toggle, mobile menu, scroll reveal, form → email, topic preselect |
| `auth.js` | Browser-local accounts (`BenAuth`): sign up / in / out, prefs, RSVPs, header state |
| `events.js` | `EVENTS` data + events page rendering; also used by the account dashboard |
| `account.js` | Account page: tabs, validation, dashboard |
| `directory.js` | `DIRECTORY` data + search/filter rendering |
| `chat.js` | "Bee" CBT companion — loaded on every page; open with the launcher or `#bee` |
| `assets/logo.png` | Full logo (transparent) · `assets/mark.png` — the circular mark, used for favicon/header |

## Before launch — things to confirm or replace

1. **Email address.** `hello@beempowerednetwork.org` is a placeholder domain. Search-and-replace it
   in all six HTML files once you have the real address.
2. **Helpline numbers** on `get-help.html`. `112` is Nigeria's national emergency number. The MANI
   (0809 111 6264) and NSPI (0806 210 6493) numbers must be verified against those organisations'
   current channels before the site goes live — wrong numbers on a mental-health site are serious.
3. **Programme descriptions.** The six programmes are written to fit a Nigerian peer-support NGO;
   edit them to match exactly what Bee Network actually runs. No invented impact statistics were
   included — add real ones (people reached, circles run, schools visited) when you have them.
4. **Location.** The site says "Nigeria" only. Add city/state and a postal address on the contact
   page and footer if you want them public.
5. **Donations.** "Give" currently asks people to email for bank details. Add a Paystack /
   Flutterwave link, or bank details, when ready (`get-involved.html`, `#give`).
6. **Forms.** They currently open the visitor's email app with the message pre-filled (no backend).
   To collect submissions instead, point the `<form>` at Formspree, Netlify Forms or your own
   endpoint and remove the `data-mailto` attribute.
7. **Photography.** The design is type-and-colour led on purpose (no stock photos). Real photos of
   circles, school sessions and campaigns will lift it further — good spots are the hero, the
   "Our story" section and the programme rows.
8. **Social links.** Add them to the footer's Contact column when you have handles.
9. **Events.** Edit the `EVENTS` array in `events.js`. Upcoming/past is worked out automatically
   from the dates. The highlight write-ups on `events.html` and the 2024–2025 past events are
   examples in the network's voice; replace them with what actually happened (and add photos).
10. **Directory.** Edit the `DIRECTORY` array in `directory.js`. The federal neuropsychiatric
    hospitals and NGOs listed are real organisations, but addresses, hours and phone numbers were
    deliberately left out where unverified. Confirm every entry (especially phone numbers and
    websites) before launch, and add clinics/therapists you trust.

## Accounts, newsletter and RSVPs (read this before launch)

The site is static, so `auth.js` stores accounts **in the visitor's own browser** (localStorage,
salted SHA-256 password hashes). That means:

- It works fully as a front end: sign up, sign in, preferences, RSVPs, header state.
- Nothing reaches you. You cannot see who signed up or who RSVP'd, and a user on a second device
  starts from scratch.

To make it real, replace the `store` helpers inside `auth.js` with a backend and keep the
`BenAuth` interface the same. Good fits for a small NGO: **Supabase** (auth + a `profiles` and
`rsvps` table, free tier) or **Firebase Auth + Firestore**. For the newsletter itself, sync the
`prefs.newsletter` flag to Mailchimp / Brevo / Buttondown, or simply embed their signup form on
`account.html`.

## Bee, the CBT companion

`chat.js` is a **scripted** companion, not an AI model. It walks people through structured CBT
exercises using decision trees (this is how tools like Woebot began): thought records, thinking
traps, 5-4-3-2-1 grounding, box breathing (animated), behavioural activation, the worry tree and
sleep basics. Every free-text message is checked against a crisis-language pattern; a match stops
the exercise and shows 112 and the helplines. Nothing typed is stored or sent.

Why scripted: it needs no API key or server, costs nothing to run, never hallucinates, and its
safety behaviour is fully predictable, which matters on a mental-health site. If you later want
open conversation, put Claude behind a small server endpoint (never expose an API key in the
browser), keep the crisis check in front of it, and have a clinician review the system prompt.
The flows in `chat.js` are plain generator functions, so they are easy to edit or add to.

## Deploy

It is a plain static site: drag the folder onto Netlify, or `vercel deploy`, or push to GitHub and
enable Pages. No environment variables or server required.
