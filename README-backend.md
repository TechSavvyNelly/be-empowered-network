# Backend

Static site on Railway; everything dynamic runs on Supabase
(`wsytzmqxktvzxpwcfjyw`). No server to maintain.

## What lives where

| Feature | Front end | Back end |
|---|---|---|
| Sign in / sign up | `signin.html`, `signin.js` | Supabase Auth |
| Account dashboard | `account.html`, `account.js` | `profiles` |
| Contact + volunteer forms | `forms.js` | `submit-enquiry` → `enquiries` + Resend |
| Newsletter sign-up | `forms.js` (footer, every page) | `subscribe` → `subscribers` |
| Confirm / unsubscribe | `newsletter.html`, `newsletter.js` | `newsletter-action` |
| Sending a newsletter | `admin.html` | `send-campaign` → Resend |
| Events + RSVPs | `events.js`, `data-sync.js` | `events`, `rsvps` |
| Directory | `directory.js`, `data-sync.js` | `directory_entries` |
| Admin | `admin.html`, `admin.js` | RLS + `profiles.is_admin` |
| "Bee" chat | `chat.js`, `chat-copy.js` | `bee-chat` → Claude Opus 5 |

## Deploy

**1. Database**
```sh
# Supabase → SQL Editor, in this order:
#   supabase-schema.sql      tables, RLS policies, triggers
#   supabase-seed.sql        the 10 events and 17 directory entries
```

**2. Edge Functions**
```sh
supabase login
supabase link --project-ref wsytzmqxktvzxpwcfjyw
supabase functions deploy submit-enquiry
supabase functions deploy subscribe
supabase functions deploy newsletter-action
supabase functions deploy send-campaign
```

**3. Secrets** — see `README-mail.md`.

**4. Make yourself an admin.** Sign up through `signin.html` first, then
in the SQL Editor:
```sql
update public.profiles set is_admin = true
where email = 'your@email.address';
```
`is_admin` cannot be set from the browser — a trigger blocks it — so this
is deliberately a deliberate act in the dashboard.

**5. Site** — `git push`; Railway builds from the repo automatically.

## Bee (the chat companion)

Bee speaks English and Nigerian Pidgin, and is backed by Claude Opus 5
through the `bee-chat` Edge Function.

**The crisis check is a boundary, not a feature.** It runs twice: in the
browser (instant, no round trip) and again inside the function, because a
client-side check is advisory only. Either way crisis text **never
reaches the model** — the highest-stakes moment is answered by text we
wrote, not text that was generated. Replayed history is screened too.

If `ANTHROPIC_API_KEY` is unset, or the API errors, or the network drops,
the function returns `fallback: true` and the browser quietly reverts to
the scripted CBT flows. Bee never shows an error to someone already
having a bad day.

```sh
supabase secrets set ANTHROPIC_API_KEY='sk-ant-...' --project-ref wsytzmqxktvzxpwcfjyw
```

Cost: roughly 1.8p–2p per turn at `effort: low` with the system prompt
cached, so about 20p for a full conversation. `response.usage` is returned
to the client for monitoring.

Two test files guard this:
```sh
node test/chat-safety.test.js       # 43 assertions, both languages
node test/bee-chat-safety.test.js   # 42 — server and browser copies must agree
```

## Security model

The browser only ever holds the **anon** key, which is public by design.
Safety comes from Row Level Security, not from hiding that key:

- `profiles`, `rsvps` — you can read and write **only your own row**
- `events`, `directory_entries` — anyone may read published rows; only
  admins may write
- `enquiries`, `subscribers` — **no anon policy at all.** The browser
  cannot read or write them under any circumstances. Writes happen inside
  Edge Functions using the `service_role` key, which never leaves Supabase
- `campaigns` — admins only

`send-campaign` re-checks `is_admin` server-side against the caller's JWT,
so the admin page's own gate is only cosmetic.

Both Edge Functions that accept public input **re-validate everything**
(`_shared/lib.ts`). Client-side validation is for fast, kind feedback; it
is never the boundary. Both also carry a honeypot field to absorb bots.

## Resilience

`events.js` and `directory.js` still contain the original hardcoded
arrays. `data-sync.js` replaces them with live rows when Supabase answers,
and leaves them alone when it doesn't — so if the database is unreachable
the site still renders its content rather than showing an empty page.
