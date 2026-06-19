---
title: Shopify bundles — PDP relationships, buy-button gating, and cart components
changeKey: shopify-bundles
introducedOn: 2026-06-19
changeType: feature
defaultAction: review
appliesTo:
  - all
paths:
  - apps/template/lib/shopify/fragments.ts
  - apps/template/lib/shopify/transforms/product.ts
  - apps/template/lib/shopify/transforms/cart.ts
  - apps/template/lib/shopify/operations/products.ts
  - apps/template/lib/shopify/operations/cart.ts
  - apps/template/lib/types.ts
  - apps/template/components/product-detail/bundle-components.tsx
  - apps/template/components/product-detail/product-detail-section.tsx
  - apps/template/components/product-detail/buy-buttons.tsx
  - apps/template/components/cart/overlay-item.tsx
  - apps/template/components/cart/context.tsx
  - apps/template/components/agent/registry.tsx
  - apps/template/lib/agent/index.ts
  - apps/template/lib/agent/server.ts
  - apps/template/lib/agent/tools/get-cart.ts
  - apps/template/lib/agent/tools/add-to-cart.ts
  - apps/template/lib/i18n/messages/en.json
  - apps/docs/content/docs/anatomy/pages/pdp.mdx
  - apps/docs/content/docs/anatomy/cart.mdx
  - apps/docs/content/docs/anatomy/agent.mdx
  - apps/docs/content/docs/shopify/pdp.mdx
  - apps/docs/content/docs/reference/troubleshooting.mdx
---

## Summary

The template now models Shopify [product bundles](https://help.shopify.com/en/manual/products/bundles) across the PDP, cart, and shopping agent.

- The selected/purchasable variant exposes Shopify's bundle relationships via a new `PurchasableProductVariantFields` fragment: `requiresComponents`, fixed-bundle `components`, and reverse `groupedBy`. These flow onto `ProductVariant` as `requiresComponents` / `components` / `bundleParents` (defaulted to `false` / `[]` by `transformVariant`, so non-bundle variants are unaffected). Bundle fields are fetched only for the resolved variant — never the full matrix or cards.
- The PDP renders a fixed bundle's contents ("Bundle includes") and the bundles a product is part of ("Available in bundles", collapsed to one link per bundle) via `bundle-components.tsx`.
- `BuyButtons` takes a `BuyButtonVariant` projection with a `requiresBundleConfiguration` boolean; a customized bundle parent (`requiresComponents` and no fixed `components`) disables the buy buttons with a "Choose bundle items" label. Bundle relationship arrays stay server-side.
- The cart reads `ComponentizableCartLine.lineComponents` as nested `CartLine.components`, renders them under the parent line, and honors Shopify's `canRemove` / `canUpdateQuantity` edit instructions. `addToCart()` accepts Shopify's optional `CartLineInput.parent`.
- The deprecated `Cart.cost.totalTaxAmount` is removed (Shopify dropped it in Storefront API 2025-01); taxes/duties are described as checkout-time values.
- The shopping agent renders bundle components in cart summaries and is told not to add customized bundle parents that lack fixed components.

## Why it matters

Shopify's bundle model adds relationships at the product-variant and cart-line levels. Without preserving them, a storefront presents a bundle as an ordinary product, loses its component grouping in the cart, and can let a shopper "buy" a customized bundle parent that isn't actually purchasable.

## Apply when

- The catalog sells fixed bundles (e.g. via the Shopify Bundles app) or uses Cart Transform customized bundles.
- The storefront should show what a bundle contains, surface the bundles a product belongs to, or block direct purchase of customized bundle parents.

## Safe to skip when

- The catalog has no bundles and won't add them.
- A custom product/cart domain model already represents bundle relationships and this rollout would conflict with its ownership boundaries.

## Adoption notes

- `ProductVariant` gains `requiresComponents`, `components` (`ProductVariantComponent[]`), and `bundleParents` (`ProductVariantReference[]`). `CartLine` gains `components`, `canRemove`, and `canUpdateQuantity`.
- `Cart.cost.totalTaxAmount` is removed. Update any summary that read it to a checkout-time note.
- Pass only the fields client buy controls need (the `BuyButtonVariant` projection) — keep the bundle relationship arrays on the server.
- Customized bundle selection remains app-specific: add a component picker and send component lines through `CartLineInput.parent` before enabling direct purchase for a `requiresComponents` variant with no fixed components.
- **Publish bundles to the Headless channel.** The Shopify Bundles app publishes only to Online Store; the template reads from Headless. A bundle that 404s while ACTIVE in admin is almost always missing from Headless. Its component products must be on Headless too.

## Validation

1. Validate the product and cart operations against your Storefront API version (bundle fields require 2024-10+; the template defaults to 2026-04).
2. Open a fixed bundle PDP and confirm its components render and it adds to cart.
3. Open a component product and confirm the bundles returned by `groupedBy` render as one link each.
4. Confirm a customized bundle parent without fixed components cannot be added (buy buttons disabled, "Choose bundle items").
5. Add a bundle to the cart and confirm its components are grouped under the parent line and the edit controls honor Shopify's instructions.
6. Ask the shopping agent to show the cart and confirm bundle components appear in the summary.
7. Run `pnpm --filter template lint`, `pnpm --filter template build`, and `pnpm --filter docs build`.
