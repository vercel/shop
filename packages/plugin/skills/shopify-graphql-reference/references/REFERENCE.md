# Shopify GraphQL Reference

Use this reference when the task needs detailed guidance beyond the workflow in `SKILL.md`.

Schema validation for this skill comes from the installed `Shopify/shopify-ai-toolkit` plugin. Use it to confirm fields, arguments, enum values, and API boundaries before editing queries or mutations.

## Key files and tools

| Resource | Role |
|------|------|
| `Shopify/shopify-ai-toolkit` | Live Storefront and Customer Account schema inspection |
| `lib/shopify/storefront.ts` | Shared `@shopify/storefront-api-client` instance (`storefront`) |
| `lib/shopify/errors.ts` | `assertStorefrontOk()` response contract |
| `.graphqlrc.ts` + `pnpm codegen` | Validates `#graphql` queries against the live schema; types in `lib/shopify/types/generated/` (gitignored, regenerated at dev/build) |
| `lib/shopify/customer-account.ts` | `customerAccountFetch()` for the separate Customer Account API |
| `lib/shopify/fragments.ts` | Shared `#graphql` fragments (`PRODUCT_FRAGMENT`, `PRODUCT_CARD_FRAGMENT`, money, images, metafields) |
| `lib/shopify/utils.ts` | `flattenEdges()` connection helper |
| `lib/shopify/operations/*.ts` | Query and mutation entry points |
| `lib/shopify/transforms/*.ts` | Shopify-to-domain mapping helpers |
| `lib/types.ts` | Provider-agnostic domain types consumed by components |

## Operation structure

Every read operation should follow this pattern:

```tsx
import { cacheLife, cacheTag } from "next/cache";
import { defaultLocale, getCountryCode, getLanguageCode } from "@/lib/i18n";
import { assertStorefrontOk } from "@/lib/shopify/errors";
import { PRODUCT_FRAGMENT } from "@/lib/shopify/fragments";
import { storefront } from "@/lib/shopify/storefront";
import { transformShopifyProductDetails } from "@/lib/shopify/transforms/product";
import type { ProductDetails } from "@/lib/types";

const GET_PRODUCT_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query GetProduct($handle: String!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
` as const;

export async function getProduct({
  handle,
  locale = defaultLocale,
}: {
  handle: string;
  locale?: string;
}): Promise<ProductDetails | undefined> {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  const response = await storefront.request<{ product: ShopifyProduct }>(GET_PRODUCT_QUERY, {
    variables: {
      handle,
      country: getCountryCode(locale),
      language: getLanguageCode(locale),
    },
  });
  assertStorefrontOk(response, "GetProduct");
  const { data } = response;

  if (!data.product) return undefined;

  return transformShopifyProductDetails(data.product);
}
```

> Tag every query and fragment with `#graphql` and end the declaration with `as const`, then run `pnpm --filter template codegen` — it validates the query against the live schema and fails on unknown fields. Keep documents static: a query built with runtime interpolation can't be parsed, so pass dynamic parts as GraphQL variables or split into two static documents. A raw selection snippet that isn't a valid standalone document must be inlined into the operation, not interpolated (codegen only resolves interpolations of other `#graphql` consts by name).

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

- Always verify fields against the live schema with `shopify-ai-toolkit`.
- Reads need `"use cache: remote"`, `cacheLife(...)`, and `cacheTag(...)`. `"use cache: remote"` uses Vercel's shared Runtime Cache (durable across serverless instances); plain `"use cache"` is per-instance in-memory at runtime and only persists for build-prerendered params.
- Use `PRODUCT_CARD_FRAGMENT` for listings and `PRODUCT_FRAGMENT` for PDP work unless you have a clear reason not to.
- Transform Shopify responses to domain types before returning them from operations.
- Cart mutations must call `invalidateCartCache()`.

## Common modifications

### Add a new field to product queries

1. Check the live Storefront API schema with `shopify-ai-toolkit`.
2. Add the field to the right fragment in `lib/shopify/fragments.ts`.
3. Update the Shopify response type and transform in `lib/shopify/transforms/product.ts`.
4. Add the mapped field to `lib/types.ts` if components need it.

### Write a new read operation

1. Define the `#graphql ... as const` query using existing fragments where possible.
2. Run `pnpm --filter template codegen` to validate it against the live schema.
3. Add `"use cache"`, `cacheLife(...)`, and `cacheTag(...)`; use `"use cache: remote"` for search/filter/sort/cursor reads.
4. Call `storefront.request<ResponseType>(QUERY, { variables })`, then `assertStorefrontOk(response, name)`.
5. Transform the response before returning it.

### Write a mutation

1. Define the `#graphql ... as const` mutation and typed response shape; run codegen.
2. Call `storefront.request` without read-cache directives, then `assertStorefrontOk`.
3. Call `invalidateCartCache()` if cart state changed.
4. Return transformed domain data.

### Debug GraphQL errors

- Set `DEBUG_SHOPIFY=true` in `.env.local`.
- Compare every field and argument against the live schema with `shopify-ai-toolkit`.
- Check whether the operation is using the wrong fragment for the surface.
