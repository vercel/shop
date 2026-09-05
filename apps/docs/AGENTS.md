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
- `shopify-ai-toolkit` is authoritative for current Shopify documentation, API schemas, operation validation, and store execution.

## Geistdocs architecture rules

- Runtime features come from `@vercel/geistdocs`. Local files are thin adapters that call public package exports from `@vercel/geistdocs/*`.
- Do not copy package internals into the app to make a customization. Prefer configuring an adapter file or upgrading `@vercel/geistdocs`.
- Do not deep import from `@vercel/geistdocs/dist` or edit files in `node_modules/@vercel/geistdocs`.
- Do not edit generated directories such as `.source/`, `.next/`, `node_modules/`, or build output.
- When package API behavior is unclear, read the installed package docs in `node_modules/@vercel/geistdocs/docs` (start with `agents.md` and `sitemap.md`) before guessing.
- Update the package with `pnpm exec geistdocs update`; it bumps the dependency and never overwrites local adapter files.
- Keep `createGeistdocs` from `@vercel/geistdocs/next` as the `next.config.ts` wrapper. It composes Fumadocs MDX and generates the App Router manifest used for agent-readable 404 recovery.
- Keep `cacheComponents: true` and `partialPrefetching: true`. Do not export `dynamic`, `revalidate`, or `fetchCache` from App Router pages or route handlers.
- Read `[lang]` through `next/root-params` in Server Components. Keep route context `params` in Route Handlers and Server Actions.
- Use `prefetch={true}` for app-owned links to statically generated docs pages, and restart `next dev` after adding, deleting, or renaming routes.
- Keep production URL construction in `lib/geistdocs/site-url.ts`. Canonicals, Open Graph, JSON-LD, sitemap, robots, and RSS must share that production origin.
- Keep smart recovery enabled for missing mapped Markdown pages and automatic unmatched agent paths unless the app needs explicit custom ownership.

## Common edit targets

| Task                                                                  | Edit                                                                                                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Site title, logo, nav, GitHub links, AI prompt, suggestions, `siteId` | `geistdocs.tsx`                                                                                                                               |
| Add or update documentation pages                                     | `content/docs/**/*.mdx`                                                                                                                       |
| Sidebar order, groups, and labels                                     | `content/docs/**/meta.json`                                                                                                                   |
| Override or register MDX components                                   | `components/geistdocs/mdx-components.tsx`                                                                                                     |
| Provider, analytics, global client behavior                           | `components/geistdocs/provider.tsx`                                                                                                           |
| Docs layout shell                                                     | `components/geistdocs/docs-layout.tsx`                                                                                                        |
| Fumadocs source adapter                                               | `lib/geistdocs/source.ts`                                                                                                                     |
| Fumadocs collections / frontmatter schema                             | `source.config.ts`                                                                                                                            |
| Docs page renderer                                                    | `app/[lang]/docs/[[...slug]]/page.tsx`                                                                                                        |
| AI-readable markdown output                                           | `app/[lang]/{agents.md,llms.txt,sitemap.md}/route.ts`, `app/[lang]/llms.mdx/[[...slug]]/route.ts`, `app/[lang]/.well-known/mcp.json/route.ts` |
| Chat or search APIs                                                   | `app/api/chat/route.ts`, `app/api/search/route.ts`                                                                                            |
| Request handling before/after Geistdocs routing                       | `proxy.ts` (keep `export const config` static; exclude only `api(?:/\|$)`)                                                                    |
| Marketing homepage                                                    | `app/[lang]/(home)/**`                                                                                                                        |
| Shared styles                                                         | `app/global.css`, `app/styles/geistdocs.css`                                                                                                  |
| Homepage-only styles (scoped to `.shop-home`)                         | `app/styles/home.css`                                                                                                                         |

## Shop-specific conventions

- **Skill sync**: the `skills/enable-*.mdx` pages embed `packages/plugin/skills/<name>/SKILL.md` between `{/* BEGIN SKILL CONTENT */}` / `{/* END SKILL CONTENT */}` markers. Never hand-edit between the markers; run `npx tsx scripts/sync-skills.ts` instead. The script escapes MDX-unsafe characters (`{`, `}`, bare `<`) in skill prose.
- **Custom MDX components**: `HomeBrowser`, `PDPBrowser`, `PLPBrowser`, `CartBrowser`, `ContentBrowser` (from `components/fake-browser/`) plus `Card`/`Cards` are registered in `components/geistdocs/mdx-components.tsx`.
- **Homepage styling**: the homepage and its components use shadcn-style tokens defined in `app/styles/home.css`, scoped to the `.shop-home` wrapper set in `app/[lang]/(home)/layout.tsx`. Do not use those tokens outside the homepage; docs UI uses Geist tokens from `app/styles/geistdocs.css`.
- **Local UI primitives** in `components/ui/` (badge, button, command-prompt, input, input-group, tabs, textarea) exist only for the homepage. Docs UI components come from `@vercel/geistdocs/components/*`.
- `components/skill-content.tsx` renders a `SKILL.md` from `packages/plugin/skills` at runtime (server component); keep it working if you move skill files.

