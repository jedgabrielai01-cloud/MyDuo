import { describe, expect, it } from "vitest";
import { resumeHtml } from "./build-resume-pdf.mts";
import { profile } from "@/content/profile";
import { expectNoPii } from "@/test/pii";

const html = resumeHtml(profile);

describe("resumeHtml", () => {
  it("carries no email, phone, or sub-country location", () => {
    expectNoPii(html);
  });

  it("shows the exact approved contact line", () => {
    expect(html).toContain("Philippines · linkedin.com/in/jed-gabriel-seno");
  });

  it("includes every role and the education entry", () => {
    for (const role of profile.roles) expect(html).toContain(role.title);
    expect(html).toContain(profile.education.school);
  });

  it("uses a conventional serif layout, not the terminal theme", () => {
    expect(html).not.toContain("#050705");
    expect(html).not.toContain("#3BF07A");
  });
});
