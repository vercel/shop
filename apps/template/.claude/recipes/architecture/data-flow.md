# Recipe: Data Flow

> Requests flow through lightweight request rewrites, into server components, through commerce operations, and back via transforms into rendered components.

## When to read this

- Onboarding to the codebase — start here for orientation
- Debugging where data gets lost or transformed incorrectly
- Understanding the full request lifecycle

## Key files

| File | Role |
|------|------|
| `app/` | Page routes (server components) |
| `lib/params.ts` | Current deployment locale helper |
| `lib/commerce/operations/*.ts` | Data fetching + caching |
| `lib/commerce/providers/<name>/client.ts` | Provider API client (auth, error handling) |
| `lib/commerce/transforms/*.ts` | Provider response → domain type conversion |
| `lib/types.ts` | Domain types used by components |

## How it works

### Full request lifecycle

```
1. Browser request: GET /products/speaker
        ↓
2. Next.js matches: app/products/[handle]/page.tsx
   - params: { handle: "speaker" }
        ↓
4. Page component (async server component)
   - Calls getLocale() to resolve the active deployment locale
   - Calls getProduct("speaker", "en-US")
        ↓
5. Operation (lib/commerce/operations/products.ts)
   - "use cache: remote" + cacheLife("product") + cacheTag("products")
   - Builds the API request (query, endpoint, or params depending on protocol)
   - Calls the provider client with locale context
        ↓
6. Provider client (lib/commerce/providers/<name>/client.ts)
   - Sends request to the commerce provider API
   - Includes authentication headers
   - Returns raw provider response
        ↓
7. Transform (lib/commerce/providers/<name>/transforms/product.ts)
   - transformProductDetails(data.product)
   - Converts provider types → ProductDetails domain type
        ↓
8. Back in page component
   - Receives ProductDetails
   - Renders <ProductInfo product={product} />
        ↓
9. Component renders using domain types only
```

### Commerce API client

The client in `lib/commerce/providers/<name>/client.ts` handles communication with the commerce provider:

```tsx
export async function providerFetch<T>(options: {
  endpoint?: string;      // REST endpoint path
  query?: string;         // GraphQL query string
  variables?: Record<string, unknown>;
  method?: string;        // HTTP method (default: GET for REST, POST for GraphQL)
}): Promise<T> { ... }
```

- Sends requests to the commerce provider's API endpoint
- Includes authentication headers
- Supports gzip compression via `Accept-Encoding` header
- Debug logging when `DEBUG_COMMERCE=true`
- Handles partial errors (returns data + logs warnings)

### Locale in queries

Operations pass locale to the commerce provider using the appropriate mechanism for the protocol — query parameters, request headers, or context directives depending on the provider.

The `getCountryCode()` and `getLanguageCode()` helpers from `lib/i18n.ts` convert locale strings to the provider's expected format. In the default template, that locale comes from `getLocale()` and reflects the current deployment config rather than a URL prefix.

### Data flow for cart

Cart has a different flow because it involves client-side state:

```
1. Server: getCart() → Cart (from cookie-stored cart ID)
2. Server: <CartProvider initialCart={cart}>
3. Client: useCart() provides optimistic cart state
4. Client: addToCartOptimistic() → optimistic UI update
5. Client: Debounced server action call → addToCartAction()
6. Server: addToCart() → Commerce API → updated Cart
7. Client: Context replaces optimistic state with server response
```

### Data flow for homepage content

The homepage renders hardcoded content structure with dynamic product data:

```
1. app/page.tsx fetches products and collections from the commerce provider
2. Hero, intro text, and section layout are hardcoded in the page component
3. Product data is passed to ProductCard and TopProductsCarousel components
4. No CMS layer by default — use the enable CMS skill to add one
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Operations must return domain types (from `lib/types.ts`), not raw provider responses — components depend on the domain type contract
- [ ] GUARDRAIL: Always reference `.claude/schemas/` when writing provider-specific queries — never guess field names
- [ ] GUARDRAIL: Always pass locale context to queries that return localized data (prices, descriptions) — missing context returns default locale data
- [ ] GUARDRAIL: Do not assume locale comes from the URL in the default template — read it from `getLocale()`

## See also

- [Type Seams](./type-seams.md) — The domain/provider boundary in detail
- [Caching Strategy](./caching-strategy.md) — How operations are cached
- [Locale Configuration](./locale-routing.md) — How locale flows through the request
- [Commerce Operations](../commerce/operations.md) — Operation patterns and caching
