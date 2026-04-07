---
name: enable-cms
description: Wire a CMS as the content source for homepage and marketing page content. Adds operations for cms_homepage and cms_page content types and transforms them into domain types.
---

# Enable CMS

Add CMS-driven content support to the shop template. This replaces the hardcoded homepage content with CMS-managed content using `cms_homepage` and `cms_page` content types.

## Prerequisites

- A CMS with content types defined for `cms_homepage` and `cms_page`
- API access credentials configured for the CMS

## Content model

### `cms_homepage`

| Field handle       | Type             | Description                          |
| ------------------ | ---------------- | ------------------------------------ |
| `title`            | single_line_text | Page title                           |
| `meta_title`       | single_line_text | SEO title override                   |
| `meta_description` | single_line_text | SEO description override             |
| `hero_headline`    | single_line_text | Hero banner headline                 |
| `hero_subheadline` | single_line_text | Hero banner subheadline              |
| `hero_image`       | file             | Hero background image                |
| `hero_cta_text`    | single_line_text | Hero call-to-action label            |
| `hero_cta_link`    | single_line_text | Hero call-to-action URL              |
| `sections`         | json             | Array of content section definitions |

### `cms_page`

| Field handle       | Type             | Description                          |
| ------------------ | ---------------- | ------------------------------------ |
| `slug`             | single_line_text | URL slug                             |
| `title`            | single_line_text | Page title                           |
| `locale`           | single_line_text | Locale code (e.g. `en-US`)           |
| `meta_title`       | single_line_text | SEO title override                   |
| `meta_description` | single_line_text | SEO description override             |
| `hero_headline`    | single_line_text | Hero banner headline                 |
| `hero_subheadline` | single_line_text | Hero banner subheadline              |
| `hero_image`       | file             | Hero background image                |
| `hero_cta_text`    | single_line_text | Hero call-to-action label            |
| `hero_cta_link`    | single_line_text | Hero call-to-action URL              |
| `sections`         | json             | Array of content section definitions |

## Implementation steps

### 1. Create CMS operations

Create operations that return domain types from `lib/types.ts`. The implementation depends on your CMS provider (Contentful, Sanity, Strapi, etc.):

```ts
import type { Homepage, MarketingPage } from "@/lib/types";

export async function getHomepage(locale: string): Promise<Homepage | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms-content");
  // Query cms_homepage content type, transform to Homepage type
}

export async function getMarketingPage(
  slug: string,
  locale: string,
): Promise<MarketingPage | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms-content");
  // Query cms_page content type by slug, transform to MarketingPage type
}

export async function getAllMarketingPageSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("cms-content");
  // Query all cms_page entries, return slugs
}
```

### 2. Write API queries

Reference your CMS provider's API documentation. Query `cms_homepage` and `cms_page` content types with locale-aware parameters.

### 3. Transform CMS responses

Create transforms to convert raw CMS responses into the domain types:

- Parse the `sections` JSON field into `ContentSection[]`
- Resolve product references in sections to `ProductCard[]` using `getProductsByIds`
- Map hero fields to `HeroSection`
- Map image references to `MarketingImage`

### 4. Wire into routes

Update `app/page.tsx` to use the CMS operation:

```ts
import { getHomepage } from "@/lib/cms/operations";
import { MarketingPageRenderer } from "@/components/cms/page-renderer";

export default async function HomePage() {
  const locale = await getLocale();
  const page = await getHomepage(locale);
  if (!page) return <FallbackHomepage />;
  return (
    <Container>
      <MarketingPageRenderer page={page} />
    </Container>
  );
}
```

Update `app/pages/[slug]/page.tsx` and `app/sitemap.ts` to use `getMarketingPage` and `getAllMarketingPageSlugs`.

### 5. Add cache invalidation webhook

Create `app/api/webhooks/cms/route.ts`:

```ts
import { updateTag } from "next/cache";

export async function POST(request: Request) {
  // Verify webhook signature from your CMS provider
  updateTag("cms-content");
  return new Response("OK");
}
```

## Guardrails

- Return the exact domain types from `lib/types.ts` -- `Homepage`, `MarketingPage`, `ContentSection`.
- Resolve product references to `ProductCard[]` -- components expect ready-to-render product data.
- Handle locale fallback gracefully -- return default locale content if requested locale is unavailable, never throw.
- Support the `alternates` field on `MarketingPage` -- this powers locale-aware URL switching.
