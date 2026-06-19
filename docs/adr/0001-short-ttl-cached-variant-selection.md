# Variant requests use finite IDs and short-TTL selection data

The default storefront exposes `/products/:handle` and Shopify-standard `/products/:handle?variant=:variantId` URLs on one PDP route. The page resolves a numeric ID with an uncached lookup, validates its owning product, then calls `getProductSelection()` with Shopify-provided selected options before rendering one coherent response. Requests without a valid variant ID render Shopify's default selection.

`getProductSelection()` uses `"use cache: remote"` with `cacheLife("minutes")` and the `products` / `product-{handle}` tags. A short TTL reuses recently resolved concrete variants without turning partial option choices or arbitrary query strings into persistent route entries. Availability is at most minutes stale on the PDP, while `cartLinesAdd` and checkout remain authoritative.

## Considered Options

- **`no-store` (rejected):** freshest availability, but repeated visits to the same option URL always repeat the Shopify selection query.
- **`cacheLife("max")` + webhook tags (rejected):** matches the base product's policy, but per-combination entries accumulate into a large keyspace, and the webhook route's broad `products`-tag flush on every `inventory_levels/*` event would constantly vaporize it — write-amplification with a collapsing hit rate.
- **Resolve from a fully cached variant list (pre-PR model, rejected):** one cache entry per product, but capped variant fetches truncate >250-variant products and cannot represent Combined Listings; abandoning that cap was the point of the modern selection API migration.
- **Option-name query params by default (rejected):** supports progressive selection, but exposes an unbounded request and cache-key space, makes every query-bearing PDP request-driven, and complicates SEO and coherent rendering for a capability many storefronts do not need.

## Consequences

- The PDP freshness model remains a gradient: browse = webhook-fresh cached product, variant selection = minutes-fresh, add-to-cart = live Shopify validation.
- Arbitrary search params do not select variants and never enter the selection cache.
- Variant requests block on resolution and selection, so media, price, options, bundle relationships, and buy controls render together instead of replacing fallbacks.
- The variant-ID lookup stays uncached. Caching arbitrary numeric IDs would recreate the cache-cardinality problem before Shopify validates them.
- Exact `?variant=` URLs are handled directly by the PDP. It redirects only when a Combined Listing requires a different owning handle.
- Storefronts that require incomplete, shareable option choices can adopt the `enable-partial-product-selection` skill with validation and cache guardrails.
