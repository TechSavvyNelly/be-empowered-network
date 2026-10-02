# Accounts and sign-in

The sign-in page is `signin.html`, backed by Supabase
(`wsytzmqxktvzxpwcfjyw`). Config lives in `supabase-config.js`.

## One-time setup

1. **Database** — run `supabase-schema.sql` in Supabase → SQL Editor.
   It creates `public.profiles`, locks it behind Row Level Security so a
   person can only read and write their own row, and adds a trigger that
   creates the profile row on signup (including via Google/Apple).

2. **Redirect URLs** — Supabase → Authentication → URL Configuration →
   Redirect URLs, add:
   ```
   https://beempowerednetwork.org/**
   https://www.beempowerednetwork.org/**
   https://web-production-ce1c7.up.railway.app/**
   ```
   Without these, confirmation links and OAuth returns will be rejected.

3. **Google** (free) — create an OAuth client in Google Cloud Console,
   authorised redirect URI:
   `https://wsytzmqxktvzxpwcfjyw.supabase.co/auth/v1/callback`
   Paste the client ID and secret into Supabase → Authentication →
   Providers → Google, and enable it.

4. **Apple** (needs the Apple Developer Program, $99/year) — create a
   Services ID and a Sign in with Apple key, then fill in Supabase →
   Authentication → Providers → Apple.

The page reads `/auth/v1/settings` on load and **hides any provider that
isn't enabled**, so unconfigured buttons never appear. Nothing breaks if
you only ever turn on Google.

## How "authentic" email and phone actually work

**Email — genuinely verified.** Three layers:
- strict format check (stricter than the RFC: no quoted locals, no IP literals)
- disposable domains blocked, and near-miss typos caught by edit distance,
  so `ada@gmial.com` prompts "did you mean ada@gmail.com?"
- **Supabase emails a confirmation link and the account stays unusable
  until it's clicked.** This is the only layer that proves the inbox is real.
  It relies on `mailer_autoconfirm` being off — it currently is. Don't
  turn it on.

**Phone — format only, NOT verified.** Numbers are normalised to E.164
(`0803 123 4567` → `+2348031234567`) and Nigerian mobile prefixes are
checked. This proves the number is *well-formed*, not that the person
owns it. Real verification needs SMS OTP, which needs a paid SMS
provider (Twilio et al.) configured in Supabase → Authentication →
Providers → Phone. Until then, treat stored phone numbers as unconfirmed;
the `profiles.phone_verified` column is there for when you add it.

## Admin access

`admin.html` is gated on `profiles.is_admin`, which is deliberately not
settable from the browser. To create the first admin:

1. Sign up at `/signin.html` with the address that should own the account
   (the organisation uses `hello@beempowerednetwork.org`) and click the
   confirmation link in the inbox.
2. Run `supabase-migration-first-admin.sql` once in Supabase -> SQL Editor.
3. Run `supabase-make-admin.sql`, which flips `is_admin` for that address
   and prints the row back so you can confirm it worked.

After that, an existing admin can promote others. Without step 2 nothing
can be promoted at all: the original guard required you to already be an
admin, including from the SQL Editor, so the first one could never exist.

## Sessions

Accounts are Supabase Auth throughout. The old browser-local `auth.js`
(localStorage) has been removed; `api.js` now paints the header's
`[data-account-link]` from the real session, so the header reflects
whether someone is actually signed in and repaints on sign in and out.
