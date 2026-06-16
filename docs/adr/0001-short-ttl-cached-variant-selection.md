# Variant selection uses a short-TTL shared cache

`getProductSelection()` (the PDP's option-params → selected-variant resolution) uses `"use cache: remote"` with `cacheLife("minutes")` and the `products` / `product-{handle}` tags, keyed by canonically sorted options. A short TTL keeps recently resolved combinations reusable without turning a product's potentially large combination space into a persistent cache archive. Availability is at most minutes stale on the PDP, while `cartLinesAdd` and checkout remain the authoritative stock checks.

## Considered Options

- **`no-store` (rejected):** freshest availability, but repeated visits to the same option URL always repeat the Shopify selection query.
- **`cacheLife("max")` + webhook tags (rejected):** matches the base product's policy, but per-combination entries accumulate into a large keyspace, and the webhook route's broad `products`-tag flush on every `inventory_levels/*` event would constantly vaporize it — write-amplification with a collapsing hit rate.
- **Resolve from a fully cached variant list (pre-PR model, rejected):** one cache entry per product, but capped variant fetches truncate >250-variant products and cannot represent Combined Listings; abandoning that cap was the point of the modern selection API migration.

## Consequences

- The PDP freshness model is a gradient: browse = webhook-fresh cached shell, option selection = minutes-fresh, add-to-cart = live validation by Shopify.
- Junk query params mint cache entries, but they expire in minutes; no option-name validation hop is needed and the base-product/selection requests stay parallel.
- The PDP does not enable route-wide runtime prefetching because that can render a request-time product body that disagrees with the frozen shell. First-time option navigations may stream their selection-dependent regions.
- The proxy's `?variant=` ID lookup stays uncached: redirects are one-shot per client (308 is browser-cached) and per-variant-ID entries would have near-zero reuse.
