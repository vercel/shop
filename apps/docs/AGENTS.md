# Shop Docs Guide

This file provides guidance for agents working in the docs.

This app is built on the packaged Geistdocs architecture. The `@vercel/geistdocs` package owns shared runtime behavior (docs renderer, layout, MDX components, search, Ask AI, markdown/agent routes, proxy); this app owns content, configuration, thin adapters, and the marketing homepage.

## Expected Project Plugins

This project works best when the monorepo plugins are installed in project scope:

```bash
npx plugins add vercel/shop --scope project --yes
npx plugins add vercel/vercel-plugin --scope project --yes
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
```

- `vercel-shop` provides the canonical storefront skills that the docs site renders and references.
- `vercel-plugin` provides generic Vercel and Next.js skills.
- `shopify-ai-toolkit` provides Shopify-aware tooling and schema access.

## Geistdocs architecture rules

- Runtime features come from `@vercel/geistdocs`. Local files are thin adapters that call public package exports from `@vercel/geistdocs/*`.
- Do not copy package internals into the app to make a customization. Prefer configuring an adapter file or upgrading `@vercel/geistdocs`.
- Do not deep import from `@vercel/geistdocs/dist` or edit files in `node_modules/@vercel/geistdocs`.
- Do not edit generated directories such as `.source/`, `.next/`, `node_modules/`, or build output.
- When package API behavior is unclear, read the installed package docs in `node_modules/@vercel/geistdocs/docs` (start with `agents.md` and `sitemap.md`) before guessing.
- Update the package with `pnpm exec geistdocs update`; it bumps the dependency and never overwrites local adapter files.

## Common edit targets

| Task | Edit |
| --- | --- |
| Site title, logo, nav, GitHub links, AI prompt, suggestions, `siteId` | `geistdocs.tsx` |
| Add or update documentation pages | `content/docs/**/*.mdx` |
| Sidebar order, groups, and labels | `content/docs/**/meta.json` |
| Override or register MDX components | `components/geistdocs/mdx-components.tsx` |
| Provider, analytics, global client behavior | `components/geistdocs/provider.tsx` |
| Docs layout shell | `components/geistdocs/docs-layout.tsx` |
| Fumadocs source adapter | `lib/geistdocs/source.ts` |
| Fumadocs collections / frontmatter schema | `source.config.ts` |
| Docs page renderer | `app/[lang]/docs/[[...slug]]/page.tsx` |
| AI-readable markdown output | `app/[lang]/{agents.md,llms.txt,sitemap.md}/route.ts`, `app/[lang]/llms.mdx/[[...slug]]/route.ts`, `app/[lang]/.well-known/mcp.json/route.ts` |
| Chat or search APIs | `app/api/chat/route.ts`, `app/api/search/route.ts` |
| Request handling before/after Geistdocs routing | `proxy.ts` (keep `export const config` static; exclude only `api(?:/|$)`) |
| Marketing homepage | `app/[lang]/(home)/**` |
| Shared styles | `app/global.css`, `app/styles/geistdocs.css` |
| Homepage-only styles (scoped to `.shop-home`) | `app/styles/home.css` |

## Shop-specific conventions

- **Skill sync**: the `skills/enable-*.mdx` pages embed `packages/plugin/skills/<name>/SKILL.md` between `{/* BEGIN SKILL CONTENT */}` / `{/* END SKILL CONTENT */}` markers. Never hand-edit between the markers; run `npx tsx scripts/sync-skills.ts` instead. The script escapes MDX-unsafe characters (`{`, `}`, bare `<`) in skill prose.
- **Key files lint**: `## Key files` sections in docs list backtick paths that must resolve against `apps/template/` or the repo root. Validated by `npx tsx scripts/lint-doc-paths.ts` (part of `pnpm lint`).
- **Custom MDX components**: `HomeBrowser`, `PDPBrowser`, `PLPBrowser`, `CartBrowser`, `ContentBrowser` (from `components/fake-browser/`) plus `Card`/`Cards` are registered in `components/geistdocs/mdx-components.tsx`.
- **Homepage styling**: the homepage and its components use shadcn-style tokens defined in `app/styles/home.css`, scoped to the `.shop-home` wrapper set in `app/[lang]/(home)/layout.tsx`. Do not use those tokens outside the homepage; docs UI uses Geist tokens from `app/styles/geistdocs.css`.
- **Local UI primitives** in `components/ui/` (badge, button, command-prompt, input, input-group, tabs, textarea) exist only for the homepage. Docs UI components come from `@vercel/geistdocs/components/*`.
- `components/skill-content.tsx` renders a `SKILL.md` from `packages/plugin/skills` at runtime (server component); keep it working if you move skill files.

## Content guidelines

- Use MDX frontmatter with at least `title` and `description`; the schema (from `@vercel/geistdocs/source-config`) also supports `type`, `prerequisites`, `related`, `summary`, `tags`, and `excludeFrom`.
- Add each new page to the relevant `meta.json` so it appears in the sidebar.
- Plain markdown copied into MDX must have `{`, `}`, and bare `<` escaped outside code blocks.
- Keep slugs stable unless the task explicitly includes redirects or link updates.

## Commands

- Dev: `pnpm dev` · Build: `pnpm build` · Start: `pnpm start`
- Lint (oxlint + oxfmt + doc paths): `pnpm lint` · Format: `pnpm format` · Types: `pnpm typecheck`
- Sync skills into docs: `npx tsx scripts/sync-skills.ts`
- Update Geistdocs: `pnpm exec geistdocs update`

## Verification

- Run `pnpm build` after changing routes, config, source setup, MDX components, or package versions.
- Check `/docs` and AI-readable routes (`/agents.md`, `/llms.txt`, `/sitemap.md`, a page-level `.md` URL) when changing content routing or proxy behavior. `/.well-known/mcp.json` 404s by design until `agent.mcp.servers` is configured.
- Confirm no secrets were added to source files. Use `.env.local` for local values and keep it out of Git.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
