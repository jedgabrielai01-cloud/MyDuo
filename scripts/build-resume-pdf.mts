import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { profile, type Profile } from "../content/profile.ts";

const CONTACT_LINE = "Philippines · linkedin.com/in/jed-gabriel-seno";

/** Renders an ATS-friendly résumé as HTML. Deliberately conventional, not terminal-themed. */
export function resumeHtml(p: Profile): string {
  const roles = p.roles
    .map(
      (r) => `
    <article class="role">
      <div class="role-head">
        <h3>${r.title}</h3>
        <span class="period">${r.period}</span>
      </div>
      <p class="org">${r.org}</p>
      <ul>${r.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
    </article>`,
    )
    .join("");

  const skills = p.skills
    .map((g) => `<p><strong>${g.label}:</strong> ${g.items.join(", ")}</p>`)
    .join("");

  const certs = p.certs.map((c) => `<li>${c.name}${c.year ? ` (${c.year})` : ""}</li>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${p.name} — Résumé</title>
<style>
  @page { size: A4; margin: 8mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; font-size: 9.1pt; line-height: 1.22; margin: 0; }
  h1 { font-size: 20pt; margin: 0; letter-spacing: 0.4px; }
  .role-line { font-size: 10.5pt; color: #444; margin: 3px 0 2px; text-transform: uppercase; letter-spacing: 1.1px; }
  .contact { font-size: 9.4pt; color: #555; margin: 0 0 9px; }
  h2 { font-size: 9.2pt; text-transform: uppercase; letter-spacing: 1.4px; color: #000; border-bottom: 1px solid #999; padding-bottom: 2px; margin: 7px 0 4px; }
  h3 { font-size: 11pt; margin: 0; }
  .summary { margin: 0 0 4px; }
  .role { margin-bottom: 5px; }
  .role-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .period { font-size: 9pt; color: #555; white-space: nowrap; }
  .org { font-size: 9.6pt; color: #444; font-style: italic; margin: 1px 0 4px; }
  ul { margin: 0; padding-left: 16px; }
  li { margin-bottom: 1px; }
  p { margin: 0 0 4px; }
</style></head>
<body>
  <h1>${p.name}</h1>
  <p class="role-line">${p.roleLine}</p>
  <p class="contact">${CONTACT_LINE}</p>

  <h2>Summary</h2>
  <p class="summary">${p.headline}</p>

  <h2>Experience</h2>
  ${roles}

  <h2>Skills</h2>
  ${skills}

  <h2>Certifications</h2>
  <ul>${certs}</ul>

  <h2>Education</h2>
  <p><strong>${p.education.degree}</strong> — ${p.education.school}, ${p.education.period}</p>
</body></html>`;
}

/**
 * Writes the résumé PDF and returns its path.
 * Uses the locally installed Chrome: this runs only on a developer machine,
 * never on Vercel, so there is no reason to ship a bundled browser.
 */
export async function buildResumePdf(
  outPath = path.join(process.cwd(), "public", "jed-gabriel-seno-resume.pdf"),
): Promise<string> {
  const { chromium } = await import("playwright");
  await mkdir(path.dirname(outPath), { recursive: true });

  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.setContent(resumeHtml(profile), { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await writeFile(outPath, pdf);
    return outPath;
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith("build-resume-pdf.mts")) {
  buildResumePdf().then((p) => console.log(`Wrote ${p}`));
}
