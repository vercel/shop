# Vercel Shop Docs

Documentation site for [Vercel Shop](https://github.com/vercel/shop), built with [Geistdocs](https://www.npmjs.com/package/@vercel/geistdocs) (`@vercel/geistdocs`), Next.js, and Fumadocs.

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Structure

- `content/docs/` — MDX documentation pages; `meta.json` files control sidebar order.
- `geistdocs.tsx` — site configuration (title, logo, nav, GitHub links, Ask AI prompt).
- `app/` — thin route adapters around `@vercel/geistdocs` helpers, plus the marketing homepage in `app/[lang]/(home)/`.
- `components/geistdocs/` — provider, docs layout, and MDX component registration.
- `components/fake-browser/`, `components/storefront-hero/` — custom components used in docs content and on the homepage.
- `scripts/sync-skills.ts` — syncs `packages/plugin/skills/*/SKILL.md` into the skills docs pages.
- `scripts/lint-doc-paths.ts` — validates `## Key files` paths against the template app.

## AI-readable surfaces

The site serves markdown to agents via `/llms.txt`, `/agents.md`, `/sitemap.md`, per-page `.md`/`.mdx` URLs, `Accept: text/markdown` negotiation, and AI user-agent detection.

## Commands

| Command                          | Description                                  |
| -------------------------------- | -------------------------------------------- |
| `pnpm dev`                       | Start the dev server                         |
| `pnpm build`                     | Production build                             |
| `pnpm lint`                      | oxlint, oxfmt check, and doc path validation |
| `pnpm typecheck`                 | TypeScript                                   |
| `npx tsx scripts/sync-skills.ts` | Sync skill content into docs                 |
| `pnpm exec geistdocs update`     | Update `@vercel/geistdocs`                   |

See `AGENTS.md` for agent editing conventions.
