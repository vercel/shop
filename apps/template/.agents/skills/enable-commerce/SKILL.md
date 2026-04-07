---
name: enable-commerce
description: Implement a commerce backend (SAP Commerce Cloud, BigCommerce, commercetools, Medusa, Saleor, etc.) against the typed CommerceProvider contract. Generates client, operations, and transforms that return domain types. The template is completely provider-agnostic -- this skill wires it to a real backend.
---

# Enable Commerce

The shop template ships with a **provider-agnostic commerce layer**. Every route, component, agent tool, MCP endpoint, and UCP handler imports from `@/lib/commerce` and consumes domain types from `@/lib/types`. Nothing knows about any specific backend.

This skill implements a commerce backend against that contract. The coding agent asks which platform, reads the platform's API documentation, and generates the full implementation.

## Step 0 — Ask the user

Before writing any code, ask:

1. **Which commerce platform?** (SAP Commerce Cloud, BigCommerce, commercetools, Medusa, Saleor, custom, etc.)
2. **API credentials** — what env vars are needed? Get the names and have the user fill `.env.local`.
3. **API documentation** — for known platforms, you'll find the docs yourself. For custom backends, ask: "Do you have an OpenAPI/Swagger spec URL, a local spec file, or written API docs I can read?"
4. **Any special requirements?** (B2B pricing, multi-currency, custom checkout flow, etc.)

## Step 1 — Read the contract

Before implementing anything, read these files in order:

1. **`lib/commerce/types.ts`** — the `CommerceProvider` interface. Every operation signature, every param, every return type.
2. **`lib/types.ts`** — every domain type in full. This is the shape contract. Your transforms must produce these exact shapes.
3. **`lib/commerce/providers/stub.ts`** — the stub you're replacing. Lists every operation name.
4. **`lib/cart-cache.ts`** — the cache invalidation function your cart mutations must call.
5. **`lib/constants.ts`** — cache tag names (`TAGS.products`, `TAGS.collections`, `TAGS.cart`).
6. **`lib/i18n.ts`** — how locale works (`Locale` type, `defaultLocale`, `getCountryCode`, `getLanguageCode`).

## Step 1.5 — Explore the provider's API before writing any code

This step is critical. Do NOT skip it. Implementing transforms against assumed data shapes leads to broken code. You must see real responses first.

### a) Read the provider's API documentation

**Known platforms:** Use `WebSearch` and `WebFetch` to read the official API reference.

**Custom backends with an OpenAPI/Swagger spec:** Fetch and read the spec first — it's the fastest way to understand what endpoints exist, what they accept, and what they return:

```bash
# Fetch remote spec
curl -s https://api.example.com/openapi.json | jq . > .claude/schemas/openapi.json

# Or read a local spec the user provides
# cat path/to/swagger.yaml
```

Read the spec to build a mental map of endpoints → CommerceProvider operations:
- Which endpoint returns products? What query params does it support (pagination, filtering, locale)?
- Is there a cart/session API, or is checkout handled externally?
- How does auth work (API key header, OAuth, basic auth)?
- What does the product response shape look like — are variants nested or flat?

**Custom backends without a spec:** Ask the user for a list of endpoints and make exploratory curl calls (see step b below).

For any provider, understand:
- Authentication flow (OAuth2, API keys, bearer tokens, etc.)
- How products are structured (variants, options, pricing model, images)
- How categories/collections work (flat list vs tree, parent references)
- How the cart/checkout API works (create, add items, what IDs are used)
- How search/filtering works (full-text search, facets, available filters)
- How pagination works (cursor-based, offset-based, page-based)
- How prices are represented (cents vs decimals, currency handling, multi-currency)
- How localized content works (field-level localization, locale parameter, etc.)

### b) Make test API calls to see real response shapes

Use `Bash` with `curl` to make real API requests against the user's credentials. This is non-negotiable — you must see the actual data before writing transforms.

**Minimum exploration (do all of these):**

```bash
# 1. Authenticate — get a token or verify the API key works
# 2. Fetch a single product — inspect EVERY field, especially:
#    - How product names/descriptions are structured (plain string? localized object?)
#    - How variants relate to products (embedded? separate? what's the variant ID format?)
#    - How prices work (cents? decimals? multi-currency? discounts?)
#    - How images are structured (URL format, dimensions, alt text)
#    - How options/attributes work (color, size — how are they represented?)
# 3. Fetch categories/collections — inspect hierarchy, slug format, parent references
# 4. Create a test cart — see what the cart response looks like
# 5. Check if search endpoint works — some providers require activation
```

