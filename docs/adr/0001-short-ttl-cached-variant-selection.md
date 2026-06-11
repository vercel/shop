# Variant selection is cached short-TTL, not fetched per-request

`getProductSelection()` (the PDP's option-params → selected-variant resolution) uses `"use cache: remote"` with `cacheLife("minutes")` and the `products` / `product-{handle}` tags, keyed by canonically sorted options. We decided this after trying `cache: "no-store"` and hitting a structural problem: Next.js runtime prefetching (`prefetch = "allow-runtime"`) walks past cached reads but **stops at uncached ones**, so an uncached selection made option-click navigations unprefetchable — every click showed Suspense fallbacks while paying a per-visible-link prefetch invocation that couldn't include the only content that varies. A short TTL is the point on the freshness/cost curve that satisfies all constraints at once: prefetches arrive complete (no shells), cache entries are a transient working set rather than an accumulating per-combination archive (a 3-option product has ~1,300 valid combination keys; only recently-viewed ones exist at any moment), availability is at most minutes stale on the PDP, and `cartLinesAdd`/checkout remain the authoritative stock check.

## Considered Options

- **`no-store` (rejected):** freshest availability, but structurally unprefetchable — runtime prerenders stop at the uncached read, guaranteeing fallback shells on option navigation. Pre-PR main felt instant precisely because all variant data sat inside the cached product.
- **`cacheLife("max")` + webhook tags (rejected):** matches the base product's policy, but per-combination entries accumulate into a large keyspace, and the webhook route's broad `products`-tag flush on every `inventory_levels/*` event would constantly vaporize it — write-amplification with a collapsing hit rate.
- **Resolve from a fully cached variant list (pre-PR model, rejected):** one cache entry per product, but capped variant fetches truncate >250-variant products and cannot represent Combined Listings; abandoning that cap was the point of the modern selection API migration.

## Consequences

- The PDP freshness model is a gradient: browse = webhook-fresh cached shell, option selection = minutes-fresh, add-to-cart = live validation by Shopify.
- Junk query params mint cache entries, but they expire in minutes; no option-name validation hop is needed and the base-product/selection requests stay parallel.
- The proxy's `?variant=` ID lookup stays uncached: redirects are one-shot per client (308 is browser-cached) and per-variant-ID entries would have near-zero reuse.
