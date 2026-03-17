# Recipe: GraphQL Operations

> Shopify data is fetched via GraphQL operations that use fragments, caching, and transforms.

## When to read this

- Writing a new Shopify query or mutation
- Modifying existing product, collection, or cart queries
- Debugging GraphQL errors or missing fields
- Understanding the fragments and how they compose

## Key files

| File | Role |
|------|------|
| `lib/shopify/client.ts` | `shopifyFetch()` — the GraphQL client |
| `lib/shopify/fragments.ts` | Reusable GraphQL fragments (Money, Image, Product, Variant, etc.) |
| `lib/shopify/utils.ts` | `flattenEdges()` — converts Shopify connection types to arrays |
| `lib/shopify/operations/products.ts` | Product queries (getProduct, getProducts, etc.) |
| `lib/shopify/operations/cart.ts` | Cart queries and mutations |
| `lib/shopify/operations/collections.ts` | Collection queries |
| `.claude/schemas/shopify-storefront.graphql` | Storefront API schema reference |

## How it works

### Operation structure

Every operation follows this pattern:

```tsx
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCT_FRAGMENT } from "@/lib/shopify/fragments";
import { TAGS } from "@/lib/constants";
import { transformShopifyProductDetails } from "@/lib/shopify/transforms";

export async function getProduct(handle: string, locale: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag(TAGS.products);

  const data = await shopifyFetch<{ product: ShopifyProduct }>({
    operation: "GetProduct",           // Name for logging
    query: `
      ${PRODUCT_FRAGMENT}
      query GetProduct($handle: String!) @inContext(country: ${getCountryCode(locale)}, language: ${getLanguageCode(locale)}) {
        product(handle: $handle) {
          ...ProductFields
        }
      }
    `,
    variables: { handle },
  });

  return transformShopifyProductDetails(data.product);
}
```

### Fragment hierarchy

Fragments compose from small to large:

```
MONEY_FRAGMENT
  └─ PRODUCT_VARIANT_FRAGMENT (includes MoneyFields)
IMAGE_FRAGMENT
TAXONOMY_CATEGORY_FRAGMENT
METAFIELD_FRAGMENT

PRODUCT_FRAGMENT (includes all above)
  └─ Used for PDP (full product data)

CATEGORY_PRODUCT_FRAGMENT (lighter version)
  └─ Used for grids/listings (minimal product data)
```

**Important**: `PRODUCT_VARIANT_FRAGMENT` includes `MONEY_FRAGMENT` but NOT `IMAGE_FRAGMENT`. The parent fragment (`PRODUCT_FRAGMENT`) includes `IMAGE_FRAGMENT` separately.

### Locale context directives

Shopify returns localized data (prices, descriptions) based on `@inContext`:

```graphql
query GetProduct($handle: String!)
  @inContext(country: US, language: EN) {
  ...
}
```

Use helpers from `lib/i18n.ts`:
- `getCountryCode("en-US")` → `"US"`
- `getLanguageCode("en-US")` → `"EN"`

### Edge flattening

Shopify returns connections as `{ edges: [{ node: T }] }`. Use `flattenEdges()`:

```tsx
import { flattenEdges } from "@/lib/shopify/utils";

const products = flattenEdges(data.collection.products);
// ShopifyEdges<Product> → Product[]
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Always reference `.claude/schemas/shopify-storefront.graphql` when writing queries — never guess field names. Run `bun run .claude/scripts/fetch-shopify-schemas.ts` to update schemas
- [ ] GUARDRAIL: Every cached operation needs `"use cache: remote"` + `cacheLife()` + `cacheTag()` — missing any piece breaks caching or invalidation
- [ ] GUARDRAIL: Use `CATEGORY_PRODUCT_FRAGMENT` for listings and `PRODUCT_FRAGMENT` for PDP — using the full fragment for listings wastes bandwidth and cache space
- [ ] GUARDRAIL: Transform Shopify responses to domain types before returning from operations — never return raw Shopify types to components

## Common modifications

### Adding a new field to product queries

1. Check the schema: `.claude/schemas/shopify-storefront.graphql`
2. Add to the appropriate fragment in `lib/shopify/fragments.ts`
3. Update the Shopify type in `lib/shopify/transforms/product.ts`
4. Update the transform function to map the new field
5. Add the domain type field in `lib/types.ts`

### Writing a new operation

1. Define the GraphQL query using existing fragments where possible
2. Create the function in the appropriate operations file
3. Add cache directives (`"use cache: remote"`, `cacheLife`, `cacheTag`)
4. Call `shopifyFetch` with the query and variables
5. Transform the response to domain types before returning

### Debugging GraphQL errors

Set `DEBUG_SHOPIFY=true` in your `.env` to log all Shopify API calls with timing and variables. The client also logs partial errors as warnings.

## See also

- [Type Seams](../architecture/type-seams.md) — Domain vs Shopify types
- [Caching Strategy](../architecture/caching-strategy.md) — Cache profiles and invalidation
- [Add New Product Field](../guides/add-new-product-field.md) — End-to-end example
