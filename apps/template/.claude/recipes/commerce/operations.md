# Recipe: Commerce Operations

> Operations are async functions that call your provider's API, transform responses into domain types, and apply Next.js cache directives.

## When to read this

- Writing a new commerce provider operation
- Modifying existing product, collection, or cart operations
- Debugging data fetching errors or missing fields
- Understanding the operation → transform → domain type pipeline

## Key files

| File | Role |
|------|------|
| `lib/commerce/providers/<name>/client.ts` | Provider API client (auth, error handling) |
| `lib/commerce/providers/<name>/operations/` | Operation functions (products, cart, collections, search, menu, sitemap) |
| `lib/commerce/providers/<name>/transforms/` | Convert provider responses → domain types |
| `lib/commerce/providers/<name>/types.ts` | Provider-specific API response types (internal only) |
| `lib/commerce/types.ts` | `CommerceProvider` interface — the contract |
| `lib/types.ts` | Domain types that components consume |
| `.claude/schemas/` | Provider API reference (schema snapshots, response examples) |

## How it works

### Operation structure

Every operation follows the same pattern regardless of API protocol:

```tsx
import { cacheLife, cacheTag } from "next/cache";
import { providerFetch } from "../client";
import { transformProductDetails } from "../transforms/product";
import type { ProviderProduct } from "../types";
import { TAGS } from "@/lib/constants";

export async function getProduct(handle: string, locale?: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag(TAGS.products, `product-${handle}`);

  // 1. Call the provider API
  const data = await providerFetch<ProviderProduct>({
    /* provider-specific request details */
  });

  // 2. Transform to domain type and return
  return transformProductDetails(data);
}
```

The pattern is always: **authenticate → request → transform → return**. What varies between providers is how step 1 works.

### The client (`client.ts`)

Each provider implements its own API client. The client handles authentication, request formatting, and error handling. Two common patterns:

**REST provider:**
```tsx
export async function providerFetch<T>(options: {
  endpoint: string;
  method?: string;
  params?: Record<string, string>;
  body?: unknown;
}): Promise<T> {
  const url = new URL(`${API_URL}${options.endpoint}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json() as Promise<T>;
}
```

**GraphQL provider:**
```tsx
export async function providerFetch<T>(options: {
  query: string;
  variables?: Record<string, unknown>;
  operation?: string;
}): Promise<T> {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: options.query, variables: options.variables }),
  });
  const json = await response.json();
  if (json.errors) throw new Error(json.errors.map((e: any) => e.message).join(", "));
  return json.data as T;
}
```

### Locale handling

How locale context is passed depends on the provider:

| Protocol | Common approach |
|----------|----------------|
| REST | Query parameter (`?locale=en-US`) or `Accept-Language` header |
| GraphQL | Context directive (`@inContext(country: US, language: EN)`) or header |
| Headless CMS | Separate endpoint per locale, or locale field in request body |

Use helpers from `lib/i18n.ts`:
- `getCountryCode("en-US")` → `"US"`
- `getLanguageCode("en-US")` → `"EN"`

### Transforms

Transforms convert provider-specific response shapes into domain types. They live in `providers/<name>/transforms/` and are the **only place** where provider types and domain types meet.

```tsx
// transforms/product.ts
export function transformProductDetails(product: ProviderProduct): ProductDetails {
  return {
    id: product.id,
    handle: product.slug,
    title: product.name,
    price: { amount: String(product.price / 100), currencyCode: product.currency },
    // ... map every field to the domain shape
  };
}
```

Key transform responsibilities:
- **Normalize IDs** — components pass IDs opaquely, so format doesn't matter as long as it's consistent
- **Normalize prices** — domain type uses `{ amount: "29.99", currencyCode: "USD" }` (string, not cents)
- **Normalize images** — domain type uses `{ url, altText, width, height }`
- **Handle missing data** — return `[]` for empty arrays, `undefined` for optional fields, never `null`

### Pagination

Different providers paginate differently:

| Pattern | How it works | Domain mapping |
|---------|-------------|----------------|
| Cursor-based | Provider returns `endCursor`, pass as `after` param | Map to `PageInfo.endCursor` |
| Offset-based | Provider returns `total`, use `offset` + `limit` params | Convert to cursor-like `PageInfo` |
| Page-based | Provider returns `totalPages`, use `page` param | Encode page number as cursor string |

The `PageInfo` domain type (`{ hasNextPage, hasPreviousPage, endCursor, startCursor }`) is designed for cursor-based pagination. For offset/page providers, encode the page state into the cursor string and decode it in `getProducts`/`getCollectionProducts`.

## Cache directives

Every read operation must use Next.js cache directives. These are framework-level and protocol-agnostic:

```tsx
export async function getProduct(handle: string, locale?: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);
  // ...
}
```

**Standard cache tags:**

| Tag | Used by | Invalidated when |
|-----|---------|-----------------|
| `"products"` | All product operations | Product created/updated/deleted |
| `"product-{handle}"` | Single product | That product updated |
| `"collections"` | Collection operations | Collection updated |
| `"cart"` | Cart operations | Every cart mutation (via `invalidateCartCache()`) |
| `"menus"` | Menu/navigation | Menu structure changed |

**Cart is special:** use `cacheLife("seconds")` for cart reads, `cacheLife("max")` for everything else.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Every cached operation needs `"use cache: remote"` + `cacheLife()` + `cacheTag()` — missing any piece breaks caching or invalidation
- [ ] GUARDRAIL: Transform provider responses to domain types before returning — never return raw provider types to components
- [ ] GUARDRAIL: Provider-specific code stays inside `lib/commerce/providers/<name>/` — nothing outside that directory should import from it
- [ ] GUARDRAIL: Reference `.claude/schemas/` or your provider's API docs when writing requests — never guess field names or endpoints

## Common modifications

### Adding a new field to product operations

1. Check your provider's API docs or schema in `.claude/schemas/`
2. Update your API request to include the new field (add to query, endpoint, or params)
3. Update the provider response type in `providers/<name>/types.ts`
4. Update the transform function to map the new field to the domain type
5. Add the domain type field in `lib/types.ts`

### Writing a new operation

1. Create the function in the appropriate operations file
2. Add cache directives (`"use cache: remote"`, `cacheLife`, `cacheTag`)
3. Call `providerFetch` with the appropriate request
4. Transform the response to domain types before returning

### Debugging

Set `DEBUG_COMMERCE=true` in your `.env` to log all provider API calls with timing. The client should log request details and partial errors as warnings.

## See also

- [Type Seams](../architecture/type-seams.md) — Domain vs provider types
- [Caching Strategy](../architecture/caching-strategy.md) — Cache profiles and invalidation
- [Add New Product Field](../guides/add-new-product-field.md) — End-to-end example
