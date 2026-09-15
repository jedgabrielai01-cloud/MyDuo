import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

beforeEach(() => resetRateLimits());

describe("checkRateLimit", () => {
  it("allows the first request", () => {
    expect(checkRateLimit("1.1.1.1", 0).allowed).toBe(true);
  });

  it("allows 5 requests in a minute and blocks the 6th", () => {
    for (let i = 0; i < 5; i++) expect(checkRateLimit("1.1.1.1", i * 1000).allowed).toBe(true);
    const v = checkRateLimit("1.1.1.1", 5000);
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.reason).toContain("per minute");
  });

  it("allows again after the minute window rolls over", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("1.1.1.1", i * 1000);
    expect(checkRateLimit("1.1.1.1", MINUTE + 1).allowed).toBe(true);
  });

  it("blocks past 15 in an hour even when spread out", () => {
    for (let i = 0; i < 15; i++) {
      expect(checkRateLimit("1.1.1.1", i * 2 * MINUTE).allowed).toBe(true);
    }
    const v = checkRateLimit("1.1.1.1", 15 * 2 * MINUTE);
    expect(v.allowed).toBe(false);
    if (!v.allowed) expect(v.reason).toContain("per hour");
  });

  it("allows again after the hour window rolls over", () => {
    for (let i = 0; i < 15; i++) checkRateLimit("1.1.1.1", i * 2 * MINUTE);
    expect(checkRateLimit("1.1.1.1", HOUR + 31 * MINUTE).allowed).toBe(true);
  });

  it("tracks IPs independently", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("1.1.1.1", i * 1000);
    expect(checkRateLimit("2.2.2.2", 5000).allowed).toBe(true);
  });
});
