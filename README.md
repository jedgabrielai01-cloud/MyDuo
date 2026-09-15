# Jed Gabriel Seno — Terminal Portfolio

Résumé site with a terminal interface and an AI assistant that answers questions
about Jed's career, grounded in the content under `content/`.

## Develop

```bash
npm install
cp .env.example .env.local   # add an OpenRouter inference key
npm run dev
```

The key must come from <https://openrouter.ai/keys>. A provisioning key from
`/settings/provisioning-keys` fails with `401 User not found`.

## Commands

- `npm run dev` — dev server
- `npm test` — unit tests
- `npm run build` — production build
- `npm run build:pdf` — regenerate the résumé PDF from `content/profile.ts`
  (uses the locally installed Chrome, so no browser download is needed)

## Editing content

All résumé data lives in `content/profile.ts`. The AI's extra context lives in
`content/narrative.ts`, `content/qa.ts`, and `content/linkedin.ts`. Editing those
updates the page, the terminal commands, the AI, and the PDF together.

The site never publishes a phone number, email address, or street address —
enforced by tests. See `CLAUDE.md`.

## Deploy

Vercel. Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`,
`OPENROUTER_FALLBACK_MODELS`, and `NEXT_PUBLIC_SITE_URL` as production
environment variables.
