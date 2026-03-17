---
name: swap-content-system
description: Replace the shop template's default hardcoded homepage with a CMS-driven content system (Shopify metaobjects, Contentful, Sanity, or another CMS). Use when changing where homepage or marketing-page content comes from.
---

# Swap Content System

The shop template ships with a hardcoded homepage and an empty marketing-page registry. Use this skill when replacing the default content with a CMS.

## Default content entrypoints

- `app/page.tsx` renders the homepage directly with hardcoded structure and Shopify product fetches
- `lib/content/pages.ts` resolves `/pages/[slug]` (empty registry by default)
- `app/pages/[slug]/page.tsx` and `app/sitemap.ts` consume marketing pages

## Goal

Implement content operations that return the domain types from `lib/types.ts`:

- `Homepage`
- `MarketingPage`
- `HeroSection`
- `ContentSection`

The `MarketingPageRenderer` in `components/cms/page-renderer.tsx` already handles rendering these types. Wire your CMS operations to return these types and the renderer will work unchanged.

## Recommended workflow

1. Create CMS-specific operations that return `Homepage` and `MarketingPage`.
2. Update `app/page.tsx` to call your CMS operation instead of rendering hardcoded content.
3. Use `MarketingPageRenderer` to render the returned page data.
4. Resolve product references to ready-to-render `ProductCard[]` data before rendering.
5. Update `app/sitemap.ts` if page discovery changes.

## Guardrails

- Keep the template working without a CMS unless the user explicitly wants the default replaced.
- Keep locale behavior graceful; missing locale variants should not crash rendering.
- Keep user-visible copy in locale files unless the new CMS owns that copy end to end.
- Avoid adding a provider abstraction unless the repo actually needs multiple runtime content sources.
