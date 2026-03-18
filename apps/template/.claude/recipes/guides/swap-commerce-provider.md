# Recipe: Swap Commerce Provider

> Replace Shopify with another commerce provider (Saleor, Medusa, BigCommerce, etc.) by implementing operations that produce the same domain types.

## When to read this

- Replacing Shopify with another commerce provider
- Understanding the swappable architecture
- Evaluating the effort required for a provider swap

## Key files

| File | Role |
|------|------|
| `lib/types.ts` | Domain types — the contract your new provider must fulfill |
| `lib/shopify/` | Current Shopify implementation (reference) |
| `lib/shopify/operations/*.ts` | Operations to reimplement |
| `lib/shopify/transforms/*.ts` | Transform pattern to follow |
| `lib/constants.ts` | Cache tags (keep the same tags) |
| `components/cart/actions.ts` | Cart server actions (update imports) |
| `components/product/actions.ts` | Add-to-cart action (update imports) |

## Architecture overview

The commerce provider is isolated behind two boundaries:

```
Components → Domain Types (lib/types.ts) → Operations → Provider API
                          ↑                      ↑
                    Never changes          Replace this layer
```

Components import only from `@/lib/types`. Operations return domain types. Your job is to replace the operations layer.

## Step-by-step

### Phase 1: Set up the new provider

1. Create `lib/your-provider/` directory structure:
   ```
   lib/your-provider/
     client.ts              ← API client
     types/                 ← Provider-specific types
     transforms/            ← Provider response → domain types
     operations/
       products.ts
       collections.ts
       cart.ts
       customer.ts (if applicable)
   ```

2. Implement the API client in `client.ts`

### Phase 2: Implement operations

Each operation must return the exact domain types from `lib/types.ts`. Implement them one by one:

#### Products (most important)

Reimplement functions from `lib/shopify/operations/products.ts`:

| Function | Returns | Used by |
|----------|---------|---------|
| `getProduct(handle, locale)` | `ProductDetails` | PDP |
| `getProducts(params)` | `ProductListResult` | Search, category pages |
| `getCollectionProducts(params)` | `ProductListResult` | Collection pages |
| `getProductRecommendations(handle, locale)` | `ProductCard[]` | PDP recommendations |

#### Collections

| Function | Returns | Used by |
|----------|---------|---------|
| `getCollections(locale)` | `Collection[]` | Navigation, sitemap |
| `getCollection(handle, locale)` | `Collection` | Collection pages |

#### Cart

| Function | Returns | Used by |
|----------|---------|---------|
| `getCart(cartId?)` | `Cart \| null` | Cart display |
| `createCart(locale)` | `Cart` | First add-to-cart |
| `addToCart(lines)` | `Cart` | Add to cart |
| `updateCart(lines)` | `Cart` | Update quantities |
| `removeFromCart(lineIds)` | `Cart` | Remove items |

#### Menu

| Function | Returns | Used by |
|----------|---------|---------|
| `getMenu(handle, locale)` | Menu items | Navigation |

### Phase 3: Write transforms

For each operation, write transform functions that convert your provider's response to domain types:

```tsx
// lib/your-provider/transforms/product.ts
import type { ProductCard, ProductDetails } from "@/lib/types";
import type { YourProviderProduct } from "../types/product";

export function transformProduct(product: YourProviderProduct): ProductDetails {
  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    // ...map all fields to match ProductDetails
  };
}
```

### Phase 4: Add caching

Every operation needs cache directives:

```tsx
export async function getProduct(handle: string, locale: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag(TAGS.products);
  // ...
}
```

Keep the same cache tags (`TAGS.products`, `TAGS.collections`, `TAGS.cart`) so existing invalidation patterns work.

### Phase 5: Update imports

Search for all imports from `@/lib/shopify/operations/` and update to `@/lib/your-provider/operations/`:

```bash
# Find all files importing from Shopify operations
grep -r "from.*@/lib/shopify/operations" apps/shop/ --include="*.ts" --include="*.tsx"
```

Key files to update:
- `components/cart/actions.ts` — cart operation imports
- `components/product/actions.ts` — addToCart import
- All page files in `app/`

### Phase 6: Update webhook handler

Replace `app/api/webhooks/shopify/route.ts` with your provider's webhook format, but keep the same `updateTag()` calls for cache invalidation.

### Phase 7: Update environment variables

Replace Shopify env vars in `.env`:
```
# Remove
SHOPIFY_STORE_DOMAIN=...
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...

# Add your provider's vars
YOUR_PROVIDER_API_URL=...
YOUR_PROVIDER_API_KEY=...
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: New operations MUST return the exact domain types from `lib/types.ts` — components depend on this contract
- [ ] GUARDRAIL: Keep the same cache tags (`TAGS.products`, `TAGS.collections`, `TAGS.cart`) — the invalidation system depends on them
- [ ] GUARDRAIL: Every cached operation needs `"use cache: remote"` + `cacheLife()` + `cacheTag()` — missing any breaks caching
- [ ] GUARDRAIL: Cart server actions must still call `invalidateCartCache()` after mutations
- [ ] GUARDRAIL: Do NOT modify `lib/types.ts` unless your provider genuinely can't provide a field — the types are the stable contract

## Verification checklist

After swapping:

- [ ] Homepage loads with products
- [ ] Product detail page shows all fields (images, variants, options, metafields)
- [ ] Search works with filters and pagination
- [ ] Collection pages load products
- [ ] Add to cart works
- [ ] Cart quantity update and remove work
- [ ] Checkout redirect works
- [ ] Configured locale/market shows correct prices/currency
- [ ] Cache invalidation works (update a product, verify it refreshes)

## See also

- [Type Seams](../architecture/type-seams.md) — The domain/provider boundary
- [GraphQL Operations](../shopify/graphql-operations.md) — Current Shopify implementation reference
- [Cart Actions](../cart/cart-actions.md) — Cart mutation patterns to preserve
- [Caching Strategy](../architecture/caching-strategy.md) — Cache tags and invalidation
