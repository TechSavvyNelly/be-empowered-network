// Newsletter sign-up with double opt-in: nothing is on the list until
// the person clicks the link we email them.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json, cleanEmail, escapeHtml, sendMail, wrap, SITE } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400, origin); }
  if (body.website) return json({ ok: true }, 200, origin);   // honeypot

  const email = cleanEmail(body.email);
  const name = String(body.name ?? "").trim() || null;
  const source = String(body.source ?? "footer").slice(0, 40);
  if (!email) return json({ error: "That email address doesn't look right." }, 400, origin);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: existing } = await admin.from("subscribers")
    .select("id, status, token").ilike("email", email).maybeSingle();

  // Already confirmed: say the same thing either way, so this endpoint
  // can't be used to test whether an address is on the list.
  if (existing?.status === "confirmed") {
    return json({ ok: true, message: "Check your inbox to confirm your subscription." }, 200, origin);
  }

  let token = existing?.token as string | undefined;
  if (existing) {
    const { data } = await admin.from("subscribers")
      .update({ status: "pending", name, unsubscribed_at: null })
      .eq("id", existing.id).select("token").single();
    token = data?.token ?? token;
  } else {
    const { data, error } = await admin.from("subscribers")
      .insert({ email, name, source, status: "pending" })
      .select("token").single();
    if (error) {
      console.error("subscribe insert", error);
      return json({ error: "We couldn't sign you up just now. Please try again." }, 500, origin);
    }
    token = data.token;
  }

  const confirm = `${SITE()}/newsletter.html?action=confirm&token=${token}`;
  const mailErr = await sendMail({
    to: email,
    subject: "Confirm your Be Empowered Network newsletter",
    html: wrap("One click and you're in",
      `<p style="font-size:14px;line-height:1.6;">Hello${name ? " " + escapeHtml(name) : ""}, please confirm you'd like our monthly newsletter.</p>
       <p style="margin:24px 0;"><a href="${confirm}" style="background:#b4436c;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Confirm subscription</a></p>
       <p style="font-size:12px;color:#6b5a62;">If you didn't ask for this, ignore this email and nothing happens — you won't be added.</p>`),
  });
  if (mailErr) {
    console.error("confirm mail", mailErr);
    return json({ error: "We couldn't send the confirmation email. Please try again." }, 500, origin);
  }

  return json({ ok: true, message: "Check your inbox to confirm your subscription." }, 200, origin);
});
