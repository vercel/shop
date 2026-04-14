# Shop Template Guide

This file provides guidance for agents working in the template.

## Expected Project Plugins

This project expects these project-scoped plugins to be installed:

```bash
npx plugins add vercel/shop --scope project --yes
npx plugins add vercel/vercel-plugin --scope project --yes
npx plugins add Shopify/shopify-ai-toolkit --scope project --yes
```

- `vercel-shop` provides storefront-specific skills and commands such as `/vercel-shop:enable-shopify-markets`.
- `vercel-plugin` provides generic Vercel and Next.js skills.
- `shopify-ai-toolkit` provides Shopify-aware tooling and schema access.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Critical Rules (Always Apply)

1. **Every cart mutation MUST call `invalidateCartCache()`** (from `@/lib/cart-cache`) or cache goes stale.
2. **New user-visible strings go in ALL locale files** (`en.json`, etc.) so the documented multi-locale upgrade path stays mechanical.
3. **Components in `ui/` must NOT import domain types**. Accept primitive props only and never call `useTranslations`.
4. **Always verify Shopify GraphQL fields against the live schema via `shopify-ai-toolkit` or `/vercel-shop:shopify-graphql-reference`**. Never guess Shopify field names.
5. **If a template change should be considered for existing storefronts, add a rollout entry in `packages/plugin/template-rollout-log/`**. Do not rely on the template version number alone.

## Overview

This is a Next.js 16 storefront template integrated with Shopify. It uses the App Router, React 19, Server Components, Tailwind CSS 4, and pnpm.

The default deployment story is single-locale with clean, unprefixed URLs (`/products/...`). The repo keeps locale catalogs and helpers in place so adding multi-locale routing later is straightforward, but that routing is not enabled by default.

## Development Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
```

## Directory Structure

- `app/` for routes
- `lib/shopify/` for Shopify operations, fragments, transforms, and types
- `lib/types.ts` for provider-agnostic domain types
- `components/ui/` for presentational primitives
- `components/product/` for domain-aware product wrappers
- `next.config.ts` rewrites for variant URL resolution

## Data Flow

```text
Request → Page → Operation → shopifyFetch → Shopify API → Transform → Domain type → Component
```

## Storefront Skills

Storefront skills are provided by the project-scoped `vercel-shop` plugin rather than local repo files.

Common entry points:

- Shopify GraphQL work: `/vercel-shop:shopify-graphql-reference`
- Customer auth and account pages: `/vercel-shop:enable-shopify-auth`
- Shopify Markets and multi-locale support: `/vercel-shop:enable-shopify-markets`
- Locale-prefixed routing only: `/vercel-shop:add-locale-url-prefix`
- Shopify metaobject CMS: `/vercel-shop:enable-shopify-cms`
- Navigation menus: `/vercel-shop:enable-shopify-menus`
- Analytics: `/vercel-shop:enable-analytics`

## Template Rollout Log

The `vercel-shop` plugin includes a template rollout log in `packages/plugin/template-rollout-log/` for downstream adoption work.

- Add one append-only markdown entry for each template change that downstream storefronts may want to review or adopt.
- Keep entries change-scoped. Do not batch unrelated work into one log item.
- Include what changed, why it matters, when it applies, safe skip cases, and validation steps.
- Prefer `changeKey`, `introducedOn`, and any bootstrap `scaffoldedAt` metadata over version math when reasoning about rollout order.
- Treat the log as the source of truth for rollout planning. The template version is only a hint.

## Shopify GraphQL Workflow

- Use the installed `Shopify/shopify-ai-toolkit` plugin to inspect the live Storefront or Customer Account schema before changing fields.
- Use `/vercel-shop:shopify-graphql-reference` for template-specific GraphQL conventions: fragments, locale context, caching, transforms, and operation placement.
- Do not add repo-local schema snapshots or agent-specific folders to the template.

## Key Patterns

- Routes live under `app/` and use clean URLs like `/products/handle`.
- `getLocale()` resolves the active deployment locale; the template defaults to `en-US`.
- Multi-locale URL routing is documented in `/vercel-shop:add-locale-url-prefix` and is intentionally not enabled by default.
- Components import domain types from `@/lib/types`, not Shopify response types.
- Prefer Tailwind data-attribute selectors over conditional class assembly.
- Follow the `ui/` → `product/` wrapper pattern when adding reusable product UI.

## Configuration

- `next.config.ts`: `cacheComponents: true`, `reactCompiler: true`
- `.oxlintrc.json`: oxlint linting configuration
- `.oxfmtrc.json`: oxfmt formatting configuration
- `components.json`: shadcn/ui configuration

Environment variables are documented in `.env.example`.
