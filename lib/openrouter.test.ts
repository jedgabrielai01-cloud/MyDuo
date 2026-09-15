import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ERR_SENTINEL,
  mapFailure,
  parseSseLine,
  politeError,
  streamAnswer,
  type StreamEvent,
} from "./openrouter";

const MODEL = "inclusionai/ling-3.0-flash-vl:free";

describe("mapFailure", () => {
  it("maps a missing key without naming the variable's value", () => {
    expect(mapFailure({ kind: "no-key" })).toBe("configuration error — AI not configured");
  });

  it("maps 401 and 403 to authentication rejected", () => {
    expect(mapFailure({ kind: "http", status: 401, model: MODEL })).toContain(
      "401 authentication rejected",
    );
    expect(mapFailure({ kind: "http", status: 403, model: MODEL })).toContain(
      "403 authentication rejected",
    );
  });

  it("maps 402 to no credits", () => {
    expect(mapFailure({ kind: "http", status: 402, model: MODEL })).toContain(
      "402 no credits available",
    );
  });

  it("maps 429 to provider rate limit", () => {
    expect(mapFailure({ kind: "http", status: 429, model: MODEL })).toContain(
      "429 provider rate limit",
    );
  });

  it("maps 5xx to provider unavailable", () => {
    expect(mapFailure({ kind: "http", status: 503, model: MODEL })).toContain(
      "503 provider unavailable",
    );
  });

  it("maps network failures", () => {
    expect(mapFailure({ kind: "network" })).toContain("network unreachable");
  });

  it("maps the first-token timeout with its duration", () => {
    expect(mapFailure({ kind: "timeout-first-token", model: MODEL })).toContain(
      "no response within 10s",
    );
  });

  it("maps the total timeout with its duration", () => {
    expect(mapFailure({ kind: "timeout-total", model: MODEL })).toContain(
      "response exceeded 25s",
    );
  });

  it("passes a local rate-limit reason through", () => {
    expect(
      mapFailure({ kind: "rate-limit", message: "too many questions — limit 15 per hour" }),
    ).toContain("too many questions — limit 15 per hour");
  });

  it("appends the short model name when one is given", () => {
    expect(mapFailure({ kind: "http", status: 429, model: MODEL })).toContain(
      "ling-3.0-flash-vl:free",
    );
  });

  it("truncates a long upstream message to 120 characters", () => {
    const long = "x".repeat(400);
    const out = mapFailure({ kind: "http", status: 500, message: long, model: MODEL });
    expect(out).not.toContain("x".repeat(121));
  });

  it("never echoes anything resembling an API key", () => {
    const out = mapFailure({
      kind: "http",
      status: 401,
      message: "bad key sk-or-v1-deadbeefdeadbeefdeadbeefdeadbeef",
      model: MODEL,
    });
    expect(out).not.toContain("sk-or-v1-");
  });
});

describe("politeError", () => {
  it("starts with the sentinel so the client can split it out", () => {
    expect(politeError("429 provider rate limit").startsWith(ERR_SENTINEL)).toBe(true);
  });

  it("is polite, suggests a local command, and carries the reason", () => {
    const msg = politeError("429 provider rate limit");
    expect(msg).toContain("Sorry");
    expect(msg).toContain("experience");
    expect(msg).toContain("[reason: 429 provider rate limit]");
  });
});

/** Builds a Response whose body streams the given SSE lines. */
function sseResponse(lines: string[], status = 200): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const l of lines) controller.enqueue(enc.encode(l + "\n"));
      controller.close();
    },
  });
  return new Response(body, { status, headers: { "content-type": "text/event-stream" } });
}

async function collect(gen: AsyncGenerator<StreamEvent>): Promise<StreamEvent[]> {
  const out: StreamEvent[] = [];
  for await (const e of gen) out.push(e);
  return out;
}

const BASE = {
  messages: [{ role: "user" as const, content: "hi" }],
  apiKey: "test-key",
  siteUrl: "http://localhost:3000",
};

describe("parseSseLine", () => {
  it("returns null for heartbeat comments", () => {
    expect(parseSseLine(": OPENROUTER PROCESSING")).toBeNull();
  });

  it("returns null for blank lines", () => {
    expect(parseSseLine("")).toBeNull();
  });

  it("extracts delta content", () => {
    const line = 'data: {"choices":[{"delta":{"content":"Hello"}}]}';
    expect(parseSseLine(line)).toEqual({ content: "Hello" });
  });

  it("detects the done marker", () => {
    expect(parseSseLine("data: [DONE]")).toEqual({ done: true });
  });

  it("detects a mid-stream error payload", () => {
    const line =
      'data: {"error":{"code":"server_error","message":"Provider disconnected"},"choices":[{"delta":{"content":""},"finish_reason":"error"}]}';
    expect(parseSseLine(line)?.error).toContain("Provider disconnected");
  });

  it("returns null for malformed json rather than throwing", () => {
    expect(parseSseLine("data: {not json")).toBeNull();
  });
});

