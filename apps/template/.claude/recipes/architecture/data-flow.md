# Recipe: Data Flow

> Requests flow through lightweight request rewrites, into server components, through Shopify operations, and back via transforms into rendered components.

## When to read this

- Onboarding to the codebase — start here for orientation
- Debugging where data gets lost or transformed incorrectly
- Understanding the full request lifecycle

## Key files

| File | Role |
|------|------|
| `proxy.ts` | Request rewrites and content negotiation |
| `app/` | Page routes (server components) |
| `lib/params.ts` | Current deployment locale helper |
| `lib/shopify/operations/*.ts` | Data fetching + caching |
| `lib/shopify/client.ts` | GraphQL client (`shopifyFetch`) |
| `lib/shopify/fragments.ts` | Reusable GraphQL fragments |
| `lib/shopify/transforms/*.ts` | Shopify → domain type conversion |
| `lib/types.ts` | Domain types used by components |

## How it works

### Full request lifecycle

```
1. Browser request: GET /products/speaker
        ↓
2. proxy.ts middleware
   - Handles markdown negotiation and variant URL rewrites
        ↓
3. Next.js matches: app/products/[handle]/page.tsx
   - params: { handle: "speaker" }
        ↓
4. Page component (async server component)
   - Calls getLocale() to resolve the active deployment locale
   - Calls getProduct("speaker", "en-US")
        ↓
5. Operation (lib/shopify/operations/products.ts)
   - "use cache: remote" + cacheLife("product") + cacheTag("products")
   - Builds GraphQL query using fragments
   - Calls shopifyFetch() with locale context directives
        ↓
6. GraphQL client (lib/shopify/client.ts)
   - POST to Shopify Storefront API
   - Includes X-Shopify-Storefront-Access-Token header
   - Returns raw Shopify response
        ↓
7. Transform (lib/shopify/transforms/product.ts)
   - transformShopifyProductDetails(data.product)
   - Converts Shopify types → ProductDetails domain type
        ↓
8. Back in page component
   - Receives ProductDetails
   - Renders <ProductInfo product={product} />
        ↓
9. Component renders using domain types only
```

### Shopify GraphQL client

The client in `lib/shopify/client.ts` is minimal:

```tsx
export async function shopifyFetch<T>({
  operation,  // Operation name (for logging/caching)
  query,      // GraphQL query string
  variables,  // Query variables
}): Promise<T> { ... }
```

- Sends POST to `https://{store}.myshopify.com/api/2025-01/graphql.json`
- Includes `X-Shopify-Storefront-Access-Token` header
- Supports gzip compression via `Accept-Encoding` header
- Debug logging when `DEBUG_SHOPIFY=true`
- Handles partial errors (returns data + logs warnings)

### Locale in GraphQL

Operations pass locale to Shopify using context directives in the query:

```graphql
query GetProduct($handle: String!) @inContext(country: US, language: EN) {
  product(handle: $handle) { ... }
}
```

The `getCountryCode()` and `getLanguageCode()` helpers from `lib/i18n.ts` convert locale strings to Shopify's format. In the default template, that locale comes from `getLocale()` and reflects the current deployment config rather than a URL prefix.

### Data flow for cart

Cart has a different flow because it involves client-side state:

```
1. Server: getCart() → Cart (from cookie-stored cart ID)
2. Server: <CartProvider initialCart={cart}>
3. Client: useCart() provides optimistic cart state
4. Client: addToCartOptimistic() → optimistic UI update
5. Client: Debounced server action call → addToCartAction()
6. Server: addToCart() → Shopify API → updated Cart
7. Client: Context replaces optimistic state with server response
```

### Data flow for homepage content

The homepage renders hardcoded content structure with dynamic product data:

```
1. app/page.tsx fetches products and collections from Shopify
2. Hero, intro text, and section layout are hardcoded in the page component
3. Product data is passed to ProductCard and TopProductsCarousel components
4. No CMS layer by default — use the enable-shopify-cms skill to add one
```

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Operations must return domain types (from `lib/types.ts`), not raw Shopify responses — components depend on the domain type contract
- [ ] GUARDRAIL: GraphQL queries must reference `.claude/schemas/shopify-storefront.graphql` for field names — never guess Shopify field names
- [ ] GUARDRAIL: Always pass locale context to Shopify queries that return localized data (prices, descriptions) — missing context returns default locale data
- [ ] GUARDRAIL: Do not assume locale comes from the URL in the default template — read it from `getLocale()`

## See also

- [Type Seams](./type-seams.md) — The domain/provider boundary in detail
- [Caching Strategy](./caching-strategy.md) — How operations are cached
- [Locale Configuration](./locale-routing.md) — How locale flows through the request
- [GraphQL Operations](../shopify/graphql-operations.md) — Writing Shopify queries