## Content guidelines

- Use MDX frontmatter with at least `title` and `description`; the schema (from `@vercel/geistdocs/source-config`) also supports `type`, `prerequisites`, `related`, `summary`, `tags`, and `excludeFrom`.
- Add each new page to the relevant `meta.json` so it appears in the sidebar.
- Plain markdown copied into MDX must have `{`, `}`, and bare `<` escaped outside code blocks.
- Give each page one audience and one purpose. Lead with the outcome, then state the default, required action, and important limits.
- **Document the product, not the pull request.** Reader-facing pages must describe current behavior and required actions, not the work that introduced them. Do not include PR numbers, review notes, rollout narratives, refactor justifications, or incidental before/after comparisons (such as “now uses” or “no longer”). Keep change history in PR descriptions or changelogs; include migration advice only when readers must act.
- **Require a reader need for technical detail.** Keep a detail only when it helps the reader complete a task, make a decision, avoid a security or data problem, understand a real limitation, or confirm the result. Otherwise remove it or replace it with the observable behavior. Accurate implementation trivia is still unnecessary content; do not append it just because it was part of the code change.
- **Verify factual claims before publishing.** Check defaults, settings, routes, limits, and feature availability against the current implementation and its real callers, not an old guide, a PR description, or a helper's existence. Distinguish built-in behavior from opt-in features and suggested extensions. Correct or remove contradicted claims; narrow or omit unverified claims rather than guessing.
- **Review the whole touched page.** Before finishing a docs change, remove PR-centric prose and unnecessary technical specificity, check neighboring claims for stale or contradictory behavior, and preserve essential setup and security instructions. Lint and build success do not establish factual accuracy.
- Prefer observable behavior and merchant or shopper language. Treat function names, component names, internal fields, file paths, request choreography, and cache mechanics as warning signs in reader-facing guides.
- Use short sentences, active voice, consistent terms, one instruction per step, and one main idea per paragraph. Define uncommon abbreviations before using them.
- Exact commands, settings, environment variables, Admin paths, callback URLs, permissions, and security requirements are appropriate when the reader must act on them.
- Generated skill pages are procedural instructions for coding agents and may remain technical. Never hand-edit their embedded skill content.
- Do not put material in a reader-facing guide solely for a coding agent. Put repository instructions in `AGENTS.md` and reusable agent procedures in a skill.
- Do not add `Key files`, file inventory, or file-to-purpose table sections. Mention a path inline only when it directly supports a required action.
- Do not add a routine closing `Verify`, `Test`, or `Validation` section to reader-facing docs. In a procedural guide, place an essential confirmation immediately after the action it validates and describe the observable result. Agent-facing skills may keep explicit verification checklists.
- End feature guides with a concise `What’s next` section. Suggest common ways teams extend or adapt the feature, explain what each change enables, and mention important tradeoffs. Keep the suggestions user-facing rather than turning them into implementation inventories.
- Do not force `What’s next` onto reference pages, index pages, or setup flows that already end with a natural next action or navigation cards. Avoid repeating ideas already covered in the body.
- Keep slugs stable unless the task explicitly includes redirects or link updates.

## Commands

- Dev: `pnpm dev` · Build: `pnpm build` · Start: `pnpm start`
- Lint (oxlint + oxfmt): `pnpm lint` · Format: `pnpm format` · Types: `pnpm typecheck`
- Sync skills into docs: `npx tsx scripts/sync-skills.ts`
- Update Geistdocs: `pnpm exec geistdocs update`

## Verification

- Run `pnpm build` after changing routes, config, source setup, MDX components, or package versions.
- Check `/docs` and AI-readable routes (`/agents.md`, `/llms.txt`, `/sitemap.md`, a page-level `.md` URL) when changing content routing or proxy behavior. `/.well-known/mcp.json` 404s by design until `agent.mcp.servers` is configured.
- Confirm no secrets were added to source files. Use `.env.local` for local values and keep it out of Git.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
