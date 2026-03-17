# Recipe: Swap CMS Provider

> Replace the hardcoded homepage content with Contentful, Sanity, Shopify metaobjects, or another CMS by implementing operations that return the same domain types.

## When to read this

- Adding CMS-managed content to the template
- Understanding the CMS boundary and what needs to change
- Evaluating the effort for a CMS integration

## Key files

| File | Role |
|------|------|
| `lib/types.ts` | CMS domain types: `Homepage`, `MarketingPage`, `HeroSection`, `ContentSection` |
| `app/page.tsx` | Homepage (hardcoded content + Shopify product fetches) |
| `lib/content/pages.ts` | Marketing page registry (empty by default) |
| `components/cms/page-renderer.tsx` | `MarketingPageRenderer` — renders `Homepage` / `MarketingPage` domain types |

## The CMS seam

To add CMS support, implement three operations:

```tsx
// These three functions are the entire CMS surface area
getHomepage(locale: string): Promise<Homepage | null>
getMarketingPage(slug: string, locale: string): Promise<MarketingPage | null>
getAllMarketingPageSlugs(): Promise<Array<{ slug: string; updatedAt: string }>>
```

Then update `app/page.tsx` to call `getHomepage()` and render with `MarketingPageRenderer`, and update `app/pages/[slug]/page.tsx` to call `getMarketingPage()`.

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

CMS sections that reference products need those products resolved:

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

### 7. Update routes

Replace the hardcoded homepage in `app/page.tsx`:

```tsx
import { getHomepage } from "@/lib/your-cms/operations/cms";
import { MarketingPageRenderer } from "@/components/cms/page-renderer";

export default async function HomePage() {
  const locale = await getLocale();
  const page = await getHomepage(locale);
  if (!page) return notFound();
  return (
    <Container>
      <MarketingPageRenderer page={page} />
    </Container>
  );
}
```

Update `app/pages/[slug]/page.tsx` and `app/sitemap.ts` to use your CMS operations.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Return the exact domain types from `lib/types.ts` — `Homepage`, `MarketingPage`, `ContentSection`
- [ ] GUARDRAIL: Resolve product references to `ProductCard[]` — components expect ready-to-render product data
- [ ] GUARDRAIL: Handle locale fallback gracefully — return default locale content if requested locale isn't available, never throw
- [ ] GUARDRAIL: Support the `alternates` field on `MarketingPage` — this powers locale-aware URL switching

## See also

- [Type Seams](../architecture/type-seams.md) — The domain type boundary
- [Caching Strategy](../architecture/caching-strategy.md) — Cache profiles for CMS content
