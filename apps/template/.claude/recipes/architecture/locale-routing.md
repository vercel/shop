# Recipe: Locale Configuration

> The storefront currently runs single-locale with clean URLs (`/products/...`). Locale is deployment config today, with a documented path to add locale-prefixed routing later.

## When to read this

- Building navigation links or `router.push()` calls
- Debugging 404s or redirect loops
- Adding a new locale
- Planning a future move to locale-prefixed URLs

## Key files

| File | Role |
|------|------|
| `next.config.ts` | Variant URL rewrites |
| `lib/i18n.ts` | Locale catalog, default locale, enabled locales, currency/country helpers |
| `lib/params.ts` | Current deployment locale helper used by pages and operations |
| `lib/i18n/request.ts` | `next-intl` request config and message loading |
| `lib/i18n/messages/*.json` | Translation files (en.json, de-DE.json, fr-FR.json, nl-NL.json, es-ES.json) |
| `.claude/skills/add-locale-url-prefix.md` | Documented migration path to locale-prefixed URLs |

## How it works

### Current request lifecycle

```
GET /products/speaker
    ↓
app/products/[handle]/page.tsx
    ↓ getLocale() resolves the current deployment locale
    ↓ Commerce operations receive that locale
```

There is no `proxy.ts` by default — add one when locale-prefixed routing is needed.

### Current locale model

`lib/i18n.ts` keeps a broad locale catalog, but the default template enables only one locale:

```tsx
export const locales = ["en-US", "en-GB", "de-DE", "fr-FR", "nl-NL", "es-ES"] as const;
export const defaultLocale = "en-US";
export const enabledLocales = [defaultLocale];
```

That means:

- URLs stay unprefixed
- `getLocale()` resolves to the deployment locale
- `next-intl` loads messages for that locale
- Commerce operations derive country/language context from that locale

### File system structure vs URL structure

```
File:  app/products/[handle]/page.tsx
URL:   /products/speaker
Link:  <Link href="/products/speaker">
```

Page files live directly under `app/...` and links should use clean, unprefixed paths.

### Future upgrade path

When you are ready to add true multi-locale routing:

- Start with `.claude/skills/add-locale-url-prefix.md`.
- Move routes under `app/[locale]/`.
- Teach `getLocale()` and `lib/i18n/request.ts` to resolve locale from the request instead of always using the deployment default.
- Add locale-aware navigation and SEO alternates.
- Only expose locale switching UI once at least two locales are fully wired end-to-end.

## GUARDRAILS

> These rules are non-negotiable. Violating them will break the application.

- [ ] GUARDRAIL: Page files live directly under `app/...` in the default template
- [ ] GUARDRAIL: Links should use clean, unprefixed paths such as `/products/speaker`
- [ ] GUARDRAIL: When fetching localized commerce data, pass the locale from `getLocale()` instead of hardcoding a region
- [ ] GUARDRAIL: Every new locale still needs a corresponding message file in `lib/i18n/messages/` — the upgrade path depends on catalogs staying aligned

## Common modifications

### Adding a new locale

1. Add to `lib/i18n.ts`:
   ```tsx
   export const locales = ["en-US", "en-GB", "de-DE", "fr-FR", "nl-NL", "es-ES", "ja-JP"] as const;
   ```
2. Add currency data in the `localeCurrency` map in `lib/i18n.ts`
3. Add the locale to `enabledLocales` only when that locale is actually ready to ship
4. Create `lib/i18n/messages/ja-JP.json` with all translation keys (copy from `en.json` as starting point)
5. If your commerce provider has market support, update `getCountryCode`/`getLanguageCode` helpers if needed
6. If you want locale-prefixed URLs, follow `.claude/skills/add-locale-url-prefix.md` instead of patching routing ad hoc

### Constructing links

```tsx
// Correct
<Link href="/products/speaker">

// Correct — programmatic navigation
router.push("/products/speaker");

// WRONG — don't hardcode locale prefixes in the default template
<Link href="/en-US/products/speaker">
```

## See also

- [Translations](../i18n/translations.md) — How translation strings work with locales
- [Add a New Page](../guides/add-new-page.md) — Creating routes with the default clean URL structure
