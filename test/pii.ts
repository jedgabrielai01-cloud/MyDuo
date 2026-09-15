import { expect } from "vitest";

/**
 * Shared PII patterns for the privacy assertions. Defined once so the site's
 * strongest guarantee cannot drift between test files.
 *
 * PHONE deliberately allows spaces, parens, and hyphens between digits but NOT
 * newlines: a real number never spans a line break, and allowing \s produced a
 * false positive on a cert year followed by an indented URL ("(2023)\n    ").
 */
export const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/;
export const PHONE = /\+?\d[\d ()-]{8,}/;

/** Substrings that would narrow his location below "Philippines". */
export const PRIVATE_PLACES = ["bacoor", "cavite"];

/** Asserts a string carries no email address, phone number, or sub-country location. */
export function expectNoPii(text: string): void {
  expect(text).not.toMatch(EMAIL);
  expect(text).not.toMatch(PHONE);
  for (const place of PRIVATE_PLACES) {
    expect(text.toLowerCase()).not.toContain(place);
  }
}
