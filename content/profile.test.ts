import { describe, expect, it } from "vitest";
import { profile } from "./profile";

const serialized = JSON.stringify(profile);

describe("profile data", () => {
  it("contains no email address", () => {
    expect(serialized).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  it("contains no phone number", () => {
    expect(serialized).not.toMatch(/\+?\d[\d\s()-]{8,}/);
  });

  it("does not mention the home city", () => {
    expect(serialized.toLowerCase()).not.toContain("bacoor");
    expect(serialized.toLowerCase()).not.toContain("cavite");
  });

  it("reports location as Philippines only", () => {
    expect(profile.location).toBe("Philippines");
  });

  it("has four roles, newest first", () => {
    expect(profile.roles).toHaveLength(4);
    expect(profile.roles[0].title).toBe("DXC AI Champion");
  });

  it("links to the correct LinkedIn profile", () => {
    expect(profile.linkedin).toBe("https://www.linkedin.com/in/jed-gabriel-seno/");
  });

  it("marks AI skill groups so the UI can accent them", () => {
    expect(profile.skills.some((g) => g.ai)).toBe(true);
  });
});
