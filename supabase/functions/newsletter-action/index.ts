// Confirm or unsubscribe, by token. Called from newsletter.html.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/lib.ts";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token");

  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return json({ error: "That link isn't valid." }, 400, origin);
  if (action !== "confirm" && action !== "unsubscribe") return json({ error: "Unknown action." }, 400, origin);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: sub } = await admin.from("subscribers").select("id, email, status").eq("token", token).maybeSingle();
  if (!sub) return json({ error: "That link has expired or was already used." }, 404, origin);

  const patch = action === "confirm"
    ? { status: "confirmed", confirmed_at: new Date().toISOString(), unsubscribed_at: null }
    : { status: "unsubscribed", unsubscribed_at: new Date().toISOString() };

  const { error } = await admin.from("subscribers").update(patch).eq("id", sub.id);
  if (error) return json({ error: "Something went wrong. Please try the link again." }, 500, origin);

  return json({
    ok: true,
    action,
    email: sub.email,
    message: action === "confirm"
      ? "You're on the list. Thank you."
      : "You've been unsubscribed. You won't hear from us again.",
  }, 200, origin);
});
