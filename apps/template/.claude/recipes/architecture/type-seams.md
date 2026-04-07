# Recipe: Type Seams (Domain vs Provider Types)

> Domain types in `lib/types.ts` are provider-agnostic. Transforms convert commerce provider responses into these types. Components never import provider types.

## When to read this

- Adding a new data type (e.g., wishlist, reviews)
- Modifying product or cart data structures
- Replacing the commerce provider
- Debugging type mismatches between API data and components

## Key files

| File | Role |
|------|------|
| `lib/types.ts` | Domain types — the contract between data and components |
| `lib/commerce/providers/<name>/types/` | Provider-specific API response types |
| `lib/commerce/providers/<name>/transforms/` | Convert provider responses → domain types |
| `lib/commerce/providers/<name>/transforms/product.ts` | `transformProductCard`, `transformProductDetails` |
| `lib/commerce/providers/<name>/transforms/cart.ts` | `transformCart` |
| `lib/commerce/providers/<name>/transforms/collection.ts` | `transformCollection` |
| `lib/commerce/providers/<name>/transforms/filters.ts` | Filter/facet transforms |
| `lib/commerce/providers/<name>/transforms/search.ts` | Predictive search transforms |

## How it works

### The boundary

```
Components (import from @/lib/types)
        ↕ domain types only
Transforms (lib/commerce/providers/<name>/transforms/)
        ↕ both types meet here
Operations (lib/commerce/providers/<name>/operations/)
        ↕ provider API types
Commerce Provider API
```

Transforms are the **only place** where provider types and domain types meet. This is the seam that makes the commerce provider swappable.

### Domain types (lib/types.ts)

These types define what components expect. They're provider-agnostic:

- **`ProductCard`** — Minimal product data for grids/carousels (id, handle, title, price, image, rating)
- **`ProductDetails`** — Extended data for PDP (extends ProductCard with description, variants, options, metafields)
- **`Cart`** / **`CartLine`** — Cart state with line items, costs, checkout URL
- **`Collection`** — Collection metadata
- **`Filter`** / **`FilterValue`** — Faceted search filters
- **`ProductListResult`** — Paginated product list with filters
- **`Homepage`** / **`MarketingPage`** — CMS content types
- **`Money`** / **`Image`** / **`SEO`** — Shared primitives

### Provider types (lib/commerce/providers/<name>/types/)

Provider-specific types that match the API response shapes:

- `types/customer.ts` — Customer Account API types (Customer, Address, Order, Fulfillment)
- `types/filters.ts` — Provider filter types
- `types/menu.ts` — MenuItem, MenuItemType
- `types/megamenu.ts` — Megamenu structure

### Transform functions

Each transform takes a provider API response and returns a domain type:

```tsx
// providers/<name>/transforms/product.ts
export function transformProductCard(product: ProviderCategoryProduct): ProductCard { ... }
export function transformProductDetails(product: ProviderProduct): ProductDetails { ... }

// providers/<name>/transforms/cart.ts
export function transformCart(cart: ProviderCart): Cart { ... }

// providers/<name>/transforms/collection.ts
export function transformCollection(collection: ProviderCollection): Collection { ... }
```

Transforms handle edge cases like null images, missing metafields, and placeholder review data.

### Where transforms are called

Transforms are called inside operations, not in components:

```tsx
// lib/commerce/providers/<name>/operations/products.ts
export async function getProduct(handle: string, locale?: string) {
  const data = await providerFetch<...>({ /* provider-specific request */ });
  return transformProductDetails(data);  // ← Transform here
}
```

Components receive pre-transformed domain types:

```tsx
// app/products/[handle]/page.tsx
const product = await getProduct(handle, locale);  // ← Already ProductDetails
return <ProductInfo product={product} />;
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Components import from `@/lib/types` only — never from `@/lib/commerce/providers/*/types` or `@/lib/commerce/transforms`
- [ ] GUARDRAIL: Transforms are the only place provider types and domain types meet — don't leak provider types into operations' return types
- [ ] GUARDRAIL: New domain types go in `lib/types.ts` — new provider-specific types go in `lib/commerce/providers/<name>/types/`
- [ ] GUARDRAIL: When modifying a domain type, update ALL transforms that produce it — search for the type name in `lib/commerce/providers/*/transforms/`

## Common modifications

### Adding a new field to ProductCard

1. Add the field to `ProductCard` in `lib/types.ts`:
   ```tsx
   export interface ProductCard {
     // ...existing fields
     isNew?: boolean;
   }
   ```
2. Update your provider's API request to include the new field
3. Update the provider response type in `providers/<name>/types.ts`
4. Update `transformProductCard` to map the new field
5. Use in components: `product.isNew`

See [Add New Product Field](../guides/add-new-product-field.md) for the full walkthrough.

### Adding a new domain type

1. Define the type in `lib/types.ts`
2. Define the provider response type in `lib/commerce/providers/<name>/types.ts`
3. Create a transform function in `lib/commerce/providers/<name>/transforms/` (new file if needed)
5. Use the transform in operations, return domain types to components

## See also

- [Commerce Operations](../commerce/operations.md) — Operation patterns and caching
- [Swap Commerce Provider](../guides/swap-commerce-provider.md) — How to replace the commerce provider
- [Add New Product Field](../guides/add-new-product-field.md) — End-to-end example
