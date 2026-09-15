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
