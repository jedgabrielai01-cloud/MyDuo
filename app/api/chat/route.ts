import { buildSystemPrompt, wrapUserQuestion } from "@/lib/prompt";
import { checkRateLimit } from "@/lib/rate-limit";
import { mapFailure, politeError, streamAnswer, type ChatMessage } from "@/lib/openrouter";
import { resolveSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const maxDuration = 40;

const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY_TURNS = 6;

const DEFAULT_MODEL = "inclusionai/ling-3.0-flash-vl:free";
const DEFAULT_FALLBACKS =
  "inclusionai/ling-3.0-flash-fin:free,inclusionai/ling-3.0-flash-sante:free";

const TEXT_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "cache-control": "no-store",
};

/** Primary model first, then the configured fallbacks, without duplicates. */
function models(): string[] {
  const primary = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || DEFAULT_FALLBACKS)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [primary, ...fallbacks.filter((m) => m !== primary)];
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Keeps the recent turns only, and never lets a visitor inject a system message. */
function historyFrom(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_HISTORY_TURNS);
}

export async function POST(req: Request): Promise<Response> {
  let body: { question?: unknown; history?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Malformed request body.", { status: 400, headers: TEXT_HEADERS });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return new Response("Empty question.", { status: 400, headers: TEXT_HEADERS });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return new Response(`Question too long — ${MAX_QUESTION_CHARS} characters maximum.`, {
      status: 400,
      headers: TEXT_HEADERS,
    });
  }

  const verdict = checkRateLimit(clientIp(req));
  if (!verdict.allowed) {
    return new Response(politeError(mapFailure({ kind: "rate-limit", message: verdict.reason })), {
      status: 429,
      headers: TEXT_HEADERS,
    });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...historyFrom(body.history),
    { role: "user", content: wrapUserQuestion(question) },
  ];

  const events = streamAnswer({
    messages,
    models: models(),
    apiKey: process.env.OPENROUTER_API_KEY ?? "",
    siteUrl: resolveSiteUrl(),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await events.next();
      if (done) {
        controller.close();
        return;
      }
      const chunk = value.type === "text" ? value.value : politeError(value.reason);
      controller.enqueue(encoder.encode(chunk));
    },
    async cancel() {
      await events.return(undefined);
    },
  });

  return new Response(stream, { status: 200, headers: TEXT_HEADERS });
}
