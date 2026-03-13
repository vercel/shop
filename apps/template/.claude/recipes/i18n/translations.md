# Recipe: Translations (i18n)

> Every user-visible string must be translated. Server components use `getTranslations()`, client components use `useTranslations()`, and UI primitives accept translated text via props.

## When to read this

- Adding new user-visible text (labels, buttons, headings, error messages)
- Creating a new component that displays text
- Adding a new locale
- Debugging missing translations

## Key files

| File | Role |
|------|------|
| `lib/i18n/messages/en.json` | English translations (source of truth for keys) |
| `lib/i18n/messages/de-DE.json` | German translations |
| `lib/i18n/messages/fr-FR.json` | French translations |
| `lib/i18n/messages/nl-NL.json` | Dutch translations |
| `lib/i18n/messages/es-ES.json` | Spanish translations |
| `lib/i18n/request.ts` | Per-request locale resolution and message loading |
| `lib/i18n/routing.ts` | next-intl routing config |
| `lib/i18n.ts` | Locale list, type guards, currency helpers |

## How it works

### Server components

```tsx
import { getTranslations } from "next-intl/server";

export default async function ProductPage() {
  const t = await getTranslations("product");
  return <h1>{t("title")}</h1>;
}
```

### Client components

```tsx
"use client";
import { useTranslations } from "next-intl";

export function AddToCartButton() {
  const t = useTranslations("cart");
  return <button>{t("addToCart")}</button>;
}
```

### UI primitives (components/ui/)

UI primitives in `components/ui/` do NOT call `useTranslations` directly. Instead, they accept translated text via props:

```tsx
// components/ui/product-card.tsx — accepts primitive props
function ProductCardImage({ outOfStockText, ... }: ProductCardImageProps) {
  return <span>{outOfStockText}</span>;
}

// components/product/product-card-featured.tsx — passes translated text
const t = await getTranslations("product");
<ProductCardImage outOfStockText={t("outOfStock")} />
```

This keeps UI primitives locale-agnostic and reusable.

### Message file structure

Messages are organized by namespace:

```json
{
  "nav": {
    "home": "Home",
    "collections": "Collections",
    "search": "Search"
  },
  "product": {
    "addToCart": "Add to cart",
    "outOfStock": "Out of stock",
    "reviews": "{count} reviews"
  },
  "cart": {
    "title": "Shopping Cart",
    "empty": "Your cart is empty"
  }
}
```

Common namespaces: `nav`, `product`, `category`, `search`, `common`, `home`, `cart`, `account`, `footer`.

### Message loading

`lib/i18n/request.ts` loads messages per request:

1. Gets the requested locale from URL params
2. Validates against the routing config
3. Tries `{locale}.json` (e.g., `de-DE.json`)
4. Falls back to `{language}.json` (e.g., `en.json`) if locale-specific file not found

### Type-safe translations

The `next-intl` config in `next.config.ts` generates type declarations from `en.json`:

```tsx
experimental: { createMessagesDeclaration: "./lib/i18n/messages/en.json" },
```

This gives autocomplete and type errors for missing keys.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Every new user-visible string MUST be added to ALL locale files (en.json, de-DE.json, fr-FR.json, nl-NL.json, es-ES.json) — missing keys cause the raw key to show in production
- [ ] GUARDRAIL: Components in `ui/` must NOT call `useTranslations` — accept translated text via props (e.g., `outOfStockText`, `label`, `placeholder`)
- [ ] GUARDRAIL: Never hardcode user-visible text — always use `getTranslations` (server) or `useTranslations` (client)
- [ ] GUARDRAIL: Use the same namespace structure across all locale files — keys must match exactly

## Common modifications

### Adding a new translation key

1. Add the key to `lib/i18n/messages/en.json` in the appropriate namespace
2. Add the same key to ALL other locale files:
   - `de-DE.json`
   - `fr-FR.json`
   - `nl-NL.json`
   - `es-ES.json`
3. Use in component:
   ```tsx
   // Server component
   const t = await getTranslations("myNamespace");
   return <p>{t("myKey")}</p>;

   // Client component
   const t = useTranslations("myNamespace");
   return <p>{t("myKey")}</p>;
   ```

### Adding a new namespace

1. Add the namespace object to ALL locale files:
   ```json
   {
     "myFeature": {
       "title": "My Feature",
       "description": "Description here"
     }
   }
   ```
2. Use with `getTranslations("myFeature")` or `useTranslations("myFeature")`

### Interpolation

Use curly braces for dynamic values:

```json
{ "itemCount": "{count} items in your cart" }
```

```tsx
t("itemCount", { count: 5 })  // "5 items in your cart"
```

## See also

- [Locale Routing](../architecture/locale-routing.md) — How locale flows through the request
- [Compound Components](../architecture/compound-components.md) — Why UI primitives accept text via props
- [Add a New Page](../guides/add-new-page.md) — New pages need translations
