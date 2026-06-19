# Shop Storefront

The Next.js + Shopify storefront template and its docs/skills. This context covers the product, variant, and cart domain language used across `apps/template`, the docs app, and the rollout log.

## Language

**Selection**:
The resolved state of a shopper's option choices on a PDP — the selected variant, per-option-value existence/availability, and option link targets.
_Avoid_: variant lookup, variant resolution (those describe the query, not the state)

**Representative variant set**:
The small set of variants a product carries (`selectedOrFirstAvailableVariant`, `adjacentVariants`, `firstSelectableVariant` per option value) — enough to render and navigate, never an exhaustive export.
_Avoid_: "all variants", "the variants list"

**Freshness gradient**:
The deliberate policy that data gets fresher as purchase intent deepens: browse = webhook-fresh cache, selection = minutes-fresh cache, add-to-cart = live Shopify validation.

**Concrete variant URL**:
The default variant deep-link dialect: `/products/<handle>?variant=<numeric variant id>`. It names one Shopify variant, so the public selection space is finite.
_Avoid_: selection URL (ambiguous with opt-in partial selection)

**Partial selection URL**:
An opt-in configurator URL such as `?Color=Black` that expresses an incomplete option choice. The default template does not expose this route space; use the `enable-partial-product-selection` skill when a merchant needs it.

**Combined Listing**:
A Shopify product whose option values resolve to variants owned by other (child) products; selecting such a value navigates to the child product's handle.

**Fixed bundle**:
A variant with `requiresComponents` and a non-empty `components` list; purchasable as-is, rendering its contents on the PDP and grouped lines in the cart.

**Customized bundle**:
A variant with `requiresComponents` and no fixed components; not purchasable through generic buy buttons until an app-specific component picker supplies `CartLineInput.parent` data.

## Relationships

- The base PDP prerenders the cached product shell; a **Concrete variant URL** resolves its selected options and short-TTL **Selection** inside variant-dependent server Suspense regions
- A **Combined Listing** option value may move the **Concrete variant URL** to a different product handle
- A **Fixed bundle** keeps its components grouped as nested cart lines; a **Customized bundle** cannot enter the cart without component inputs

## Example dialogue

> **Dev:** "Why can parts of a variant navigation stream?"
> **Domain expert:** "The cached product shell does not wait for request parameters. Only regions that require the concrete **Selection** suspend while the server resolves it."

> **Dev:** "Can I count variants with `product.variants.length`?"
> **Domain expert:** "No — that's the **representative variant set**. Use `variantsCount`."

## Flagged ambiguities

- "caching the variants" was used to mean both the pre-2026 full-variant-array cache and per-**Selection** cache entries — resolved: the modern model caches the base product (webhook-fresh, per handle) and concrete **Selections** (minutes-fresh, per selected option combination) separately; see ADR-0001.
- "variant URL" was used for option-name queries and exact Shopify IDs — resolved: the template exposes finite **Concrete variant URLs** using `?variant=<id>`. **Partial selection URLs** are opt-in.
