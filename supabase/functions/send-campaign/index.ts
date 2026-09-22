// Send a newsletter campaign to every confirmed subscriber.
// Admin only: the caller's JWT must belong to a profile with is_admin.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json, escapeHtml, sendMail, wrap, SITE } from "../_shared/lib.ts";

const BATCH = 50;               // Resend accepts bursts; keep well inside limits
const PAUSE_MS = 1100;          // ~1 req/sec, comfortably under the free tier

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Not signed in." }, 401, origin);

  // Who is calling?
  const asUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
  );
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: "Not signed in." }, 401, origin);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: me } = await admin.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
  if (!me?.is_admin) return json({ error: "Admins only." }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400, origin); }

  const subject = String(body.subject ?? "").trim();
  const bodyHtml = String(body.body_html ?? "").trim();
  const test = Boolean(body.test);
  if (!subject || !bodyHtml) return json({ error: "Subject and body are both required." }, 400, origin);

  // A test send goes only to the admin who pressed the button.
  let recipients: { email: string; token: string }[];
  if (test) {
    recipients = [{ email: user.email!, token: "test" }];
  } else {
    const { data } = await admin.from("subscribers")
      .select("email, token").eq("status", "confirmed");
    recipients = data ?? [];
  }
  if (!recipients.length) return json({ error: "No confirmed subscribers yet." }, 400, origin);

  const { data: campaign } = await admin.from("campaigns")
    .insert({ subject, body_html: bodyHtml, status: "sending", created_by: user.id })
    .select("id").single();

  let sent = 0;
  const failures: string[] = [];

  for (let i = 0; i < recipients.length; i += BATCH) {
    for (const r of recipients.slice(i, i + BATCH)) {
      const unsub = `${SITE()}/newsletter.html?action=unsubscribe&token=${r.token}`;
      const err = await sendMail({
        to: r.email,
        subject,
        html: wrap(subject, bodyHtml,
          `<br><a href="${unsub}" style="color:#6b5a62;">Unsubscribe</a>`),
      });
      if (err) failures.push(`${r.email}: ${err}`); else sent++;
      await new Promise((res) => setTimeout(res, PAUSE_MS));
    }
  }

  if (campaign && !test) {
    await admin.from("campaigns").update({
      status: failures.length === recipients.length ? "failed" : "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
    }).eq("id", campaign.id);
  }

  if (failures.length) console.error("campaign failures", failures.slice(0, 20));
  return json({ ok: true, sent, failed: failures.length, test }, 200, origin);
});
