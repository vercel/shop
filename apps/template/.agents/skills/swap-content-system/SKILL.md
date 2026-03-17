---
name: swap-content-system
description: Replace the shop template's default local homepage/page content with Shopify metaobjects, Contentful, Sanity, or another CMS. Use when changing where homepage or marketing-page content comes from.
---

# Swap Content System

The shop template now ships with local content helpers instead of a CMS-backed default. Use this skill when replacing that local content source with Shopify metaobjects or another CMS.

## Default content entrypoints

- `lib/content/homepage.ts` builds the homepage
- `lib/content/pages.ts` resolves `/pages/[slug]`
- `app/page.tsx`, `app/pages/[slug]/page.tsx`, and `app/sitemap.ts` are the only route-level consumers

## Goal

Keep the rendering contract unchanged. Whatever replaces the local content must still return the domain types from `lib/types.ts`:

- `Homepage`
- `MarketingPage`
- `HeroSection`
- `ContentSection`

Do not introduce CMS-specific response types into components.

## Recommended workflow

1. Read `lib/content/homepage.ts` and `lib/content/pages.ts` to understand the current local default.
2. Decide whether to:
   - replace those helper implementations directly, or
   - create CMS-specific operations and point the route imports at them.
3. Return the existing domain types from `lib/types.ts`.
4. Resolve product references to ready-to-render product card data before rendering.
5. Update `app/sitemap.ts` if page discovery changes.

## Guardrails

- Keep the template working without a CMS unless the user explicitly wants the default replaced.
- Keep locale behavior graceful; missing locale variants should not crash rendering.
- Keep user-visible copy in locale files unless the new CMS owns that copy end to end.
- Avoid adding a provider abstraction unless the repo actually needs multiple runtime content sources.
