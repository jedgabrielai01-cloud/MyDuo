import { profile } from "@/content/profile";

export type CommandResult =
  | { kind: "text"; lines: string[] }
  | { kind: "action"; action: "clear" | "download-resume" | "open-linkedin"; lines: string[] }
  | { kind: "ai"; question: string };

const ALIASES: Record<string, string> = {
  exp: "experience",
  who: "whoami",
  about: "whoami",
  cv: "resume",
  "?": "help",
  certs: "certifications",
  edu: "education",
  li: "linkedin",
};

function whoami(): string[] {
  return [
    profile.name,
    profile.roleLine,
    `${profile.years} years · ${profile.location}`,
    "",
    profile.headline,
  ];
}

function experience(): string[] {
  const out: string[] = [];
  for (const role of profile.roles) {
    out.push(`${role.period}`);
    out.push(`  ${role.title}`);
    out.push(`  ${role.org}${role.concurrent ? "  [concurrent]" : ""}`);
    for (const b of role.bullets) out.push(`    · ${b}`);
    out.push("");
  }
  return out;
}

function skills(): string[] {
  return profile.skills.flatMap((g) => [`${g.label}:`, `  ${g.items.join(" · ")}`, ""]);
}

function certifications(): string[] {
  return profile.certs.map(
    (c) => `· ${c.name}${c.year ? ` (${c.year})` : ""}${c.url ? `\n    ${c.url}` : ""}`,
  );
}

function education(): string[] {
  const e = profile.education;
  return [e.degree, e.school, e.period];
}

function ai(): string[] {
  const groups = profile.skills.filter((g) => g.ai);
  return [
    "AI work at DXC (AI Champion, March 2026 — present):",
    "",
    ...profile.roles[0].bullets.map((b) => `· ${b}`),
    "",
    "Tooling:",
    ...groups.map((g) => `  ${g.label}: ${g.items.join(" · ")}`),
  ];
}

const TEXT_COMMANDS: Record<string, () => string[]> = {
  whoami,
  experience,
  skills,
  certifications,
  education,
  ai,
};

function help(): string[] {
  return [
    "Available commands:",
    "",
    "  whoami          who Jed is, in brief",
    "  experience      full role history",
    "  skills          technical and management skills",
    "  ai              AI engineering work in detail",
    "  certifications  certifications with credential links",
    "  education       degree and university",
    "  resume          download the résumé PDF",
    "  linkedin        open his LinkedIn profile",
    "  clear           clear this output",
    "  help            this list",
    "",
    "Or just ask a question in plain English — that goes to the AI.",
  ];
}

export const COMMAND_NAMES = [
  "whoami",
  "experience",
  "skills",
  "ai",
  "certifications",
  "education",
  "resume",
  "linkedin",
  "clear",
  "help",
] as const;

/** Parses input and returns either local output, a UI action, or an AI question. */
export function runCommand(input: string): CommandResult {
  const raw = input.trim();
  const key = raw.toLowerCase();
  const name = ALIASES[key] ?? key;

  if (name === "help") return { kind: "text", lines: help() };
  if (name === "clear") return { kind: "action", action: "clear", lines: [] };
  if (name === "resume") {
    return { kind: "action", action: "download-resume", lines: ["Downloading résumé PDF…"] };
  }
  if (name === "linkedin") {
    return { kind: "action", action: "open-linkedin", lines: [`Opening ${profile.linkedin}`] };
  }

  const handler = TEXT_COMMANDS[name];
  if (handler) return { kind: "text", lines: handler() };

  return { kind: "ai", question: raw };
}

/** Returns command names matching a prefix, for tab-completion. */
export function completeCommand(prefix: string): string[] {
  const p = prefix.trim().toLowerCase();
  return COMMAND_NAMES.filter((n) => n.startsWith(p));
}
