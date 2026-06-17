---
title: Move hardcoded domain/page strings into the i18n catalog
changeKey: i18n-extract-domain-strings
introducedOn: 2026-06-17
changeType: fix
defaultAction: adopt
appliesTo:
  - all
paths:
  - apps/template/lib/i18n/messages/en.json
  - apps/template/app/page.tsx
  - apps/template/components/product-detail/color-picker.tsx
  - apps/template/components/collections/filter-primitives.tsx
  - apps/template/components/collections/filter-sidebar.tsx
---

## Summary

Several user-facing strings were hardcoded in domain components and the homepage
instead of going through next-intl. This change routes them through the catalog
(`lib/i18n/messages/en.json`), per AGENTS.md Critical Rule #2 (new user-visible
strings live in all locale files so the multi-locale upgrade path stays mechanical):

- **Homepage hero** (`app/page.tsx`): headline, subheadline, CTA label, and the
  products-grid title now come from a refreshed `home` namespace via
  `getTranslations("home")`. The `home` namespace was previously **orphaned** — no
  component referenced it, and its keys (`title`/`viewAllProducts`/`viewSampleProduct`)
  didn't match the rendered page. They're replaced with
  `ctaText`/`headline`/`productsTitle`/`subheadline`.
- **Color picker** (`components/product-detail/color-picker.tsx`): the swatch
  `aria-label`s and `alt` are now translated. The available-swatch label **reuses
  the existing `product.selectVariantLabel`** (`"Select {name}: {value}"`) instead of
  re-implementing it inline; two new keys cover the unavailable state
  (`product.unavailableVariantLabel`) and the swatch alt (`product.swatchAlt`).
  `ColorPicker` is now an async server component calling `getTranslations("product")`
  — safe because it only renders inside the server-rendered `ProductInfoOptions` tree.
- **Price filter** (`components/collections/filter-primitives.tsx` +
  `filter-sidebar.tsx`): the `From`/`To` input placeholders move out of the
  `"use client"` primitive into `fromPlaceholder`/`toPlaceholder` props (defaulting to
  `"From"`/`"To"`), supplied by the consumer via `tCategory("priceFrom")` /
  `tCategory("priceTo")`. The primitive stays translation-free, consistent with the
  `ui/`-style separation.

## Why it matters

- Keeps the multi-locale upgrade path mechanical: every user-visible string lives in
  the catalog, so enabling a new locale is "add a JSON file", not "hunt for inline literals".
- Removes drift — the `home` namespace now reflects what the homepage actually renders.
- Reuses an existing key (`selectVariantLabel`) rather than duplicating the same label
  logic in two places.

## Apply when

- The storefront still renders the template homepage hero, the PDP color picker, and
  the collections price filter largely as shipped.

## Safe to skip when

- The storefront has replaced `app/page.tsx` with its own homepage copy, or swapped out
  the color-picker / filter-sidebar components.
- Adopting only the `en.json` key additions is harmless (purely additive) and keeps
  catalogs aligned even if the component edits are skipped.

## Out of scope

Two categories of hardcoded strings were intentionally left alone:

- `ui/` primitive a11y strings (`"Close"`, `"More"`, `"Loading"`, `"Scroll left/right"`) —
  AGENTS.md Rule #3 forbids `useTranslations` in `ui/`, so translating them requires
  threading label props from every consumer.
- Vendored `components/ai-elements/*` strings — translating them diverges from upstream.

## Validation

1. `pnpm --filter template build` (regenerates the next-intl message declaration and
   type-checks the new `t()` keys).
2. `pnpm --filter template lint`.
3. Visual spot-check:
   - `/` — hero headline/subheadline/CTA and the "Products" grid title render from the `home` namespace.
   - A PDP with color options — swatch `aria-label`s read `Select <option>: <value>` (available) and `<option>: <value> (unavailable)`; swatch `alt` reads `<value> swatch`.
   - A collection page with a price filter — the two inputs show `From` / `To`.
