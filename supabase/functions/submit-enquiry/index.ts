// Contact / volunteer / partnership forms.
// Stores the enquiry, then emails hello@ with reply-to set to the sender.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json, cleanEmail, cleanPhone, escapeHtml, sendMail, wrap, NOTIFY_TO } from "../_shared/lib.ts";

const KINDS = new Set(["contact", "volunteer", "partner", "donation"]);

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400, origin); }

  // Honeypot: real people never fill a hidden field.
  if (body.website) return json({ ok: true }, 200, origin);

  const kind = String(body.kind ?? "contact");
  if (!KINDS.has(kind)) return json({ error: "Unknown form" }, 400, origin);

  const name = String(body.name ?? "").trim();
  const email = cleanEmail(body.email);
  const phone = cleanPhone(body.phone);
  const message = String(body.message ?? "").trim();
  const topic = String(body.topic ?? "").trim() || null;

  if (name.length < 2) return json({ error: "Please tell us your name." }, 400, origin);
  if (!email) return json({ error: "That email address doesn't look right." }, 400, origin);
  if (message.length < 10) return json({ error: "Please add a little more detail to your message." }, 400, origin);
  if (message.length > 5000) return json({ error: "That message is too long." }, 400, origin);
  if (body.phone && !phone) return json({ error: "That phone number doesn't look right." }, 400, origin);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const meta: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!["kind", "name", "email", "phone", "message", "topic", "website"].includes(k)) meta[k] = v;
  }

  const { data, error } = await admin.from("enquiries")
    .insert({ kind, name, email, phone, topic, message, meta })
    .select("id").single();

  if (error) {
    console.error("insert failed", error);
    return json({ error: "We couldn't save your message. Please email hello@beempowerednetwork.org." }, 500, origin);
  }

  const rows = [
    ["Name", name], ["Email", email], ["Phone", phone ?? "—"],
    ["Form", kind], ["Topic", topic ?? "—"],
  ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b5a62;">${k}</td><td style="padding:4px 0;"><strong>${escapeHtml(String(v))}</strong></td></tr>`).join("");

  const mailErr = await sendMail({
    to: NOTIFY_TO(),
    replyTo: email,
    subject: `[${kind}] ${name}${topic ? " — " + topic : ""}`,
    html: wrap("New website enquiry",
      `<table style="font-size:14px;border-collapse:collapse;">${rows}</table>
       <p style="margin-top:20px;white-space:pre-wrap;font-size:14px;line-height:1.6;">${escapeHtml(message)}</p>
       <p style="margin-top:20px;font-size:12px;color:#6b5a62;">Reply to this email to answer ${escapeHtml(name)} directly.</p>`),
  });

  // The enquiry is saved either way — a mail failure must not lose it.
  if (mailErr) console.error("notify failed", mailErr, "enquiry", data.id);

  return json({ ok: true, id: data.id }, 200, origin);
});
