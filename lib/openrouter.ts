export const FIRST_TOKEN_TIMEOUT_MS = 10_000;
export const TOTAL_TIMEOUT_MS = 25_000;

/** Separates the answer from the error notice in our response stream. */
export const ERR_SENTINEL = "\x1e";

export type FailureKind =
  | "no-key"
  | "http"
  | "network"
  | "timeout-first-token"
  | "timeout-total"
  | "rate-limit"
  | "unknown";

export type Failure = {
  kind: FailureKind;
  status?: number;
  message?: string;
  model?: string;
};

const KEY_PATTERN = /sk-or-[\w-]+/gi;

function sanitize(message: string): string {
  return message.replace(KEY_PATTERN, "[redacted]").slice(0, 120);
}

function shortModel(model?: string): string {
  if (!model) return "";
  const slash = model.indexOf("/");
  return slash === -1 ? model : model.slice(slash + 1);
}

/** Maps a failure to one short, safe reason phrase for display. */
export function mapFailure(f: Failure): string {
  let reason: string;

  switch (f.kind) {
    case "no-key":
      return "configuration error — AI not configured";
    case "rate-limit":
      reason = f.message ? sanitize(f.message) : "too many questions";
      break;
    case "network":
      reason = "network unreachable";
      break;
    case "timeout-first-token":
      reason = `no response within ${FIRST_TOKEN_TIMEOUT_MS / 1000}s`;
      break;
    case "timeout-total":
      reason = `response exceeded ${TOTAL_TIMEOUT_MS / 1000}s`;
      break;
    case "http": {
      const s = f.status ?? 0;
      if (s === 401 || s === 403) reason = `${s} authentication rejected`;
      else if (s === 402) reason = `${s} no credits available`;
      else if (s === 429) reason = `${s} provider rate limit`;
      else if (s >= 500) reason = `${s} provider unavailable`;
      else reason = `${s} request rejected`;
      break;
    }
    default:
      reason = f.message ? sanitize(f.message) : "unexpected error";
  }

  const model = shortModel(f.model);
  return model ? `${reason} · ${model}` : reason;
}

/** Builds the sentinel-prefixed polite notice shown in the terminal. */
export function politeError(reason: string): string {
  return (
    ERR_SENTINEL +
    "AI SUBSYSTEM: unavailable.\n" +
    "Sorry about that. Type 'experience' for the same\n" +
    "information instantly, or try again in a moment.\n" +
    `[reason: ${reason}]`
  );
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MAX_TOKENS = 700;
const TEMPERATURE = 0.3;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type StreamEvent = { type: "text"; value: string } | { type: "error"; reason: string };

type ParsedLine = { content?: string; done?: boolean; error?: string } | null;

/**
 * Parses one SSE line. Returns null for heartbeats, blanks, and unparseable
 * payloads. OpenRouter reports mid-stream failures with HTTP 200 inside a data
 * payload, so `error` is checked before content.
 */
export function parseSseLine(line: string): ParsedLine {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":")) return null;
  if (!trimmed.startsWith("data:")) return null;

  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return { done: true };

  try {
    const parsed = JSON.parse(payload);
    if (parsed.error) return { error: String(parsed.error.message ?? "provider error") };
    const content = parsed.choices?.[0]?.delta?.content;
    return content ? { content } : null;
  } catch {
    return null;
  }
}

/**
 * Streams an answer from OpenRouter, trying each model in order.
 * Switches models only before the first token, so a partial answer is never
 * discarded and never duplicated. Yields at most one error event, last.
 */
export async function* streamAnswer(opts: {
  messages: ChatMessage[];
  models: string[];
  apiKey: string;
  siteUrl: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
}): AsyncGenerator<StreamEvent> {
  const doFetch = opts.fetchImpl ?? fetch;
  const now = opts.now ?? (() => Date.now());

  if (!opts.apiKey) {
    yield { type: "error", reason: mapFailure({ kind: "no-key" }) };
    return;
  }

  const started = now();
  let sawText = false;
  let lastFailure: Failure = { kind: "unknown" };

  for (const model of opts.models) {
    if (sawText) break;

    const controller = new AbortController();
    const firstTokenTimer = setTimeout(
      () => controller.abort("first-token"),
      FIRST_TOKEN_TIMEOUT_MS,
    );
    let hitTotalDeadline = false;
    let localText = false;

    try {
      const response = await doFetch(ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": opts.siteUrl,
          "X-Title": "Jed Gabriel Seno",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          stream: true,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE,
          // The ling models are reasoning models and spend 350-690 tokens
          // thinking before the first word of the answer, which both starves
          // max_tokens (measured finish_reason "length" at 631/700 reasoning
          // tokens) and pushes past the first-token deadline. The visitor never
          // sees the thinking, so it buys nothing here.
          reasoning: { enabled: false },
        }),
      });

      if (!response.ok || !response.body) {
        let message: string | undefined;
        try {
          const body = await response.json();
          message = body?.error?.message;
        } catch {
          /* body was not json */
        }
        lastFailure = { kind: "http", status: response.status, message, model };
        continue;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamFailure: Failure | null = null;

      while (true) {
        if (now() - started > TOTAL_TIMEOUT_MS) {
          hitTotalDeadline = true;
          controller.abort("total");
          streamFailure = { kind: "timeout-total", model };
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let finished = false;
        for (const line of lines) {
          const parsed = parseSseLine(line);
          if (!parsed) continue;
          if (parsed.done) {
            finished = true;
            break;
          }
          if (parsed.error) {
            streamFailure = { kind: "unknown", message: parsed.error, model };
            finished = true;
            break;
          }
          if (parsed.content) {
            clearTimeout(firstTokenTimer);
            sawText = true;
            localText = true;
            yield { type: "text", value: parsed.content };
          }
        }
        if (finished) break;
      }

      await reader.cancel().catch(() => {});

      if (streamFailure) {
        lastFailure = streamFailure;
        if (localText) break;
        continue;
      }

      return;
    } catch (err) {
      if (hitTotalDeadline) {
        lastFailure = { kind: "timeout-total", model };
      } else if (controller.signal.aborted) {
        lastFailure = { kind: "timeout-first-token", model };
      } else {
        lastFailure = { kind: "network", message: (err as Error).message, model };
      }
      if (localText) break;
    } finally {
      clearTimeout(firstTokenTimer);
    }
  }

  yield { type: "error", reason: mapFailure(lastFailure) };
}
