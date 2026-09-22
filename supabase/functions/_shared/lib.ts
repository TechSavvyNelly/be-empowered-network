// Shared helpers for every Edge Function.

export const ALLOWED_ORIGINS = [
  "https://beempowerednetwork.org",
  "https://www.beempowerednetwork.org",
  "https://web-production-ce1c7.up.railway.app",
  "http://localhost:8777",
  "http://127.0.0.1:8777",
];

export function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

/* Same rules as the browser-side validator in signin.js. Never trust the
   client's word for it — these run again here. */
const EMAIL_RE =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "10minutemail.com",
  "tempmail.com", "temp-mail.org", "throwawaymail.com", "yopmail.com",
  "trashmail.com", "sharklasers.com", "getnada.com", "dispostable.com",
  "maildrop.cc", "fakeinbox.com", "mailnesia.com", "tempinbox.com",
  "spamgourmet.com", "mytemp.email", "emailondeck.com", "moakt.com",
  "tempr.email", "discard.email", "mailcatch.com", "inboxbear.com",
]);

export function cleanEmail(raw: unknown): string | null {
  const email = String(raw ?? "").trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  if (DISPOSABLE.has(email.split("@")[1])) return null;
  return email;
}

export function cleanPhone(raw: unknown): string | null {
  let s = String(raw ?? "").replace(/[\s()\-.]/g, "");
  if (!s) return null;
  if (/^0\d{10}$/.test(s)) s = "+234" + s.slice(1);
  else if (/^234\d{10}$/.test(s)) s = "+" + s;
  else if (/^[789]\d{9}$/.test(s)) s = "+234" + s;
  if (s.startsWith("+234")) return /^\+234[789]\d{9}$/.test(s) ? s : null;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

/* Send through Resend. Returns null on success, an error string otherwise. */
export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<string | null> {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("MAIL_FROM") ?? "Be Empowered Network <hello@beempowerednetwork.org>";
  if (!key) return "RESEND_API_KEY is not set";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
    }),
  });
  if (r.ok) return null;
  return `Resend ${r.status}: ${await r.text()}`;
}

/* A plain wrapper email so every message we send looks like the site. */
export function wrap(title: string, inner: string, footer = "") {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#fcf8f3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2a1a21;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid rgba(42,26,33,.12);border-radius:16px;padding:32px;">
    <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(title)}</h1>
    ${inner}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b5a62;text-align:center;">
    Be Empowered Network · Incorporated Trustees, CAC/IT/NO 140796<br>
    This email does not provide emergency or clinical services. In an emergency call 112.
    ${footer}
  </p></body></html>`;
}

export const SITE = () => Deno.env.get("SITE_URL") ?? "https://beempowerednetwork.org";
export const NOTIFY_TO = () => Deno.env.get("NOTIFY_TO") ?? "hello@beempowerednetwork.org";
