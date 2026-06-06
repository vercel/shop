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
  - apps/template/lib/shopify/fragments.ts
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

PDP and product-card links use option-name query parameters and can navigate across Combined Listing child product handles. Shopify-standard Liquid `?variant=` links remain valid migration inputs and permanently redirect to the normalized option-name URL while product metadata canonicalizes to the base product path. The PDP starts a cached base-product read and a compact uncached selection request in parallel, avoiding both request waterfalls and high-cardinality runtime-cache entries.

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
- Do not infer uniform pricing, uniform stock, or single-variant status from `ProductDetails.variants`; the old `hasUniformPricing()` and `hasUniformStock()` helpers are removed.
- `ProductVariant` gains `productHandle`, `requiresComponents`, `components`, and `bundleParents`.
- `CartLine` gains nested `components`, `canRemove`, and `canUpdateQuantity`.
- `Cart.cost.totalTaxAmount` is removed because Shopify deprecated it in Storefront API 2025-01.
- PDP and product-card links use option names and values. Numeric `?variant=` URLs are accepted for Liquid-store migration and permanently redirect to the normalized option-name URL.
- Keep `getProduct()` keyed only by handle and locale. Selected option combinations belong in the uncached `getProductSelection()` path.
- Start base product and selection requests in parallel; do not await the product before resolving selected options.
- Keep the variant-ID compatibility lookup uncached; it must not add variant IDs to Runtime Cache.
- Pass only the selected variant fields required by client buy controls; keep bundle relationship arrays on the server.
- Customized bundle selection remains app-specific. Add its picker and component inputs before enabling direct purchase for a `requiresComponents` variant with no fixed components.

## Validation

1. Validate the final product and cart GraphQL operations against Storefront API 2026-04.
2. Open a product with more than 50 variants and confirm all option values render with correct existence and availability state.
3. Change a Combined Listing option and confirm the URL can move to the selected child product handle.
4. Open a Liquid `/products/:handle?variant=:id` link and confirm it permanently redirects to the matching option-name URL.
5. Confirm a selected-option PDP starts the base-product and selection operations in parallel and that only the base product uses persistent caching.
6. Open a fixed bundle PDP and confirm its component products render and the bundle can be added.
7. Open a component product and confirm bundles returned by `groupedBy` render.
8. Confirm bundle components remain grouped in the cart and line controls honor Shopify's instructions.
9. Confirm a customized bundle parent without selected components cannot be added directly.
10. Ask the shopping agent to select options on a high-variant product and confirm it calls `resolveProductVariant` before `addToCart`.
11. Run `pnpm --filter template lint`, `pnpm --filter template test`, `pnpm --filter template build`, `pnpm --filter docs lint`, and `pnpm --filter docs build`.
