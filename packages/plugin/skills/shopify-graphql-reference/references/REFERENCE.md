# Shopify GraphQL Reference

Use this reference when the task needs detailed guidance beyond the workflow in `SKILL.md`.

The canonical schema inputs for this skill live in:

- `references/schemas/shopify-storefront.graphql`
- `references/schemas/shopify-customer.graphql`

Refresh those bundled copies with `scripts/fetch-references.sh` when they are missing or stale.

## Key files

| File | Role |
|------|------|
| `references/schemas/shopify-storefront.graphql` | Bundled Storefront API schema snapshot |
| `references/schemas/shopify-customer.graphql` | Bundled Customer Account API schema snapshot |
| `lib/shopify/client.ts` | `shopifyFetch()` GraphQL client |
| `lib/shopify/fragments.ts` | Shared fragments (`PRODUCT_FRAGMENT`, `PRODUCT_CARD_FRAGMENT`, money, images, metafields) |
| `lib/shopify/utils.ts` | `flattenEdges()` connection helper |
| `lib/shopify/operations/*.ts` | Query and mutation entry points |
| `lib/shopify/transforms/*.ts` | Shopify-to-domain mapping helpers |
| `lib/types.ts` | Provider-agnostic domain types consumed by components |

## Operation structure

Every read operation should follow this pattern:

```tsx
import { cacheLife, cacheTag } from "next/cache";
import { getCountryCode, getLanguageCode } from "@/lib/i18n";
import { TAGS } from "@/lib/constants";
import { shopifyFetch } from "@/lib/shopify/client";
import { PRODUCT_FRAGMENT } from "@/lib/shopify/fragments";
import { transformShopifyProductDetails } from "@/lib/shopify/transforms/product";

export async function getProduct(handle: string, locale: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag(TAGS.products);

  const data = await shopifyFetch<{ product: ShopifyProduct }>({
    operation: "GetProduct",
    query: `
      ${PRODUCT_FRAGMENT}
      query GetProduct($handle: String!)
        @inContext(country: ${getCountryCode(locale)}, language: ${getLanguageCode(locale)}) {
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

## Fragment hierarchy

Fragments compose from small to large:

```text
MONEY_FRAGMENT
  -> PRODUCT_VARIANT_FRAGMENT
IMAGE_FRAGMENT
TAXONOMY_CATEGORY_FRAGMENT
METAFIELD_FRAGMENT

PRODUCT_FRAGMENT
  -> full PDP data

PRODUCT_CARD_FRAGMENT
  -> lighter listing/search data
```

`PRODUCT_VARIANT_FRAGMENT` includes `MONEY_FRAGMENT` but not `IMAGE_FRAGMENT`. Parent fragments pull in image fields separately.

## Locale context

Use `@inContext` for locale-sensitive reads:

```graphql
query GetProduct($handle: String!)
  @inContext(country: US, language: EN) {
  ...
}
```

Use locale helpers instead of hardcoding:

- `getCountryCode("en-US")` -> `"US"`
- `getLanguageCode("en-US")` -> `"EN"`

## Connections and edge flattening

Shopify returns connections as `{ edges: [{ node: T }] }`. Flatten them with `flattenEdges()`:

```tsx
import { flattenEdges } from "@/lib/shopify/utils";

const products = flattenEdges(data.collection.products);
```

## Guardrails

- Always verify fields against `references/schemas/shopify-storefront.graphql`.
- Read operations need `"use cache: remote"`, `cacheLife(...)`, and `cacheTag(...)`.
- Use `PRODUCT_CARD_FRAGMENT` for listings and `PRODUCT_FRAGMENT` for PDP work unless you have a clear reason not to.
- Transform Shopify responses to domain types before returning them from operations.
- Cart mutations must call `invalidateCartCache()`.

## Common modifications

### Add a new field to product queries

1. Check `references/schemas/shopify-storefront.graphql`.
2. Add the field to the right fragment in `lib/shopify/fragments.ts`.
3. Update the Shopify response type and transform in `lib/shopify/transforms/product.ts`.
4. Add the mapped field to `lib/types.ts` if components need it.

### Write a new read operation

1. Define the GraphQL query using existing fragments where possible.
2. Add `"use cache: remote"`, `cacheLife(...)`, and `cacheTag(...)`.
3. Call `shopifyFetch` with the query and variables object.
4. Transform the response before returning it.

### Write a mutation

1. Define the mutation and typed response shape.
2. Call `shopifyFetch` without read-cache directives.
3. Call `invalidateCartCache()` if cart state changed.
4. Return transformed domain data.

### Debug GraphQL errors

- Set `DEBUG_SHOPIFY=true` in `.env.local`.
- Compare every field and argument against `references/schemas/shopify-storefront.graphql`.
- Check whether the operation is using the wrong fragment for the surface.

## Related template references

- `.claude/recipes/architecture/type-seams.md`
- `.claude/recipes/architecture/caching-strategy.md`
- `.claude/recipes/guides/add-new-product-field.md`
