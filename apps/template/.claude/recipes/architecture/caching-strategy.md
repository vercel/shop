# Recipe: Caching Strategy

> The app uses Next.js `"use cache"` directive with named cache profiles and tag-based invalidation via Shopify webhooks.

## When to read this

- Adding a new cacheable operation
- Debugging stale data after Shopify admin changes
- Understanding why data isn't updating after a mutation
- Configuring cache lifetimes for a new data type

## Key files

| File | Role |
|------|------|
| `next.config.ts` | Cache life profiles (`catalog`, `product`, `search`, `content`) |
| `lib/constants.ts` | Cache tags: `TAGS = { collections, products, cart }` |
| `lib/shopify/operations/*.ts` | Operations using `"use cache: remote"` + `cacheLife()` + `cacheTag()` |
| `app/api/webhooks/shopify/route.ts` | Webhook handler that calls `updateTag()` for invalidation |
| `components/cart/actions.ts` | Cart mutations that call `updateTag()` |

## How it works

### Cache directive

Operations use `"use cache: remote"` at the top of the function body, followed by `cacheLife()` and `cacheTag()`:

```tsx
export async function getProducts(params) {
  "use cache: remote";
  cacheLife("max");
  cacheTag(TAGS.products);

  // ... fetch from Shopify
}
```

### Cache profiles

Defined in `next.config.ts`:

| Profile | Stale | Revalidate | Expire | Use for |
|---------|-------|------------|--------|---------|
| `catalog` | 1 week | 1 week | 30 days | Collections, menus |
| `product` | 1 day | 1 day | 1 week | Product details |
| `search` | 1 min | 5 min | 1 hour | Search results, filtered listings |
| `content` | 1 hour | 1 hour | 1 day | CMS pages, homepage |

**Stale**: How long to serve cached data without revalidating.
**Revalidate**: Background revalidation interval.
**Expire**: Hard expiration — cache entry is deleted.

### Cache tags

Three main tags (from `lib/constants.ts`):

```tsx
export const TAGS = {
  collections: "collections",
  products: "products",
  cart: "cart",
};
```

Plus `"cart-status"` used by variant-level cart status components.

### Invalidation flow

```
Shopify admin change (product updated)
    ↓
Shopify webhook → app/api/webhooks/shopify/route.ts
    ↓
Verify HMAC signature
    ↓
updateTag(TAGS.products)   // Invalidates all product caches
    ↓
Next request gets fresh data
```

### Webhook topics and tags

The webhook handler maps Shopify topics to cache tags:

| Webhook topic | Cache tag invalidated |
|--------------|----------------------|
| `products/*` | `TAGS.products` |
| `collections/*` | `TAGS.collections` |
| `inventory_levels/*` | `TAGS.products` |
| `metaobjects/*` | `TAGS.products` + `TAGS.collections` |

### Cart mutation invalidation

Cart server actions invalidate cache after every mutation:

```tsx
updateTag(TAGS.cart);       // Cart data (line items, totals)
updateTag("cart-status");   // Variant-level "in cart" indicators
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Every cached operation MUST have both `cacheLife()` and `cacheTag()` — missing `cacheTag` means the cache can never be invalidated on demand
- [ ] GUARDRAIL: Every cart mutation MUST call `updateTag(TAGS.cart)` AND `updateTag("cart-status")` — omitting either causes different parts of the UI to show stale data
- [ ] GUARDRAIL: Call `updateTag()` AFTER the mutation succeeds — premature invalidation causes a race where stale data gets re-cached
- [ ] GUARDRAIL: The webhook route MUST verify HMAC signatures — removing verification allows anyone to trigger cache invalidation

## Common modifications

### Adding a cache profile for a new data type

1. Add the profile in `next.config.ts`:
   ```tsx
   cacheLife: {
     // ...existing profiles
     reviews: {
       stale: 300,      // 5 minutes
       revalidate: 600,  // 10 minutes
       expire: 3600,     // 1 hour
     },
   },
   ```
2. Use in your operation:
   ```tsx
   "use cache: remote";
   cacheLife("max");
   cacheTag("reviews");
   ```
3. If you need on-demand invalidation, add `updateTag("reviews")` to the relevant webhook handler

### Adding a new cache tag

1. Add to `lib/constants.ts`:
   ```tsx
   export const TAGS = {
     collections: "collections",
     products: "products",
     cart: "cart",
     reviews: "reviews",
   };
   ```
2. Use `cacheTag(TAGS.reviews)` in operations
3. Add `updateTag(TAGS.reviews)` to webhook handler for relevant topics

## See also

- [Cart Actions](../cart/cart-actions.md) — Cart-specific cache invalidation
- [GraphQL Operations](../shopify/graphql-operations.md) — Where cache directives are applied
