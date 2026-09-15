import { describe, expect, it } from "vitest";
import { personSchema } from "./StructuredData";
import { expectNoPii } from "@/test/pii";

describe("personSchema", () => {
  it("describes a Person with the right name", () => {
    expect(personSchema["@type"]).toBe("Person");
    expect(personSchema.name).toBe("Jed Gabriel Seno");
  });

  it("links LinkedIn via sameAs", () => {
    expect(personSchema.sameAs).toContain("https://www.linkedin.com/in/jed-gabriel-seno/");
  });

  it("gives country-level address only", () => {
    const serialized = JSON.stringify(personSchema);
    expect(serialized).toContain("Philippines");
    expectNoPii(serialized);
  });

  it("exposes no contact fields", () => {
    const serialized = JSON.stringify(personSchema);
    expectNoPii(serialized);
    expect(serialized).not.toContain("telephone");
    expect(serialized).not.toContain("email");
  });
});