describe("streamAnswer", () => {
  it("yields text chunks from a successful stream", async () => {
    const fetchImpl = async () =>
      sseResponse([
        ": OPENROUTER PROCESSING",
        'data: {"choices":[{"delta":{"content":"He "}}]}',
        'data: {"choices":[{"delta":{"content":"ships COBOL."}}]}',
        "data: [DONE]",
      ]);

    const events = await collect(
      streamAnswer({ ...BASE, models: ["m1"], fetchImpl: fetchImpl as unknown as typeof fetch }),
    );

    expect(events).toEqual([
      { type: "text", value: "He " },
      { type: "text", value: "ships COBOL." },
    ]);
  });

  it("falls back to the next model when the first returns 429", async () => {
    const seen: string[] = [];
    const fetchImpl = async (_url: string, init: RequestInit) => {
      const model = JSON.parse(init.body as string).model;
      seen.push(model);
      if (model === "m1")
        return new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 });
      return sseResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}', "data: [DONE]"]);
    };

    const events = await collect(
      streamAnswer({
        ...BASE,
        models: ["m1", "m2"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    );

    expect(seen).toEqual(["m1", "m2"]);
    expect(events).toEqual([{ type: "text", value: "ok" }]);
  });

  it("yields a single error event when every model fails", async () => {
    const fetchImpl = async () => new Response("{}", { status: 503 });

    const events = await collect(
      streamAnswer({
        ...BASE,
        models: ["m1", "m2"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("error");
    if (events[0].type === "error") expect(events[0].reason).toContain("503 provider unavailable");
  });

  it("does not switch models after text has streamed", async () => {
    const seen: string[] = [];
    const fetchImpl = async (_url: string, init: RequestInit) => {
      seen.push(JSON.parse(init.body as string).model);
      return sseResponse([
        'data: {"choices":[{"delta":{"content":"partial"}}]}',
        'data: {"error":{"message":"provider died"},"choices":[{"delta":{"content":""},"finish_reason":"error"}]}',
      ]);
    };

    const events = await collect(
      streamAnswer({
        ...BASE,
        models: ["m1", "m2"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    );

    expect(seen).toEqual(["m1"]);
    expect(events[0]).toEqual({ type: "text", value: "partial" });
    expect(events[1].type).toBe("error");
  });

  it("reports a missing key without calling fetch", async () => {
    let called = false;
    const fetchImpl = async () => {
      called = true;
      return new Response("{}");
    };

    const events = await collect(
      streamAnswer({
        ...BASE,
        apiKey: "",
        models: ["m1"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    );

    expect(called).toBe(false);
    if (events[0].type === "error") expect(events[0].reason).toContain("AI not configured");
  });

  it("maps a thrown fetch error to a network failure", async () => {
    const fetchImpl = async () => {
      throw new TypeError("fetch failed");
    };

    const events = await collect(
      streamAnswer({ ...BASE, models: ["m1"], fetchImpl: fetchImpl as unknown as typeof fetch }),
    );

    if (events[0].type === "error") expect(events[0].reason).toContain("network unreachable");
  });

  it("sends the attribution headers and caps max_tokens", async () => {
    let init: RequestInit | undefined;
    const fetchImpl = async (_url: string, i: RequestInit) => {
      init = i;
      return sseResponse(["data: [DONE]"]);
    };

    await collect(
      streamAnswer({ ...BASE, models: ["m1"], fetchImpl: fetchImpl as unknown as typeof fetch }),
    );

    const headers = init!.headers as Record<string, string>;
    expect(headers["HTTP-Referer"]).toBe("http://localhost:3000");
    expect(headers["X-Title"]).toBeTruthy();
    const body = JSON.parse(init!.body as string);
    expect(body.max_tokens).toBe(700);
    expect(body.temperature).toBe(0.3);
    expect(body.stream).toBe(true);
  });

  it("never leaks the api key into an error reason", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ error: { message: "invalid sk-or-v1-abcdef123456" } }), {
        status: 401,
      });

    const events = await collect(
      streamAnswer({
        ...BASE,
        apiKey: "sk-or-v1-abcdef123456",
        models: ["m1"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    );

    if (events[0].type === "error") expect(events[0].reason).not.toContain("sk-or-v1-");
  });
});

describe("streamAnswer timeouts", () => {
  afterEach(() => vi.useRealTimers());

  it("aborts on the first-token deadline and falls back to the next model", async () => {
    vi.useFakeTimers();
    const seen: string[] = [];

    const fetchImpl = (_url: string, init: RequestInit) => {
      const model = JSON.parse(init.body as string).model;
      seen.push(model);
      if (model === "m1") {
        // Never sends a first token; only settles when aborted.
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        });
      }
      return Promise.resolve(
        sseResponse(['data: {"choices":[{"delta":{"content":"fallback answer"}}]}', "data: [DONE]"]),
      );
    };

    const pending = collect(
      streamAnswer({ ...BASE, models: ["m1", "m2"], fetchImpl: fetchImpl as unknown as typeof fetch }),
    );
    await vi.advanceTimersByTimeAsync(10_001);
    const events = await pending;

    expect(seen).toEqual(["m1", "m2"]);
    expect(events).toEqual([{ type: "text", value: "fallback answer" }]);
  });

  it("keeps partial text when the total deadline expires", async () => {
    // now(): start, first loop check (in budget), second check (over budget).
    const clock = [0, 1_000, 30_000];
    let i = 0;
    const now = () => clock[Math.min(i++, clock.length - 1)];

    const fetchImpl = async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"partial answer"}}]}',
        'data: {"choices":[{"delta":{"content":" never arrives"}}]}',
      ]);

    const events = await collect(
      streamAnswer({
        ...BASE,
        models: ["m1", "m2"],
        fetchImpl: fetchImpl as unknown as typeof fetch,
        now,
      }),
    );

    expect(events[0]).toEqual({ type: "text", value: "partial answer" });
    expect(events).toHaveLength(2);
    expect(events[1].type).toBe("error");
    if (events[1].type === "error") expect(events[1].reason).toContain("response exceeded 25s");
  });
});
