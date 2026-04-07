# Recipe: Type Seams (Domain vs Provider Types)

> Domain types in `lib/types.ts` are provider-agnostic. Transforms convert Shopify responses into these types. Components never import Shopify types.

## When to read this

- Adding a new data type (e.g., wishlist, reviews)
- Modifying product or cart data structures
- Replacing Shopify with another commerce provider
- Debugging type mismatches between API data and components

## Key files

| File | Role |
|------|------|
| `lib/types.ts` | Domain types — the contract between data and components |
| `lib/shopify/types/` | Shopify-specific API response types |
| `lib/shopify/transforms/` | Convert Shopify → domain types |
| `lib/shopify/transforms/product.ts` | `transformShopifyProductCard`, `transformShopifyProductDetails` |
| `lib/shopify/transforms/cart.ts` | `transformShopifyCart` |
| `lib/shopify/transforms/collection.ts` | `transformShopifyCollection` |
| `lib/shopify/transforms/cms.ts` | CMS content transforms |
| `lib/shopify/transforms/filters.ts` | Filter/facet transforms |
| `lib/shopify/transforms/search.ts` | Predictive search transforms |

## How it works

### The boundary

```
Components (import from @/lib/types)
        ↕ domain types only
Transforms (lib/shopify/transforms/)
        ↕ both types meet here
Operations (lib/shopify/operations/)
        ↕ Shopify API types
Shopify Storefront API
```

Transforms are the **only place** where Shopify types and domain types meet. This is the seam that makes the commerce provider swappable.

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

### Shopify types (lib/shopify/types/)

Shopify-specific types that match the GraphQL API response shapes:

- `types/customer.ts` — Customer Account API types (Customer, Address, Order, Fulfillment)
- `types/filters.ts` — ShopifyFilter, ShopifyFilterType, ProductFilter
- `types/menu.ts` — MenuItem, MenuItemType

### Transform functions

Each transform takes a Shopify API response and returns a domain type:

```tsx
// transforms/product.ts
export function transformShopifyProductCard(product: ShopifyCategoryProduct): ProductCard { ... }
export function transformShopifyProductDetails(product: ShopifyProduct): ProductDetails { ... }

// transforms/cart.ts
export function transformShopifyCart(cart: ShopifyCart): Cart { ... }

// transforms/collection.ts
export function transformShopifyCollection(collection: ShopifyCollection): Collection { ... }
```

Transforms handle edge cases like null images, missing metafields, and placeholder review data.

### Where transforms are called

Transforms are called inside operations, not in components:

```tsx
// lib/shopify/operations/products.ts
export async function getProduct(handle: string, locale: string) {
  const data = await shopifyFetch<...>({ query, variables });
  return transformShopifyProductDetails(data.product);  // ← Transform here
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

- [ ] GUARDRAIL: Components import from `@/lib/types` only — never from `@/lib/shopify/types` or `@/lib/shopify/transforms`
- [ ] GUARDRAIL: Transforms are the only place Shopify types and domain types meet — don't leak Shopify types into operations' return types
- [ ] GUARDRAIL: New domain types go in `lib/types.ts` — new Shopify-specific types go in `lib/shopify/types/`
- [ ] GUARDRAIL: When modifying a domain type, update ALL transforms that produce it — search for the type name in `lib/shopify/transforms/`

## Common modifications

### Adding a new field to ProductCard

1. Add the field to `ProductCard` in `lib/types.ts`:
   ```tsx
   export interface ProductCard {
     // ...existing fields
     isNew?: boolean;
   }
   ```
2. Add the GraphQL field to `CATEGORY_PRODUCT_FRAGMENT` in `lib/shopify/fragments.ts`
3. Update `ShopifyCategoryProduct` type in `transforms/product.ts`
4. Update `transformShopifyProductCard` to map the new field
5. Use in components: `product.isNew`

See [Add New Product Field](../guides/add-new-product-field.md) for the full walkthrough.

### Adding a new domain type

1. Define the type in `lib/types.ts`
2. Define the Shopify response type in `lib/shopify/types/` (new file if needed)
3. Create a transform function in `lib/shopify/transforms/` (new file if needed)
4. Export from `lib/shopify/transforms/index.ts`
5. Use the transform in operations, return domain types to components

## See also

- [GraphQL Operations](../shopify/graphql-operations.md) — Where API calls happen
- [Swap Commerce Provider](../guides/swap-commerce-provider.md) — How to replace Shopify entirely
- [Add New Product Field](../guides/add-new-product-field.md) — End-to-end example
