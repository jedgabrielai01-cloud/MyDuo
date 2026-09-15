import { describe, expect, it } from "vitest";
import { ERR_SENTINEL, mapFailure, politeError } from "./openrouter";

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
