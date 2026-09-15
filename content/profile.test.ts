import { describe, expect, it } from "vitest";
import { profile } from "./profile";
import { expectNoPii } from "@/test/pii";

const serialized = JSON.stringify(profile);

describe("profile data", () => {
  it("carries no email, phone, or sub-country location", () => {
    expectNoPii(serialized);
  });

  it("reports location as Philippines only", () => {
    expect(profile.location).toBe("Philippines");
  });

  it("has five roles, newest first", () => {
    expect(profile.roles).toHaveLength(5);
    expect(profile.roles[0].title).toBe("DXC AI Champion");
  });

  it("covers the whole history back to 2016, so the 9-year claim is visible", () => {
    const oldest = profile.roles.at(-1)!;
    expect(oldest.org).toContain("Accenture");
    expect(oldest.period).toContain("2016");
    expect(JSON.stringify(profile.roles)).toContain("Tata Consultancy Services");
  });

  it("links to the correct LinkedIn profile", () => {
    expect(profile.linkedin).toBe("https://www.linkedin.com/in/jed-gabriel-seno/");
  });

  it("marks AI skill groups so the UI can accent them", () => {
    expect(profile.skills.some((g) => g.ai)).toBe(true);
  });
});
