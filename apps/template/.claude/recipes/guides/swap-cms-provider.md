# Recipe: Swap CMS Provider

> Replace Shopify metaobject CMS with Contentful, Sanity, or another CMS by implementing operations that return the same domain types.

## When to read this

- Replacing Shopify metaobjects with a headless CMS
- Understanding the CMS boundary and what needs to change
- Evaluating the effort for a CMS swap

## Key files

| File | Role |
|------|------|
| `lib/types.ts` | CMS domain types: `Homepage`, `MarketingPage`, `HeroSection`, `ContentSection` |
| `lib/shopify/operations/cms.ts` | Current CMS operations to replace |
| `lib/shopify/transforms/cms.ts` | Current transform utilities |

## The CMS seam

CMS content is isolated to three operations:

```tsx
// These three functions are the entire CMS surface area
getHomepage(locale: string): Promise<Homepage | null>
getMarketingPage(slug: string, locale: string): Promise<MarketingPage | null>
getAllMarketingPageSlugs(): Promise<Array<{ slug: string; updatedAt: string }>>
```

Replace these three functions, and the rest of the app works unchanged.

## Step-by-step

### 1. Create your CMS client

```
lib/your-cms/
  client.ts              ← CMS SDK/API client
  operations/cms.ts      ← Implement the three operations
  transforms/cms.ts      ← Transform CMS responses → domain types
```

### 2. Implement the three operations

#### `getHomepage(locale)`

Must return `Homepage | null`:

```tsx
export interface Homepage {
  id: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  heroSection: HeroSection | null;
  sections: ContentSection[];
  publishedAt: string;
}
```

#### `getMarketingPage(slug, locale)`

Must return `MarketingPage | null`:

```tsx
export interface MarketingPage {
  id: string;
  locale: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  alternates: Record<Locale, string | null>;  // Locale → slug mapping
  heroSection: HeroSection | null;
  sections: ContentSection[];
  publishedAt: string;
}
```

#### `getAllMarketingPageSlugs()`

Must return slugs for static generation:

```tsx
Promise<Array<{ slug: string; updatedAt: string }>>
```

### 3. Map your CMS content model

Map your CMS content types to these domain types:

**HeroSection:**
```tsx
interface HeroSection {
  id: string;
  headline: string;
  subheadline: string | null;
  backgroundImage: MarketingImage | null;
  ctaText: string | null;
  ctaLink: string | null;
}
```

**ContentSection:**
```tsx
interface ContentSection {
  id: string;
  blockType: ContentBlockType;  // "featured-products" | "promo-banner" | "rich-text" | ...
  title: string | null;
  content: CmsRichText | null;
  media: MarketingImage[];
  products: ProductCard[];      // Resolved product references
  settings: Record<string, unknown>;
}
```

**Important**: `ContentSection.products` expects resolved `ProductCard[]` data. If your CMS stores product references, you'll need to resolve them by calling product operations.

### 4. Handle product references

CMS sections that reference products need those products resolved. In the current implementation, `operations/cms.ts` fetches referenced products inline. Your implementation should do the same:

```tsx
// Resolve product references from CMS to ProductCard[]
import { getProductsByIds } from "@/lib/shopify/operations/products";

async function resolveProducts(productIds: string[], locale: string): Promise<ProductCard[]> {
  if (!productIds.length) return [];
  return getProductsByIds(productIds, locale);
}
```

Note: Product fetching stays on Shopify (or your commerce provider) even when CMS changes.

### 5. Add caching

```tsx
export async function getHomepage(locale: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms-content");
  // ...fetch from CMS
}
```

### 6. Set up webhooks

Create a webhook endpoint for your CMS to invalidate cache on content changes:

```tsx
// app/api/webhooks/your-cms/route.ts
import { updateTag } from "next/cache";

export async function POST(request: Request) {
  // Verify webhook signature
  // ...
  updateTag("cms-content");
  return new Response("OK");
}
```

### 7. Update imports

Only two places import from CMS operations:

```bash
grep -r "operations/cms" apps/shop/ --include="*.ts" --include="*.tsx"
```

Update these imports to point to your new CMS operations.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Return the exact domain types from `lib/types.ts` — `Homepage`, `MarketingPage`, `ContentSection`
- [ ] GUARDRAIL: Resolve product references to `ProductCard[]` — components expect ready-to-render product data
- [ ] GUARDRAIL: Handle locale fallback gracefully — return default locale content if requested locale isn't available, never throw
- [ ] GUARDRAIL: Support the `alternates` field on `MarketingPage` — this powers locale-aware URL switching

## See also

- [Metaobject CMS](../cms/metaobject-cms.md) — Current CMS implementation reference
- [Type Seams](../architecture/type-seams.md) — The domain type boundary
- [Caching Strategy](../architecture/caching-strategy.md) — Cache profiles for CMS content
