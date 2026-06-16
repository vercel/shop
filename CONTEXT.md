# Shop Storefront

The Next.js + Shopify storefront template and its docs/skills. This context covers the product, variant, and cart domain language used across `apps/template`, the docs app, and the rollout log.

## Language

**Selection**:
The resolved state of a shopper's option choices on a PDP — the selected variant, per-option-value existence/availability, and option link targets.
_Avoid_: variant lookup, variant resolution (those describe the query, not the state)

**Representative variant set**:
The small set of variants a product carries (`selectedOrFirstAvailableVariant`, `adjacentVariants`, `firstSelectableVariant` per option value) — enough to render and navigate, never an exhaustive export.
_Avoid_: "all variants", "the variants list"

**Eager path**:
A PDP region rendered into the prerendered shell because data proves selection cannot change it (`hasUniformPricing`, `variantsCount === 1`, `allVariantsInStock`).

**Freshness gradient**:
The deliberate policy that data gets fresher as purchase intent deepens: browse = webhook-fresh cache, selection = minutes-fresh cache, add-to-cart = live Shopify validation.

**Option-name URL**:
The canonical variant deep-link dialect: `?Color=Black&Size=Medium`, localized per locale, expressing full or partial selections.
_Avoid_: variant URL (ambiguous with the Liquid dialect)

**Liquid variant URL**:
The legacy `?variant=<numeric id>` dialect — accepted as migration input and as the locale-invariant cross-locale bridge, always 308-redirected to an option-name URL by the proxy.

**Combined Listing**:
A Shopify product whose option values resolve to variants owned by other (child) products; selecting such a value navigates to the child product's handle.

**Fixed bundle**:
A variant with `requiresComponents` and a non-empty `components` list; purchasable as-is, rendering its contents on the PDP and grouped lines in the cart.

**Customized bundle**:
A variant with `requiresComponents` and no fixed components; not purchasable through generic buy buttons until an app-specific component picker supplies `CartLineInput.parent` data.

## Relationships

- A **Selection** is computed from the cached base product plus a short-TTL **Selection** query; only regions a **Selection** can change stream behind Suspense — everything else takes the **eager path**
- An **Option-name URL** expresses a **Selection**; a **Liquid variant URL** is translated into one by the proxy
- A **Combined Listing** option value may move the **Option-name URL** to a different product handle
- A **Fixed bundle** keeps its components grouped as nested cart lines; a **Customized bundle** cannot enter the cart without component inputs

## Example dialogue

> **Dev:** "The PDP shows a skeleton for the price — is the **Selection** broken?"
> **Domain expert:** "Only if the product has uniform pricing. Then the price is on the **eager path** and belongs in the prerendered shell; a skeleton there is a regression. If variant prices differ, the price legitimately streams with the **Selection**."

> **Dev:** "Can I count variants with `product.variants.length`?"
> **Domain expert:** "No — that's the **representative variant set**. Use `variantsCount`."

## Flagged ambiguities

- "caching the variants" was used to mean both the pre-2026 full-variant-array cache and per-**Selection** cache entries — resolved: the modern model caches the base product (webhook-fresh, per handle) and **Selections** (minutes-fresh, per sorted option combination) separately; see ADR-0001.
- "instant navigation" was used to mean both static-shell navigation and runtime-prefetched **Selections** — resolved: the PDP keeps the product body coherent in the static shell and does not use route-wide runtime prefetching; a first option navigation may stream selection-dependent regions, while recently visited selections can resolve from cache.
