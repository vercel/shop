# Recipe: Add a New Page

> New routes go in `app/` with clean URLs. Locale-aware data should read the current deployment locale via `getLocale()`.

## When to read this

- Creating a new page (e.g., `/wishlist`, `/about`, `/faq`)
- Understanding the route file conventions
- Setting up caching and translations for a new page

## Key files

| File | Role |
|------|------|
| `app/` | All page routes live here |
| `lib/params.ts` | Current deployment locale helper for localized data |
| `lib/i18n/messages/*.json` | Translation files for new page text |

## Step-by-step

### 1. Create the page file

Create `apps/shop/app/your-page/page.tsx`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function YourPage() {
  const t = await getTranslations("yourPage");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### 2. Add translations

Add to ALL locale files (`lib/i18n/messages/`). The storefront runs single-locale by default, but keeping catalogs aligned makes the multi-locale upgrade path mechanical:

**en.json:**
```json
{
  "yourPage": {
    "title": "Your Page",
    "description": "Description here"
  }
}
```

**de-DE.json:**
```json
{
  "yourPage": {
    "title": "Ihre Seite",
    "description": "Beschreibung hier"
  }
}
```

Repeat for `fr-FR.json`, `nl-NL.json`, `es-ES.json`.

### 3. Add caching (if fetching data)

If the page fetches data, use cache directives in your operations:

```tsx
import { getLocale } from "@/lib/params";

export async function getYourPageData(locale: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag("your-page");

  // Fetch data...
}

export default async function YourPage() {
  const locale = await getLocale();
  const data = await getYourPageData(locale);

  // Render data...
}
```

### 4. Link to the page

```tsx
// Correct
<Link href="/your-page">Your Page</Link>

// Wrong — don't hardcode locale prefixes in the default template
<Link href="/en-US/your-page">Your Page</Link>
```

### 5. Add metadata (optional)

```tsx
export async function generateMetadata() {
  const t = await getTranslations("yourPage");

  return {
    title: t("title"),
    description: t("description"),
  };
}
```

### 6. Add to navigation (optional)

If the page should appear in navigation, add it to the Shopify menu or handle it in the navigation component.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Page files go in `app/your-page/page.tsx`
- [ ] GUARDRAIL: Add translations to ALL locale files — missing translations show raw keys
- [ ] GUARDRAIL: Use `getLocale()` when your page fetches localized data — don't infer locale from the pathname in the default template

## Existing routes for reference

```
app/page.tsx                                       → /
app/pages/[slug]/page.tsx                          → /pages/about
app/products/[handle]/page.tsx                     → /products/speaker
app/collections/page.tsx                           → /collections
app/collections/[handle]/page.tsx                  → /collections/electronics
app/search/page.tsx                                → /search
app/cart/page.tsx                                  → /cart
app/login/page.tsx                                 → /login
app/account/page.tsx                               → /account
app/account/orders/page.tsx                        → /account/orders
app/account/orders/[id]/page.tsx                   → /account/orders/123
app/account/addresses/page.tsx                     → /account/addresses
```

## See also

- [Locale Configuration](../architecture/locale-routing.md) — How locale works in the default template
- [Translations](../i18n/translations.md) — Translation patterns
- [Caching Strategy](../architecture/caching-strategy.md) — Cache profiles for your page data
