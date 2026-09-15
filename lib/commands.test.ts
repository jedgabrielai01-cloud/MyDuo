import { describe, expect, it } from "vitest";
import { COMMAND_NAMES, completeCommand, runCommand } from "./commands";
import { expectNoPii } from "@/test/pii";

describe("runCommand", () => {
  it("returns text for a known command", () => {
    const r = runCommand("experience");
    expect(r.kind).toBe("text");
    if (r.kind === "text") expect(r.lines.join("\n")).toContain("DXC AI Champion");
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(runCommand("  SKILLS  ").kind).toBe("text");
  });

  it("resolves aliases", () => {
    const direct = runCommand("experience");
    const alias = runCommand("exp");
    expect(alias).toEqual(direct);
  });

  it("returns an action for resume", () => {
    const r = runCommand("resume");
    expect(r.kind).toBe("action");
    if (r.kind === "action") expect(r.action).toBe("download-resume");
  });

  it("returns an action for linkedin", () => {
    const r = runCommand("linkedin");
    if (r.kind === "action") expect(r.action).toBe("open-linkedin");
  });

  it("returns an action for clear", () => {
    const r = runCommand("clear");
    if (r.kind === "action") expect(r.action).toBe("clear");
  });

  it("lists every command in help", () => {
    const r = runCommand("help");
    const text = r.kind === "text" ? r.lines.join(" ") : "";
    for (const name of COMMAND_NAMES) expect(text).toContain(name);
  });

  it("routes unknown input to the AI", () => {
    const r = runCommand("why should we hire you?");
    expect(r.kind).toBe("ai");
    if (r.kind === "ai") expect(r.question).toBe("why should we hire you?");
  });

  it("routes a multi-word phrase starting with a command word to the AI", () => {
    const r = runCommand("experience at DXC in detail");
    expect(r.kind).toBe("ai");
  });

  it("never emits an email or phone number", () => {
    for (const name of COMMAND_NAMES) {
      const r = runCommand(name);
      const text = r.kind === "ai" ? "" : r.lines.join("\n");
      expectNoPii(text);
    }
  });
});

describe("completeCommand", () => {
  it("completes a prefix", () => {
    expect(completeCommand("ex")).toContain("experience");
  });

  it("returns every command for an empty prefix", () => {
    expect(completeCommand("")).toEqual([...COMMAND_NAMES]);
  });

  it("returns nothing for an unmatched prefix", () => {
    expect(completeCommand("zzz")).toEqual([]);
  });
});
