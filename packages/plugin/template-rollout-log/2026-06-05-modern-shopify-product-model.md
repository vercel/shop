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
  - apps/template/components/product-detail/
  - apps/template/components/cart/
  - apps/template/lib/agent/
  - apps/template/lib/product.ts
  - apps/template/lib/product-url.ts
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
  - packages/plugin/skills/enable-partial-product-selection/
---

## Summary

The template replaces its capped `variants(first: 50)` PDP model with Shopify Storefront API 2026-04 selection fields:

- `options.optionValues.firstSelectableVariant`
- `selectedOrFirstAvailableVariant(selectedOptions:)`
- `adjacentVariants(selectedOptions:)`
- `encodedVariantExistence` and `encodedVariantAvailability`
- `variantsCount`

PDP option links use finite Shopify-standard `/products/:handle?variant=:variantId` URLs and can navigate across Combined Listing child product handles. Product cards link to the bare product path; cart line items link to the carted variant URL. The PDP resolves numeric variant queries directly while product metadata canonicalizes to the base product.

The PDP renders Shopify's default selection when no valid variant ID is present. For an exact variant query, the same route validates the numeric ID through an uncached lookup, resolves the compact selection with `"use cache: remote"` and `cacheLife("minutes")`, and blocks rendering until the whole selection is ready. This avoids a public partial-selection keyspace and keeps media, price, options, bundle relationships, and buy controls in one render.

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
- The PDP blocks on request parameters. It renders either the default selection or a complete concrete variant without selection-specific Suspense fallbacks.
- `ProductVariant` gains `productHandle`, `requiresComponents`, `components`, and `bundleParents`.
- `CartLine` gains nested `components`, `canRemove`, and `canUpdateQuantity`.
- `Cart.cost.totalTaxAmount` is removed because Shopify deprecated it in Storefront API 2025-01.
- PDP option links and cart line items use `/products/:handle?variant=:variantId`; product cards link to the bare product path. The exact query contract remains compatible with Liquid storefront links.
- Keep `getProduct()` keyed only by handle and locale with plain `"use cache"` and `cacheLife("max")`. Concrete variant selections belong in `getProductSelection()`, which stays short-TTL cached.
- Keep the variant-ID lookup uncached. It validates arbitrary inbound IDs before the selected options enter the shared selection cache.
- Do not use arbitrary search parameters as the default PDP selection contract. Storefronts that require incomplete shareable choices should adopt the `enable-partial-product-selection` skill and its validation guardrails.
- Pass only the selected variant fields required by client buy controls; keep bundle relationship arrays on the server.
- Customized bundle selection remains app-specific. Add its picker and component inputs before enabling direct purchase for a `requiresComponents` variant with no fixed components.

## Validation

1. Validate the final product and cart GraphQL operations against Storefront API 2026-04.
2. Open a product with more than 50 variants and confirm all option values render with correct existence and availability state.
3. Change a Combined Listing option and confirm the concrete variant URL moves to the selected child product handle.
4. Open a Liquid `/products/:handle?variant=:id` link and confirm the URL remains unchanged while the exact variant renders.
5. Confirm arbitrary option-name query parameters do not select a variant or enter the selection cache.
6. Confirm a concrete variant request blocks until media, price, options, bundle relationships, and buy controls can render together.
7. Confirm the base product path renders Shopify's default selection without a selection lookup.
8. Open a fixed bundle PDP and confirm its component products render and the bundle can be added.
9. Open a component product and confirm bundles returned by `groupedBy` render.
10. Confirm bundle components remain grouped in the cart and line controls honor Shopify's instructions.
11. Confirm a customized bundle parent without selected components cannot be added directly.
12. Ask the shopping agent to select options on a high-variant product and confirm it calls `resolveProductVariant` before `addToCart`.
13. Run `pnpm --filter template lint`, `pnpm --filter template test`, `pnpm --filter template build`, `pnpm --filter docs lint`, and `pnpm --filter docs build`.
