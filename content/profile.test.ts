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