**Print and study the raw JSON.** Pay attention to:
- **ID formats** — are they UUIDs, numeric, GIDs, base64? Components pass these opaquely.
- **Price format** — cents (integer) vs decimal (string)? How many fraction digits? What about multi-currency?
- **Localized fields** — `Record<locale, string>` vs plain string? What locale keys exist in the data?
- **Image URLs** — what CDN hostname? (You'll need to add it to `next.config.ts`)
- **Variant structure** — how do variants encode options? Are they attributes? Separate option types?
- **Availability** — how does the API indicate in-stock vs out-of-stock?

### c) Document what you learned

Before writing any code, write a brief internal comment in your `types.ts` file documenting the key mappings you discovered:

```ts
// Provider API observations (example — yours will differ):
// - Products: title is a plain string, descriptions are HTML
// - Prices: integer cents with a "currency" field — divide by 100 for domain Money.amount
// - Variant IDs: UUIDs like "a1b2c3d4-..." — pass as-is to cart API
// - Images: hosted on cdn.provider.com, response includes { src, width, height, alt }
// - Categories: flat list with parentId references — need to build tree for megamenu
// - Cart: session-based — cart ID returned on create, no versioning
// - Search: full-text via /search?q=..., facets returned as separate "aggregations" object
```

This prevents you from guessing and building transforms against wrong assumptions.

## Step 2 — Scaffold the provider

Create the provider directory:

```
lib/commerce/providers/<name>/
  index.ts          # Exports the CommerceProvider object
  client.ts         # API client (fetch wrapper, auth, error handling)
  operations/
    products.ts     # Product operations + filter param builder
    cart.ts         # All cart operations
    collections.ts  # Collection operations
    search.ts       # Predictive search
    menu.ts         # Navigation menu + megamenu builder
    sitemap.ts      # Product handle enumeration
  transforms/
    product.ts      # API response → ProductDetails / ProductCard
    cart.ts         # API response → Cart
    collection.ts   # API response → Collection
    filters.ts      # API response → Filter[]
    search.ts       # API response → PredictiveSearchResult
  types.ts          # Provider-specific API response types (INTERNAL ONLY)
```

### The client (`client.ts`)

```ts
const API_URL = process.env.<PROVIDER>_API_URL!;
const API_KEY = process.env.<PROVIDER>_API_KEY!;

export async function providerFetch<T>(options: {
  endpoint: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<T> {
  const { endpoint, method = "GET", body, headers = {} } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Commerce API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
```

### The provider export (`index.ts`)

```ts
import type { CommerceProvider } from "../../types";
// import all operation functions...

export const <name>Provider: CommerceProvider = {
  products: { getProduct, getProducts, getCollectionProducts, ... },
  cart: { getCart, createCart, addToCart, ... },
  collections: { getCollections, getCollection },
  search: { predictiveSearch },
  menu: { getMenu, getMegamenuData },
  cms: { getLocalMarketingPage, getAllLocalMarketingPageSlugs },
  sitemap: { getAllProductHandles },
};
```

## Step 3 — Wire it in

Replace the stub in `lib/commerce/index.ts`:

```ts
import { <name>Provider } from "./providers/<name>";
export const commerce = <name>Provider;
```

Add your CDN hostname to `next.config.ts` image remotePatterns:

```ts
remotePatterns: [
  { hostname: "your-cdn.example.com", protocol: "https" },
],
```

Add env vars to `.env.example`:

```env
# Commerce Provider — <Name>
<PROVIDER>_API_URL=
<PROVIDER>_API_KEY=
# ... provider-specific vars
```

## Step 4 — Implement and test incrementally

Do NOT implement all operations at once then test. Implement in this order, testing after each group:

### Group 1: Products (get the homepage working)
1. Implement `client.ts` (auth + fetch)
2. Implement `types.ts` (provider response types from your Step 1.5 exploration)
3. Implement `transforms/product.ts` (the hardest transform — get this right first)
4. Implement `getProduct` and `getProducts`
5. Wire the provider in `lib/commerce/index.ts` (even with stubs for other operations)
6. **Test:** Run `pnpm dev`, load the homepage. Do products appear? Are prices correct? Images loading?
7. **Fix issues before continuing.** The product transform is the foundation — everything depends on it.

### Group 2: Collections + Navigation (get browsing working)
1. Implement `transforms/collection.ts` and collection operations
2. Implement menu operations (build nav from categories)
3. **Test:** Click navigation links. Do collection pages load? Does the megamenu render?

### Group 3: Search (get search working)
1. Implement `predictiveSearch`
2. Implement filter transforms if the provider supports facets
3. **Test:** Type in the search bar. Do results appear? Try the search page.

### Group 4: Cart (get buying working)
1. Implement `transforms/cart.ts` and all cart operations
2. Pay special attention to:
   - How your variant IDs map to the cart API's expected format
   - Cookie read/write for `"cartId"`
   - Calling `invalidateCartCache()` after every mutation
3. **Test:** Add to cart, view cart, update quantity, remove item. Check the cart icon badge updates.

### Group 5: Remaining operations
1. Recommendations, batch fetches, sitemap, CMS
2. **Test:** PDP "You might also like", sitemap at `/sitemap.xml`

**After each group, check the dev server console for errors.** Fix them before moving on. A broken product transform will cascade into broken cart, broken search, broken everything.

---

## The full contract — every operation in detail

### Products

#### `getProduct(handle: string, locale?: string): Promise<ProductDetails>`

Fetch a single product by its URL-friendly handle. This is the PDP (product detail page) data source.

**Must return a complete `ProductDetails`:**

```ts
{
  // Identity
  id: string                           // Provider's unique product ID
  handle: string                       // URL slug (e.g. "blue-running-shoes")
  title: string                        // Display name

  // Pricing
  price: Money                         // { amount: "29.99", currencyCode: "USD" }
  compareAtPrice?: Money               // Original price if on sale
  priceRange: {
    minVariantPrice: Money             // Lowest variant price
    maxVariantPrice: Money             // Highest variant price
  }
  currencyCode: string                 // e.g. "USD"

  // Availability
  availableForSale: boolean            // true if ANY variant is in stock

  // Content
  description: string                  // Plain text
  descriptionHtml: string              // HTML (rendered in PDP)
  tags: string[]                       // Product tags
  vendor?: string                      // Brand/vendor name
  manufacturerName: string             // Manufacturer (can be same as vendor)

  // Media
  featuredImage: Image | null          // Primary image { url, altText, width, height }
  images: Image[]                      // All product images
  videos: Video[]                      // Product videos { url, previewImage, width, height }

  // Variants & options
  variants: ProductVariant[]           // Every variant with id, title, price, availability, image
  options: ProductOption[]             // Option names + values (Size, Color, etc.) with swatches
  defaultVariantId?: string            // First available variant's ID
  defaultVariantSelectedOptions?: SelectedOption[]  // Its selected options

  // Categorization
  category?: Category | null           // { id, name, ancestors: Category[] }
  categoryId?: string
  collectionHandles: string[]          // Which collections this product belongs to

  // SEO
  seo: SEO                            // { title, description }

  // Metadata
  updatedAt: string                    // ISO date string
  metafields?: Metafield[]            // { key, label, value } — custom attributes
}
```

**Critical details:**
- `price` should be the lowest variant price (same as `priceRange.minVariantPrice`)
- `variants` must include `selectedOptions: SelectedOption[]` on each variant — the variant picker depends on this
- `options[].values[].swatch` powers color swatches (set `{ color: "#hex" }` or `{ image: "url" }`)
- `images` should include all product images; variant-specific images are matched by URL
- Throw an error if the product is not found — the route handles 404

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("products", `product-${handle}`);
```

#### `getProducts(params): Promise<{ products, total, pageInfo, filters, priceRange? }>`

Search and list products. Used by the search page and filtered product grids.

**Params:**
```ts
{
  query?: string              // Free-text search query
  collection?: string         // Filter to a collection handle
  sortKey?: string            // One of: "best-matches", "price-low-to-high", "price-high-to-low"
  limit?: number              // Page size (default 50)
  cursor?: string             // Pagination cursor (opaque string from pageInfo)
  filters?: ProductFilterInput[]  // Faceted filters
  locale?: string
}
```

**Must return:**
```ts
{
  products: ProductDetails[]   // Full product data (components call toProductCard() to slim down)
  total: number                // Total matching products (for "N results" display)
  pageInfo: PageInfo           // { hasNextPage, hasPreviousPage, endCursor, startCursor }
  filters: Filter[]            // Available facet filters, PRE-TRANSFORMED to domain Filter type
  priceRange?: PriceRange      // { min, max } for price slider
}
```

**Filter transformation is critical.** The provider must transform its raw filter/facet response into `Filter[]` before returning. Components render `Filter[]` directly — they never see provider-specific filter formats.

Each `Filter` must have:
```ts
{
  id: string          // Stable filter identifier
  label: string       // Display name (e.g. "Size", "Color", "Brand")
  type: "list" | "price" | "boolean"
  paramKey: string    // URL search param key (e.g. "size", "color", "vendor")
  values: FilterValue[]  // { id, label, value, count }
}
```

The `paramKey` determines the URL parameter name. The filter sidebar reads/writes these params.

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("products");
```

#### `getCollectionProducts(params): Promise<{ products, pageInfo, filters, priceRange? }>`

Same as `getProducts` but scoped to a single collection. No `query` or `total` — the collection page doesn't show total counts.

**Params:**
```ts
{
  collection: string           // Collection handle (required)
  limit?: number
  sortKey?: string
  cursor?: string
  filters?: ProductFilterInput[]
  locale?: string
}
```

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("products", "collections", `collection-${params.collection}`);
```

#### `getProductRecommendations(handle: string, locale?: string): Promise<ProductDetails[]>`

Return related/recommended products. Used in PDP "You might also like" and cart upsell.

Return an empty array if the provider doesn't support recommendations — never throw.

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("products", `recommendations-${handle}`);
```

#### `getProductById(id: string, locale?: string): Promise<ProductDetails>`

Fetch by the provider's native ID. Used by CMS content sections that reference products by ID.

Throw if not found.

#### `getProductsByIds(ids: string[], locale?: string): Promise<ProductDetails[]>`

Batch fetch. **Preserve input order.** Return only found products (skip missing, don't throw). Used by CMS sections with product lists.

#### `getProductsByHandles(handles: string[], locale?: string): Promise<ProductDetails[]>`

Same as `getProductsByIds` but by handle. **Preserve input order.**

#### `buildProductFiltersFromParams(searchParams): ProductFilterInput[]`

Convert URL search params to `ProductFilterInput[]`. This is a pure function (no API call).

**Standard param mapping:**

| URL param | ProductFilterInput field |
|-----------|------------------------|
| `size=M` | `{ option: { name: "Size", value: "M" } }` |
| `color=Blue` | `{ option: { name: "Color", value: "Blue" } }` |
| `vendor=Nike` | `{ vendor: "Nike" }` |
| `type=Shoes` | `{ productType: "Shoes" }` |
| `price_min=10&price_max=50` | `{ price: { min: 10, max: 50 } }` |
| `available=true` | `{ available: true }` |
| `tag=sale` | `{ tag: "sale" }` |
| `meta_custom_material=Cotton` | `{ metafield: { namespace: "custom", key: "material", value: "Cotton" } }` |

Multiple values for the same param create multiple filter inputs (e.g. `size=M&size=L` → two inputs).

---

### Cart

**Critical rule:** Every cart mutation must call `invalidateCartCache()` from `@/lib/cart-cache` after a successful operation. The UI uses optimistic updates and cache tags — without invalidation, stale data persists.

```ts
import { invalidateCartCache } from "@/lib/cart-cache";
```

#### Cart ID cookie

The cart ID is stored in a cookie named `"cartId"`. Operations that need the cart ID should:

```ts
import { cookies } from "next/headers";

// Read cart ID
const cartId = (await cookies()).get("cartId")?.value;

// Write cart ID (after creating a new cart)
(await cookies()).set("cartId", cart.id, {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
});
```

#### `getCart(cartId?: string): Promise<Cart | undefined>`

Fetch the current cart. If no `cartId` is passed, read from the cookie.

**Must return `Cart`:**
```ts
{
  id: string | undefined              // Cart/session ID
  checkoutUrl: string                  // Full URL to provider's checkout page
  totalQuantity: number                // Sum of all line quantities
  note: string | null                  // Customer note/instructions
  cost: {
    subtotalAmount: Money              // Before tax/shipping
    totalAmount: Money                 // Final total
    totalTaxAmount: Money              // Tax amount (can be { amount: "0", currencyCode })
  }
  lines: CartLine[]                    // Line items (see below)
  shippingCost: Money | null           // Shipping cost if calculated
}
```

**Each `CartLine`:**
```ts
{
  id: string | undefined               // Line item ID (used for update/remove)
  quantity: number
  cost: { totalAmount: Money }          // Line total (price * quantity)
  merchandise: {
    id: string                          // Variant ID
    title: string                       // Variant title (e.g. "Medium / Blue")
    price?: Money                       // Unit price
    selectedOptions: SelectedOption[]   // [{ name: "Size", value: "M" }, ...]
    product: {
      id: string
      handle: string                    // For linking back to PDP
      title: string                     // Product title
      featuredImage: Image              // { url, altText, width, height } — required for cart display
    }
  }
}
```

**Cache directive:**
```ts
"use cache: remote";
cacheLife("seconds");    // Cart data should be fresh
cacheTag("cart");
```

#### `createCart(locale?: string): Promise<Cart>`

Create a new cart AND set the `"cartId"` cookie. Return the new cart.

#### `createCartWithoutCookie(locale?: string): Promise<Cart>`

Create a new cart WITHOUT setting a cookie. Used by UCP/API endpoints that manage cart IDs externally.

#### `addToCart(lines, cartId?, locale?): Promise<Cart>`

Add items. `lines` is `[{ merchandiseId: string, quantity: number }]` where `merchandiseId` is the variant ID.

If no `cartId`, read from cookie. After success, call `invalidateCartCache()`.

#### `updateCart(lines, cartIdOverride?): Promise<Cart>`

Update line item quantities. `lines` is `[{ id: string, merchandiseId: string, quantity: number }]` where `id` is the line item ID from `CartLine.id`.

After success, call `invalidateCartCache()`.

#### `removeFromCart(lineIds, cartIdOverride?): Promise<Cart>`

Remove line items by their IDs. After success, call `invalidateCartCache()`.

#### `updateCartBuyerIdentity(locale, countryCode?): Promise<Cart | undefined>`

Update the buyer's locale/country on the cart. Used when locale changes. Can return `undefined` if no cart exists.

#### `linkCartToCustomer(customerAccessToken, cartIdOverride?): Promise<Cart | undefined>`

Associate the cart with an authenticated customer. Used after login.

#### `updateCartNote(note, cartIdOverride?): Promise<Cart | undefined>`

Set or update the order note. After success, call `invalidateCartCache()`.

#### Delivery operations

These are optional. If the provider doesn't support delivery address management on the cart, return sensible defaults:

- `getCartSelectableAddressId()` → `undefined`
- `addCartDeliveryAddress(address)` → `undefined`
- `getCartDeliveryOptions()` → `[]`
- `updateCartDeliveryAddress(addressId, address)` → `undefined`

---

### Collections

#### `getCollections(locale?: string): Promise<Collection[]>`

Return all collections/categories.

**Each `Collection`:**
```ts
{
  handle: string          // URL slug
  title: string
  description: string
  image?: Image | null    // Collection banner image
  seo: SEO               // { title, description }
  path: string            // Full URL path (e.g. "/collections/shoes")
  updatedAt: string       // ISO date
}
```

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("collections");
```

#### `getCollection(handle, locale?): Promise<Collection | undefined>`

Fetch a single collection. Return `undefined` if not found — don't throw.

---

### Search

#### `predictiveSearch(query, locale?, limit?): Promise<PredictiveSearchResult>`

Typeahead search returning products, collections, and query suggestions.

```ts
{
  products: PredictiveSearchProduct[]    // { id, handle, title, featuredImage, price, compareAtPrice?, vendor?, availableForSale }
  collections: PredictiveSearchCollection[]  // { handle, title }
  queries: SearchSuggestion[]            // { text, styledText } — styledText may contain <b> tags
}
```

Default limit is 4. Return empty arrays if no results — never throw.

---

### Navigation

#### `getMenu(handle: string, locale?: string): Promise<NavigationMenu | null>`

Fetch a navigation menu by handle. Standard handles used by the template:
- `"main-menu"` — primary header navigation
- `"footer"` — footer link groups
- `"quick-links"` — top bar quick links

**`NavigationMenu` structure:**
```ts
{
  id: string
  handle: string
  title: string
  items: NavigationMenuItem[]   // Recursive
}
```

**Each `NavigationMenuItem`:**
```ts
{
  id: string
  title: string
  url: string          // Relative ("/collections/shoes") or absolute ("https://...")
  type?: string        // Optional, e.g. "collection", "product", "page", "link"
  items: NavigationMenuItem[]  // Nested children (recursive)
}
```

Components detect external links by checking `url.startsWith("http")`.

Return `null` if the menu doesn't exist.

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("menus");
```

#### `getMegamenuData(locale?: string): Promise<MegamenuData>`

Build hierarchical megamenu data from the main menu. The typical implementation fetches `getMenu("main-menu")` and restructures it into the 3-level hierarchy:

```ts
{
  items: MegamenuItem[]   // Top-level nav items (e.g. "Women", "Men", "Kids")
}
```

**Each `MegamenuItem`:**
```ts
{
  id: string
  label: string              // Display text
  href: string | null        // Link URL
  panels: MegamenuPanel[]    // Dropdown panels
}
```

**Each `MegamenuPanel`:**
```ts
{
  id: string
  header: string             // Panel heading (e.g. "Shoes")
  href: string | null        // Link for the heading
  categories: MegamenuCategory[]  // Items within the panel
}
```

**Each `MegamenuCategory`:**
```ts
{
  href: string               // Link URL
  title: string              // Display text
}
```

**Mapping from menu → megamenu:**
- Level 1 menu items → `MegamenuItem` (id, label=title, href=url)
- Level 2 menu items → `MegamenuPanel` (id, header=title, href=url)
- Level 3 menu items → `MegamenuCategory` (href=url, title=title)

Return `{ items: [] }` if the main menu doesn't exist or is empty.

---

### CMS

#### `getLocalMarketingPage(slug, locale): Promise<MarketingPage | null>`

The default implementation uses a local page registry (no external CMS). You can keep this as-is from `lib/content/pages.ts`, or wire it to the provider's CMS.

#### `getAllLocalMarketingPageSlugs(): Array<{ slug: string; locale: Locale }>`

Return all marketing page slugs for sitemap generation. Default returns from the local registry.

---

### Sitemap

#### `getAllProductHandles(): Promise<Array<{ handle: string; updatedAt: string }>>`

Return ALL product handles with their last-updated timestamps. Used by `app/sitemap.ts` to generate the product sitemap.

Paginate through the provider's API if needed — return the complete list.

**Cache directive:**
```ts
"use cache: remote";
cacheLife("max");
cacheTag("products");
```

---

## Cache strategy

Every read operation must use Next.js cache directives:

```ts
import { cacheLife, cacheTag } from "next/cache";

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
| `"collections"` | Collection operations | Collection created/updated/deleted |
| `"collection-{handle}"` | Single collection | That collection updated |
| `"cart"` | Cart operations | Every cart mutation (via `invalidateCartCache()`) |
| `"menus"` | Menu/navigation | Menu structure changed |
| `"cms-content"` | CMS pages | Page content updated |

**Cart is special:** use `cacheLife("seconds")` for cart reads (must be fresh), `cacheLife("max")` for everything else.

---

## Webhook / cache invalidation

Create `app/api/webhooks/<provider>/route.ts`:

```ts
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  // 1. Verify webhook signature from the provider
  const signature = request.headers.get("x-<provider>-signature");
  // ... verify

  // 2. Parse the event
  const event = await request.json();

  // 3. Invalidate relevant cache tags
  switch (event.type) {
    case "product.updated":
    case "product.created":
    case "product.deleted":
      revalidateTag("products");
      if (event.handle) revalidateTag(`product-${event.handle}`);
      break;
    case "collection.updated":
      revalidateTag("collections");
      if (event.handle) revalidateTag(`collection-${event.handle}`);
      break;
    // ... other event types
  }

  return new Response("OK");
}
```

---

## What components actually read

This section documents which fields components actually access — if a field is listed here, it **must** be populated correctly.

### Product cards (grids, search results, carousels)

```
handle, title, featuredImage.{url, altText}, price.{amount, currencyCode},
compareAtPrice?.{amount, currencyCode}, availableForSale, defaultVariantId,
defaultVariantSelectedOptions
```

### Product detail page

```
All ProductCard fields, plus:
description, descriptionHtml, images[], videos[], variants[].{id, title,
availableForSale, price, compareAtPrice, selectedOptions[], image},
options[].{id, name, values[].{id, name, swatch}}, tags[], seo,
category?.{name, ancestors}, priceRange.{minVariantPrice, maxVariantPrice},
collectionHandles[], metafields[]
```

### Cart display

```
cart.{id, checkoutUrl, totalQuantity, note, cost.{subtotalAmount,
totalAmount, totalTaxAmount}, shippingCost}
lines[].{id, quantity, cost.totalAmount, merchandise.{id, title, price,
selectedOptions, product.{id, handle, title, featuredImage.{url, altText}}}}
```

### Navigation menus

```
menu.{id, handle, title, items[].{id, title, url, items[]}}
```

### Megamenu

```
items[].{id, label, href, panels[].{id, header, href, categories[].{href, title}}}
```

### Filters

```
filters[].{id, label, type, paramKey, values[].{id, label, value, count}}
priceRange?.{min, max}
```

### Predictive search

```
products[].{id, handle, title, featuredImage, price, vendor, availableForSale}
collections[].{handle, title}
queries[].{text, styledText}
```

---

## Environment variables

Add to `.env.example`:

```env
# Commerce Provider — <Name>
# Required for storefront operations
<PROVIDER>_API_URL="https://api.example.com/v1"
<PROVIDER>_API_KEY="your-api-key"

# Optional — webhook secret for cache invalidation
<PROVIDER>_WEBHOOK_SECRET="your-webhook-secret"

# Store display name (shown in header, metadata, etc.)
NEXT_PUBLIC_SITE_NAME="Your Store Name"
```

---

## Guardrails

1. **Return exact domain types.** Components import from `@/lib/types` and expect those shapes. Do not add extra fields, do not omit required fields.

2. **Never leak provider types.** All provider-specific types stay inside `lib/commerce/providers/<name>/`. Nothing outside that directory should import from it.

3. **Pre-transform filters.** Operations must return `Filter[]`, not raw provider facets. The filter sidebar renders `Filter[]` directly.

4. **Call `invalidateCartCache()` after every cart mutation.** This is the most common bug. Without it, the cart icon badge and cart page show stale data.

5. **Handle missing locale gracefully.** Fall back to `defaultLocale` — never throw on unsupported locale.

6. **Preserve order for batch operations.** `getProductsByIds` and `getProductsByHandles` must return results in the same order as the input array.

7. **Cart `checkoutUrl` must be a valid full URL.** The "Checkout" button navigates to this URL directly.

8. **Cart `featuredImage` on merchandise.product is required.** The cart drawer displays product images — if missing, the cart UI breaks. Use a placeholder if the provider doesn't return images in cart responses.

9. **Money amounts are strings.** Always `{ amount: "29.99", currencyCode: "USD" }`, not numbers.

10. **Empty arrays, not null.** For `variants`, `options`, `images`, `videos`, `tags`, `lines`, `filters` — return `[]` not `null` or `undefined`.

11. **Add CDN hostname to `next.config.ts`** `images.remotePatterns` or images will fail to load.

12. **Add all user-visible strings to ALL locale files** (`en.json`, `de-DE.json`, `fr-FR.json`, `nl-NL.json`, `es-ES.json`).

## Verification

After implementation, verify:

1. `pnpm build` passes with no type errors
2. Homepage loads with featured products
3. Search returns results with working filters
4. Collection pages load with products and faceted filters
5. Cart add/update/remove works with optimistic UI
6. Checkout button navigates to provider's checkout
7. Navigation menus render in header and footer
8. Product detail page shows variants, images, and option picker
9. Predictive search returns typeahead results
10. `grep -r "@/lib/commerce/providers/" --include="*.ts" --include="*.tsx" app/ components/ lib/commerce/types.ts lib/commerce/index.ts` returns zero results outside the provider directory
