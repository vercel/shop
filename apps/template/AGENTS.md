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

1. **Every cart mutation MUST call `invalidateCartCache()`** (from `@/lib/cart/server`) or cache goes stale.
2. **New user-visible strings go in ALL locale files** (`en.json`, etc.) so the documented multi-locale upgrade path stays mechanical.
3. **Components in `ui/` must NOT import domain types**. Accept primitive props only and never call `useTranslations`.
4. **Always verify Shopify GraphQL fields against the live schema via `shopify-ai-toolkit` or `/vercel-shop:shopify-graphql-reference`**. Never guess Shopify field names.
5. **If a template change should be considered for existing storefronts, add a rollout entry in `packages/plugin/template-rollout-log/`**. Do not rely on the template version number alone.

<!-- BEGIN:vercel-shop-style -->

## Code Style

### Ordering & Organization

- Alphabetize named export specifiers, i18n JSON keys (within each section and at the top level), string union type members, and config object keys.
- No barrel files — never create an `index.ts` that only re-exports. Import from the source file directly.
- oxfmt handles import sorting automatically via `pnpm format`.

### Component Boundaries

- Push `"use client"` as far down the tree as possible. Pages, layouts, and data-fetching wrappers stay as server components.
- Fetch data in server components or server actions; pass promises or resolved data down to client children.

### File Organization

- Keep sub-components in the same file as their consumer when they share the same directive (or lack one). Only split into a separate file when the components need different directives (e.g., one is `"use client"` and the other is a server component) or when the file becomes unwieldy.
- A single file per logical component is preferred.
- When a split is necessary, name the file by its role: `components.tsx` for directive-free sub-components, `client-components.tsx` for `"use client"` sub-components, `server-components.tsx` for server-only sub-components.

### Naming

- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Server actions: verb + `Action` suffix (`addToCartAction`)
- Props interfaces: `{ComponentName}Props`
- Constants: `SCREAMING_SNAKE_CASE`

### Spacing

- `Container` provides horizontal padding and max-width only. It does **not** manage vertical spacing.
- For vertical rhythm between sibling sections, wrap them in `<Sections>` (`components/ui/sections.tsx`). Default `gap-10`; override per page via `className` (e.g. `<Sections className="gap-5">`). `<Sections>` happily mixes full-bleed and contained children since each child can be a `<Container>`, a banner, or anything else.
- Inside a single section, prefer `grid gap-*` on the immediate parent. Don't add `mb-*` / `mt-*` / `my-*` / `space-y-*` to children for inter-sibling spacing.
- Canonical gap scale: `gap-2.5`, `gap-4`, `gap-5`, `gap-10`. Don't invent new values for the same job.
- Padding *inside* a component (button, card, carousel breathing room via `py-*`) is fine. Negative-margin breakouts (`-mx-5`) are fine.
- This convention is partially rolled out: home and PDP follow it; other pages still use `mb-*`/`space-y-*` patterns and that's OK in this transitional state.

### Tailwind & Styling

- Prefer `data-[attr=value]` selectors over conditional class assembly.
- Use `cn()` (from `@/lib/utils`) when classes must be conditional.
- Use `data-slot` attributes as stable styling hooks on compound components.
- Use CVA (`cva`) for multi-variant component APIs.
- Interactive elements (buttons, clickable links, CTAs) must use `cursor-pointer`. Disabled interactive elements must use `cursor-not-allowed`.

### Exports

- Named exports only in component files. Pages use default exports per Next.js convention.
- Alphabetize specifiers in export statements.

<!-- END:vercel-shop-style -->

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
- Shopify Markets and multi-locale support: `/vercel-shop:enable-shopify-markets`
- Locale-prefixed routing only: `/vercel-shop:add-locale-url-prefix`
- Shopify metaobject CMS: `/vercel-shop:enable-shopify-cms`
- Navigation menus: `/vercel-shop:enable-shopify-menus`
- Analytics: `/vercel-shop:enable-analytics`

## Authentication

Customer authentication is built in using better-auth with Shopify Customer Account API OIDC. It is gated by `NEXT_PUBLIC_AUTH_ENABLED=1`. This variable must be a `NEXT_PUBLIC_` env var because it controls conditional rendering in the nav — server-only env vars cause hydration mismatches with cache components. The remaining auth secrets (`BETTER_AUTH_SECRET`, `SHOPIFY_CUSTOMER_CLIENT_ID`, `SHOPIFY_CUSTOMER_CLIENT_SECRET`) are server-only.

Key files:

- `lib/auth/auth.ts` — better-auth config with Shopify OIDC, exports `isAuthEnabled` (server-only)
- `lib/auth/server.ts` — `getCustomerSession()`, `requireSession()`, etc.
- `lib/auth/client.ts` — `useSession()`, `signIn()`, `signOut()`
- `app/api/auth/[...all]/route.ts` — OAuth callback handler
- `app/account/(authenticated)/` — auth-gated account pages
- `app/account/login/` — login redirect (outside auth gate)
- `components/layout/nav/account.tsx` — nav icon (async, inside Suspense)
- `components/account/` — sidebar, tabs, page header, sign-out button

The nav uses a fixed `size-5` container with the fallback icon rendered inline and NavAccount positioned absolutely on top via Suspense — this eliminates layout shift. All account pages use Suspense boundaries for cache components compatibility. The `(authenticated)` route group separates the auth-gated layout from the login page to avoid redirect loops.

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
