---
title: Modern Shopify product model — high variants, Combined Listings, and bundles
changeKey: modern-shopify-product-model
introducedOn: 2026-06-05
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/app/products/[handle]/page.tsx
  - apps/template/proxy.ts
  - apps/template/components/product-detail/
  - apps/template/components/cart/
  - apps/template/lib/agent/
  - apps/template/lib/product.ts
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/operations/product-variant-route.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/transforms/cart.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/types.ts
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
  - apps/docs/content/docs/anatomy/cart.mdx
  - apps/docs/content/docs/reference/storefront-api.mdx
  - apps/docs/content/docs/shopify/pdp.mdx
---

## Summary

The template replaces its capped `variants(first: 50)` PDP model with Shopify Storefront API 2026-04 selection fields:

- `options.optionValues.firstSelectableVariant`
- `selectedOrFirstAvailableVariant(selectedOptions:)`
- `adjacentVariants(selectedOptions:)`
- `encodedVariantExistence` and `encodedVariantAvailability`
- `variantsCount`

PDP option links use option-name query parameters and can navigate across Combined Listing child product handles. Product cards link to the bare product path so card navigations stay on the prerendered PDP shell; cart line items link with the carted variant's option parameters. Shopify-standard Liquid `?variant=` links remain valid migration inputs and permanently redirect to the normalized option-name URL while product metadata canonicalizes to the base product path. A query-matched proxy performs that compatibility lookup before rendering, so normal PDP routes remain prerenderable and do not execute proxy code. The PDP starts its base-product and compact selection reads together, then awaits only the base product at the route level so the product body remains baked into the static shell. The selection cache (`"use cache: remote"`, `cacheLife("minutes")`, canonically sorted option keys) keeps recently resolved combinations reusable while its short lifetime prevents the per-combination keyspace from becoming persistent.

The same change adds Shopify bundle awareness:

- Selected variants expose `requiresComponents`, fixed bundle `components`, and reverse `groupedBy` relationships.
- PDPs render fixed bundle contents and bundles containing the selected component.
- Generic buy buttons disable customized bundle parents that require an app-specific component picker.
- Cart queries preserve `ComponentizableCartLine.lineComponents` and honor line edit/remove instructions when Shopify exposes them.
- `addToCart()` accepts optional `CartLineInput.parent` data for downstream customized bundle flows.
- Deprecated pre-checkout cart tax amounts are removed; taxes and duties are described as checkout-time values.
- The shopping agent resolves exact option combinations on demand and renders bundle components in cart summaries.

## Why it matters

Shopify supports up to 2,048 variants per product. Fetching the first 50 variants truncates option availability, variant IDs, pricing, and media for larger catalogs. It also cannot model Combined Listings correctly because an option value can resolve to a variant owned by another product.

Shopify's bundle model adds relationships at both product-variant and cart-line levels. Without preserving those fields, storefronts can present a bundle as an ordinary product and lose its component grouping in cart.

## Apply when

- The storefront queries `variants(first: 50)` or reads deprecated `ProductOption.values` for PDP selection.
- Products can exceed 50 variants.
- The catalog uses or plans to use Combined Listings.
- The catalog sells fixed bundles or uses Cart Transform customized bundles.
- The shopping agent must resolve variants that are not present in a small representative list.

## Safe to skip when

- The storefront has a custom product configurator that already resolves selected options through Shopify's modern Storefront API fields.
- The storefront intentionally targets an older Storefront API version that does not expose the queried fields.
- The product and cart domain models have been replaced and this rollout would conflict with their ownership boundaries.

## Adoption notes

- `ProductDetails.variants` is now a representative selectable set, not an exhaustive export. Use `ProductDetails.variantsCount` for the exact count and `getProductSelection()` to resolve a choice.
- Do not infer uniform pricing, uniform stock, or single-variant status from `ProductDetails.variants`. Use the exact signals instead: `ProductDetails.hasUniformPricing` (equal `priceRange` and `compareAtPriceRange` bounds), `ProductDetails.allVariantsInStock` (`encodedVariantExistence` equals `encodedVariantAvailability`), and `ProductDetails.variantsCount === 1`.
- Keep the eager PDP paths these signals enable: uniform-price products render the price in the prerendered shell, single-variant products render options and buy buttons eagerly, and uniform-stock products render a labeled buy-button fallback. Selection-dependent Suspense streaming is only for regions selection can actually change.
- `ProductVariant` gains `productHandle`, `requiresComponents`, `components`, and `bundleParents`.
- `CartLine` gains nested `components`, `canRemove`, and `canUpdateQuantity`.
- `Cart.cost.totalTaxAmount` is removed because Shopify deprecated it in Storefront API 2025-01.
- PDP option links and cart line items use option names and values; product cards link to the bare product path so card navigations hit the prerendered shell without any selection lookup. Numeric `?variant=` URLs are accepted for Liquid-store migration and permanently redirect to the normalized option-name URL.
- Keep `getProduct()` keyed only by handle and locale with plain `"use cache"` and `cacheLife("max")` so it can render into the static shell. Selected option combinations belong in `getProductSelection()`, which must stay short-TTL cached (`cacheLife("minutes")`, sorted option keys) so recently viewed combinations are reusable without accumulating permanently.
- Start base product and selection requests together, but await the product at the route level and pass only the selection promise into Suspense boundaries.
- Keep option links on the default static-shell prefetch. Do not add route-wide `prefetch = "allow-runtime"` or force full prefetches from the pickers; that can re-render the product body at request time and tear from the frozen shell.
- Keep the variant-ID compatibility lookup uncached and isolated in the query-matched product proxy; it must not add variant IDs to Runtime Cache or make ordinary PDPs dynamic.
- Pass only the selected variant fields required by client buy controls; keep bundle relationship arrays on the server.
- Customized bundle selection remains app-specific. Add its picker and component inputs before enabling direct purchase for a `requiresComponents` variant with no fixed components.

## Validation

1. Validate the final product and cart GraphQL operations against Storefront API 2026-04.
2. Open a product with more than 50 variants and confirm all option values render with correct existence and availability state.
3. Change a Combined Listing option and confirm the URL can move to the selected child product handle.
4. Open a Liquid `/products/:handle?variant=:id` link and confirm it permanently redirects to the matching option-name URL.
5. Confirm a selected-option PDP starts the base-product and selection operations together, with the base product on plain `"use cache"` / `cacheLife("max")` and the selection on `"use cache: remote"` / `cacheLife("minutes")`.
6. Confirm the PDP does not export `prefetch = "allow-runtime"` and option picker links do not force `prefetch={true}`; a first option navigation may stream only the selection-dependent regions.
7. Confirm a uniform-price product renders its price in the prerendered HTML, and a single-variant product renders its buy buttons there.
8. Open a fixed bundle PDP and confirm its component products render and the bundle can be added.
9. Open a component product and confirm bundles returned by `groupedBy` render.
10. Confirm bundle components remain grouped in the cart and line controls honor Shopify's instructions.
11. Confirm a customized bundle parent without selected components cannot be added directly.
12. Ask the shopping agent to select options on a high-variant product and confirm it calls `resolveProductVariant` before `addToCart`.
13. Run `pnpm --filter template lint`, `pnpm --filter template test`, `pnpm --filter template build`, `pnpm --filter docs lint`, and `pnpm --filter docs build`.
