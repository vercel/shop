---
title: PDP variant selection via selected-options URLs and a suspended variant query
changeKey: pdp-selected-options-variant-urls
introducedOn: 2026-06-18
changeType: refactor
defaultAction: adopt
appliesTo:
  - all
supersedes:
  - shopify-variant-query-param
  - pdp-variants-first-250
  - pdp-color-gallery-fallback
paths:
  - apps/template/lib/shopify/encoded-variants.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/product.ts
  - apps/template/lib/types.ts
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/product-info.tsx
  - apps/template/components/product-detail/color-picker.tsx
  - apps/template/components/product-detail/option-picker.tsx
  - apps/template/components/product-detail/schema.tsx
  - apps/template/app/md/products/[handle]/route.ts
  - apps/template/app/api/chat/route.ts
  - apps/template/lib/agent/tools/get-product-details.ts
---

## Summary

The PDP now selects variants by option (`/products/handle?color=Blue&size=XS`) instead of
`?variant=<numericId>`, and resolves the active variant with a **suspended Shopify query** keyed
on the selected options rather than a client-side scan of an inline variant list.

The cached product shell (`getProduct`) no longer fetches `variants(first: 250)`. Instead it
carries:

- `encodedVariantExistence` / `encodedVariantAvailability` (Storefront 2024-10 tries) — decoded
  in `lib/shopify/encoded-variants.ts` to drive swatch availability and the variant count.
- `selectedOrFirstAvailableVariant` — the default variant for the no-params / single-variant
  eager render.
- `options.optionValues.firstSelectableVariant.image` — a representative image per option value,
  threaded onto `OptionValue.image` for swatches and the color gallery.

Price and add-to-cart depend on `getProductVariant({ handle, selectedOptions })`, which calls
`selectedOrFirstAvailableVariant(selectedOptions:, ignoreUnknownOptions: true,
caseInsensitiveMatch: true)`. It is `use cache` + `cacheTag("products", \`product-${handle}\`)`,
so each option combination is cached and invalidates with the product. When no option params are
present, the page skips the round-trip and uses the cached default variant.

Consumers that genuinely enumerate the full matrix — the AI agent page context
(`app/api/chat/route.ts`), `getProductDetails`, and the markdown route — now call the new
`getProductWithVariants` (slim shell + `variants(first: 250)`). `ProductDetails.variants` is now
optional; only `getProductWithVariants` / `getProductById` populate it.

## Why it matters

- **Shareable, human-readable URLs.** `?color=Blue&size=XS` is meaningful and SEO-friendly; it no
  longer leaks opaque numeric variant IDs.
- **Correct contextual variant data.** The displayed price/availability and the add-to-cart
  merchandise ID come from a live, locale-`@inContext` query for the exact selection, decoupled
  from the long-lived cached shell — the right foundation for Shopify Markets pricing.
- **Smaller cached payload.** The PDP shell stops shipping up to 250 variants; availability is a
  compact encoded string.

## Apply when

- The storefront still ships the default `/products/[handle]` PDP, option pickers, and Shopify
  Storefront API >= 2024-10 (for the encoded availability fields).

## Safe to skip when

- The storefront pins a Storefront API version older than 2024-10 (no `encodedVariant*` fields).
- The storefront needs per-color galleries that show *every* image for a color. This change leads
  the gallery with the selected variant's single image plus the shared media; multi-image-per-color
  partitioning required the full variant list and is intentionally dropped.
- The storefront already replaced the PDP data layer with its own variant resolution.

## Tradeoff

Swatch availability comes from `encodedVariantAvailability` rather than per-variant stock in an
inline list. The decoder guards the known upstream quirk (synthetic single-option products) by
treating all values as available; the authoritative per-variant availability still gates the
add-to-cart button via the suspended query. The color gallery loses per-color multi-image
filtering (see above).

## Validation

1. `pnpm --filter template build` succeeds; the PDP prerenders as Partial Prerender (◐).
2. On a multi-variant product: selecting a swatch updates the URL to `?color=…&size=…`; price and
   add-to-cart restream; the resolved variant adds the correct merchandise ID; out-of-stock /
   nonexistent combinations are greyed.
3. Deep-linking a full `?color=&size=` URL renders the matching variant with no layout shift; a
   partial URL falls back via `selectedOrFirstAvailableVariant`.
4. A single-variant product renders price + buy buttons eagerly (no suspended query).
5. `curl -H "Accept: text/markdown" /products/<handle>` still includes the Variants table, and the
   AI agent can still list variants and add the current product to the cart (both via
   `getProductWithVariants`).
