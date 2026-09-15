import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSiteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("resolveSiteUrl", () => {
  it("prefers an explicit SITE_URL", () => {
    vi.stubEnv("SITE_URL", "https://jedseno.dev");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "my-duo-gamma.vercel.app");
    expect(resolveSiteUrl()).toBe("https://jedseno.dev");
  });

  it("strips a trailing slash so paths do not double up", () => {
    vi.stubEnv("SITE_URL", "https://jedseno.dev/");
    expect(resolveSiteUrl()).toBe("https://jedseno.dev");
  });

  it("falls back to Vercel's production domain, adding the scheme", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "my-duo-gamma.vercel.app");
    // Vercel supplies the bare domain, without https://.
    expect(resolveSiteUrl()).toBe("https://my-duo-gamma.vercel.app");
  });

  it("ignores an empty SITE_URL rather than returning an empty base", () => {
    vi.stubEnv("SITE_URL", "   ");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "my-duo-gamma.vercel.app");
    expect(resolveSiteUrl()).toBe("https://my-duo-gamma.vercel.app");
  });

  it("falls back to localhost off Vercel", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(resolveSiteUrl()).toBe("http://localhost:3000");
  });

  it("returns a value URL can parse, so metadataBase never throws", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "my-duo-gamma.vercel.app");
    expect(() => new URL(resolveSiteUrl())).not.toThrow();
  });
});
