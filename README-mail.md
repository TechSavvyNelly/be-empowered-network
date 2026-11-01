# Mail configuration — beempowerednetwork.org

Two separate things share this domain and must not fight:

| | Handles | Records it owns |
|---|---|---|
| **Namecheap Private Email** | *Receiving* `hello@` and replying by hand | `MX` on `@`, SPF on `@` |
| **Resend** | *Sending* from the website (forms, newsletter, confirmations) | everything on the `send` and `resend._domainkey` subdomains |

Because Resend authenticates on a **subdomain**, nothing here touches the
apex SPF or the MX records. Inboxing for `hello@` is unaffected.

## 1. DNS records to add in Namecheap → Advanced DNS

The domain is already registered in Resend (`eu-west-1`, chosen as the
closest region to Nigeria). Add these four, then press **Verify** in
Resend:

| Type | Host | Value | Priority |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCgD8L++UH+2psZfaDphzfBz41P/RHM5wVXCdqWQMG+rQ6TZiV6GAuwtAQog3sN5dXsiIQrjlGx5KFbeXona8SRjFWa5jRJ2wb/juboAi3caDfOSP8PxiteSyjGN7z4763rPXzyZK5MG2Osb3d3THYqNOAlfCmC1f9Xjuoc1iYHWwIDAQAB` | — |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| CNAME | `rsend` | `send.forge.rmta.net` | — |

Host values are subdomains only — Namecheap appends the domain itself.

**Do not touch** the `@` MX records or the `@` SPF
(`v=spf1 include:spf.privateemail.com ~all`). Those keep `hello@` receiving.

## 2. DMARC — currently missing

There is no DMARC record at all. Since 2024, Gmail and Yahoo require one
from bulk senders; without it newsletter mail is far more likely to be
filtered. Add:

| Type | Host | Value |
|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@beempowerednetwork.org; fo=1` |

`p=none` only *reports*, it doesn't reject — that's deliberate. Run it for
two to four weeks, read the reports, and once you can see that all
legitimate mail passes, tighten it to `p=quarantine` and later
`p=reject`. Going straight to `p=reject` risks silently binning real mail.

## 3. Secrets — set these in Supabase, never in the repo

The Resend API key is a **secret**. Unlike the Supabase anon key it must
never appear in client code or in git. Set it as an Edge Function secret:

```sh
supabase secrets set \
  RESEND_API_KEY='<your resend key>' \
  MAIL_FROM='Be Empowered Network <hello@beempowerednetwork.org>' \
  NOTIFY_TO='hello@beempowerednetwork.org' \
  SITE_URL='https://beempowerednetwork.org'
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically; you don't set those.

If the key has ever been pasted somewhere shared, rotate it in the Resend
dashboard and re-run the command. That costs nothing and is the safe default.

## 4. Supabase auth emails should come from hello@ too

By default Supabase sends confirmation and password-reset mail from its
own shared domain, which looks untrustworthy and inboxes poorly. Point it
at Resend: **Supabase → Project Settings → Authentication → SMTP Settings**

```
Host:        smtp.resend.com
Port:        465
Username:    resend
Password:    <your Resend API key>
Sender:      hello@beempowerednetwork.org
Sender name: Be Empowered Network
```

Do this *after* Resend shows the domain as verified, or the sends will fail.

## 5. Order of operations

1. Create the `hello@` mailbox in Namecheap Private Email (dashboard only)
2. Add the four Resend records + the DMARC record
3. Press Verify in Resend — usually minutes, allow up to an hour
4. Set the Supabase secrets
5. Point Supabase SMTP at Resend
6. Send yourself a test from the admin page → Newsletter → "Send test to me"
