<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Shop Template Guide

This file provides guidance for agents working in the Shopify storefront template.

## Critical Rules (Always Apply)

1. **Every cart mutation MUST call `updateTag(TAGS.cart)` AND `updateTag("cart-status")`** or cache goes stale.
2. **New user-visible strings go in ALL locale files** (`en.json`, `de-DE.json`, `fr-FR.json`, `nl-NL.json`, `es-ES.json`) so the documented multi-locale upgrade path stays mechanical.
3. **Components in `ui/` must NOT import domain types**. Accept primitive props only and never call `useTranslations`.
4. **Always reference `.claude/schemas/` when writing GraphQL**. Never guess Shopify field names.

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
- `proxy.ts` for content negotiation and request rewrites

## Data Flow

```text
Request → proxy.ts → Page → Operation → shopifyFetch → Shopify API → Transform → Domain type → Component
```

## Recipes

For deeper guidance, start with [`.claude/recipes/README.md`](.claude/recipes/README.md).

## Skill Layout

- Canonical storefront skills live in `.agents/skills/`.
- `apps/shop/.claude/skills` is a compatibility symlink to that directory.

Common entry points:

- Cart changes: `recipes/cart/optimistic-cart.md`, `recipes/cart/cart-actions.md`
- New pages: `recipes/guides/add-new-page.md`
- Product fields: `recipes/guides/add-new-product-field.md`
- UI primitives: `recipes/guides/add-ui-component.md`
- Shopify GraphQL work: `recipes/shopify/graphql-operations.md`
- Translations: `recipes/i18n/translations.md`
- Locale configuration: `recipes/architecture/locale-routing.md`
- Cache behavior: `recipes/architecture/caching-strategy.md`

## Key Patterns

- Routes live under `app/` and use clean URLs like `/products/handle`.
- `getLocale()` resolves the active deployment locale; the template defaults to `en-US`.
- Multi-locale URL routing is documented in `.agents/skills/add-locale-url-prefix/SKILL.md` and is intentionally not enabled by default.
- Components import domain types from `@/lib/types`, not Shopify response types.
- Prefer Tailwind data-attribute selectors over conditional class assembly.
- Follow the `ui/` → `product/` wrapper pattern when adding reusable product UI.

## Shopify Schemas

Reference these local schema snapshots when writing or reviewing GraphQL:

- `.claude/schemas/shopify-storefront.graphql`
- `.claude/schemas/shopify-customer.graphql`

Refresh them with:

```bash
pnpm run .claude/scripts/fetch-shopify-schemas.ts
```

## Configuration

- `next.config.ts`: `cacheComponents: true`, `reactCompiler: true`
- `biome.json`: Biome linting/formatting
- `components.json`: shadcn/ui configuration

Environment variables are documented in `.env.example`.
