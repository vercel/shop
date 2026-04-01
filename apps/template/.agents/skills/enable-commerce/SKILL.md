---
name: enable-commerce
description: Implement a commerce backend (Shopify, SAP Commerce Cloud, BigCommerce, commercetools, Medusa, Saleor, etc.) against the typed CommerceProvider contract. Generates client, operations, and transforms that return domain types. The template is completely provider-agnostic — this skill wires it to a real backend.
---

# Enable Commerce

The shop template ships with a **provider-agnostic commerce layer**. Every route, component, agent tool, MCP endpoint, and UCP handler imports from `@/lib/commerce` and consumes domain types from `@/lib/types`. Nothing knows about any specific backend.

This skill implements a commerce backend against that contract. The coding agent asks which platform, reads the platform's API documentation, and generates the full implementation.

## Step 0 — Ask the user

Before writing any code, ask:

1. **Which commerce platform?** (Shopify, SAP Commerce Cloud, BigCommerce, commercetools, Medusa, Saleor, custom, etc.)
2. **API credentials** — what env vars are needed? Get the names and have the user fill `.env.local`.
3. **Any special requirements?** (B2B pricing, multi-currency, custom checkout flow, etc.)

## Step 1 — Read the contract

Before implementing anything, read these files in order:

1. **`lib/commerce/types.ts`** — the `CommerceProvider` interface. Every operation signature, every param, every return type.
2. **`lib/types.ts`** — every domain type in full. This is the shape contract. Your transforms must produce these exact shapes.
3. **`lib/commerce/providers/stub.ts`** — the stub you're replacing. Lists every operation name.
4. **`lib/cart-cache.ts`** — the cache invalidation function your cart mutations must call.
5. **`lib/constants.ts`** — cache tag names (`TAGS.products`, `TAGS.collections`, `TAGS.cart`).
6. **`lib/i18n.ts`** — how locale works (`Locale` type, `defaultLocale`, `getCountryCode`, `getLanguageCode`).

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
10. `grep -r "@/lib/shopify\|@/lib/commerce/providers/" --include="*.ts" --include="*.tsx" app/ components/ lib/commerce/types.ts lib/commerce/index.ts` returns zero results outside the provider directory
