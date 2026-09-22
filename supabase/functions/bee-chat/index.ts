// Bee — CBT companion, backed by Claude.
//
// The crisis check runs on BOTH sides. The browser screens first so a
// person in danger gets helplines instantly with no network round trip;
// this function screens again because client-side checks are advisory,
// not a boundary. Either way, crisis text never reaches the model: the
// highest-stakes moment is answered by text we wrote, not generated.
import Anthropic from "npm:@anthropic-ai/sdk@0.71.0";
import { corsHeaders, json } from "../_shared/lib.ts";
import { SYSTEM_PROMPT } from "./prompt.ts";
import { isCrisis } from "./safety.ts";

const MODEL = "claude-opus-5";
const MAX_TURNS = 12;          // keep the tail; cost and focus both suffer past this
const MAX_CHARS = 2000;        // per message

const CRISIS_REPLY = {
  en:
    "Thank you for telling me. What you just said matters, and I want to make sure you get more than a chatbot right now.\n\n" +
    "**If you are in immediate danger, call 112.**\n\n" +
    "To talk to a person now:\n" +
    "- SURPIN (24 hours): 0800 078 7746\n" +
    "- MANI: 0809 111 6264\n" +
    "- NSPI: 0806 210 6493\n\n" +
    "If you can, tell someone near you how you feel, or go to the nearest hospital. You deserve support from a real person, not just from me.",
  pcm:
    "Thank you say you tell me. Wetin you talk na serious thing, and I wan make you get better help pass ordinary chatbot.\n\n" +
    "**If danger dey now now, call 112.**\n\n" +
    "To talk to person wey go hear you:\n" +
    "- SURPIN (24 hours): 0800 078 7746\n" +
    "- MANI: 0809 111 6264\n" +
    "- NSPI: 0806 210 6493\n\n" +
    "If you fit, tell person wey dey near you how you dey feel, or go the hospital wey dey close. You deserve better than only me.",
};

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let body: { message?: unknown; history?: unknown; lang?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400, origin); }

  const message = String(body.message ?? "").trim().slice(0, MAX_CHARS);
  const lang = body.lang === "pcm" ? "pcm" : "en";
  if (!message) return json({ error: "Say something and I'll listen." }, 400, origin);

  // Safety boundary. Never reaches the model.
  if (isCrisis(message)) {
    return json({ reply: CRISIS_REPLY[lang], crisis: true }, 200, origin);
  }

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) {
    // Let the browser fall back to the scripted flows rather than fail.
    return json({ error: "not-configured", fallback: true }, 503, origin);
  }

  const raw = Array.isArray(body.history) ? body.history : [];
  const history = raw
    .filter((m): m is { role: string; content: string } =>
      !!m && typeof m === "object" &&
      (m as { role?: unknown }).role !== undefined &&
      typeof (m as { content?: unknown }).content === "string")
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-MAX_TURNS)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: String(m.content).slice(0, MAX_CHARS),
    }));

  // A stray crisis line in replayed history would otherwise slip past.
  if (history.some((m) => m.role === "user" && isCrisis(m.content))) {
    return json({ reply: CRISIS_REPLY[lang], crisis: true }, 200, origin);
  }

  const client = new Anthropic({ apiKey: key });

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 700,
      // Chat is latency-sensitive and the turns are short; low effort is
      // the right trade here, and it keeps the per-turn cost sane.
      output_config: { effort: "low" },
      // Frozen prefix, cached: the prompt is ~1.2k tokens and never varies.
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [...history, { role: "user", content: message }],
      // If a safety classifier declines, the API re-runs on a fallback
      // model in the same call instead of leaving the person with nothing.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return json({
        reply: lang === "pcm"
          ? "I no fit answer that one. Make we go back to wetin dey worry you — or if e heavy well well, abeg call 112 or check the directory: https://beempowerednetwork.org/directory.html"
          : "I can't help with that one. Let's come back to what's going on for you — and if it's heavy, please call 112 or look at the directory: https://beempowerednetwork.org/directory.html",
        refused: true,
      }, 200, origin);
    }

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!reply) return json({ error: "not-configured", fallback: true }, 503, origin);

    return json({
      reply,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cached: response.usage.cache_read_input_tokens ?? 0,
      },
    }, 200, origin);
  } catch (e) {
    console.error("bee-chat", e instanceof Error ? e.message : e);
    // Fall back to the scripted Bee rather than showing an error.
    return json({ error: "upstream", fallback: true }, 503, origin);
  }
});
