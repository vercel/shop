# Recipe: Metaobject CMS

> The CMS uses Shopify metaobjects for homepage and marketing page content, with transforms converting them to domain types.

## When to read this

- Modifying homepage or marketing page content structure
- Adding a new content block type
- Debugging CMS content not showing up
- Understanding how metaobjects map to page sections

## Key files

| File | Role |
|------|------|
| `lib/shopify/operations/cms.ts` | CMS operations — queries + inline transforms (485 lines) |
| `lib/shopify/transforms/cms.ts` | Shared CMS transform utilities |
| `lib/types.ts` | Domain types: `Homepage`, `MarketingPage`, `HeroSection`, `ContentSection` |
| `docs/cms-metaobjects.md` | Complete reference for metaobject types and fields |

## How it works

### Metaobject types

Shopify metaobjects serve as a headless CMS:

| Metaobject type | Purpose |
|----------------|---------|
| `cms_homepage` | Homepage content (one per store) |
| `cms_page` | Marketing pages with locale variants |
| `cms_hero` | Hero blocks (background image, headline, CTA) |
| `cms_section` | Reusable content sections (block type, media, products) |

### Content structure

```
Homepage / Marketing Page
  ├── Hero Section (cms_hero metaobject)
  │     ├── headline
  │     ├── subheadline
  │     ├── backgroundImage
  │     ├── ctaText
  │     └── ctaLink
  └── Content Sections[] (cms_section metaobjects)
        ├── blockType (featured-products, promo-banner, rich-text, etc.)
        ├── title
        ├── content (rich text JSON)
        ├── media[] (images)
        ├── products[] (product references)
        └── settings (JSON config)
```

### Content block types

```tsx
type ContentBlockType =
  | "featured-products"   // Product carousel/grid
  | "promo-banner"        // Banner with image + text
  | "rich-text"           // Rich text content
  | "image-gallery"       // Image gallery
  | "product-grid"        // Product grid layout
  | "products";           // Generic products section
```

### Operations

```tsx
// Fetch homepage content
const homepage = await getHomepage(locale);
// Returns: Homepage { id, title, heroSection, sections[], ... }

// Fetch marketing page by slug
const page = await getMarketingPage("about-us", locale);
// Returns: MarketingPage { id, slug, heroSection, sections[], alternates, ... }

// Get all page slugs for static generation
const slugs = await getAllMarketingPageSlugs();
```

### Locale handling

Marketing pages support per-locale slug variants. The `alternates` field maps locales to their slugs:

```tsx
interface MarketingPage {
  // ...
  alternates: Record<Locale, string | null>;  // { "en-US": "about", "de-DE": "ueber-uns" }
}
```

The CMS operations handle locale fallback — if a locale-specific version doesn't exist, they fall back to the default.

### Transform pipeline

CMS transforms happen inline in `operations/cms.ts` rather than in a separate transforms file:

1. Query Shopify for metaobject data
2. Transform hero section (extract image, text fields)
3. Transform content sections (parse block types, resolve product references)
4. Return domain types (`Homepage` or `MarketingPage`)

Shared utilities in `lib/shopify/transforms/cms.ts`:
- `transformMediaImage()` — Converts Shopify media image to `MarketingImage`
- `parseJson()` — Safe JSON parsing for metaobject JSON fields
- `normalizeBlockType()` — Maps raw block type strings to `ContentBlockType`

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: CMS operations must handle missing locale gracefully — fall back to default locale content, never throw on missing translations
- [ ] GUARDRAIL: Block types must be normalized via `normalizeBlockType()` — unknown block types default to `"rich-text"` to prevent rendering errors
- [ ] GUARDRAIL: Product references in CMS sections must be resolved to `ProductCard` type — raw Shopify product IDs won't work in components

## Common modifications

### Adding a new content block type

1. Add the type to `ContentBlockType` in `lib/types.ts`:
   ```tsx
   export type ContentBlockType = "featured-products" | "promo-banner" | ... | "video";
   ```
2. Add the case to `normalizeBlockType()` in `lib/shopify/transforms/cms.ts`
3. Handle the new type in the section renderer component
4. Create the metaobject definition in Shopify admin

### Modifying homepage content

Content is managed in Shopify admin under **Content > Metaobjects**. To add new fields:

1. Update the metaobject definition in Shopify admin
2. Update the GraphQL query in `operations/cms.ts`
3. Update the transform logic to handle the new field
4. Update `Homepage` or `ContentSection` type in `lib/types.ts`

## See also

- [Swap CMS Provider](../guides/swap-cms-provider.md) — Replace metaobjects with Contentful/Sanity
- [Type Seams](../architecture/type-seams.md) — CMS domain types
- [GraphQL Operations](../shopify/graphql-operations.md) — Query patterns
