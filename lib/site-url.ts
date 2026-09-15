/**
 * Resolves the site's public base URL, without a trailing slash.
 *
 * Order: an explicit SITE_URL, then the domain Vercel supplies. Vercel
 * documents VERCEL_PROJECT_PRODUCTION_URL as always set — including on preview
 * deployments — for exactly this purpose, generating absolute links such as
 * OG-image URLs, and it tracks a custom domain automatically. It carries no
 * scheme, so https:// is prepended.
 *
 * Server-only on purpose: nothing in the browser needs this, so it takes no
 * NEXT_PUBLIC_ prefix.
 */
export function resolveSiteUrl(): string {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}
