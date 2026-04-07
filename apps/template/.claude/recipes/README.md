# Commerce Recipes

> Task → recipe routing table. Read the recipe before modifying the system it describes.

## Quick reference

| I want to... | Read this recipe |
|--------------|-----------------|
| **Modify cart behavior** (add/update/remove) | [Optimistic Cart](cart/optimistic-cart.md), [Cart Actions](cart/cart-actions.md) |
| **Add a new page** | [Add New Page](guides/add-new-page.md), [Locale Routing](architecture/locale-routing.md) |
| **Add a product field** (metafield, attribute) | [Add New Product Field](guides/add-new-product-field.md) |
| **Create a UI component** | [Add UI Component](guides/add-ui-component.md), [Compound Components](architecture/compound-components.md) |
| **Write a commerce provider query** | [Commerce Operations](commerce/operations.md) |
| **Add translation strings** | [Translations](i18n/translations.md) |
| **Understand the data flow** | [Data Flow](architecture/data-flow.md) |
| **Understand caching** | [Caching Strategy](architecture/caching-strategy.md) |
| **Swap commerce providers** | [Swap Commerce Provider](guides/swap-commerce-provider.md), [Type Seams](architecture/type-seams.md) |
| **Add a CMS** to the homepage | [Swap CMS Provider](guides/swap-cms-provider.md) |
| **Add shipping estimates** to storefront | [Add Shipping](guides/add-shipping.md) |
| **Debug stale data** | [Caching Strategy](architecture/caching-strategy.md), [Cart Actions](cart/cart-actions.md) |
| **Add a new locale** | [Locale Routing](architecture/locale-routing.md), [Translations](i18n/translations.md) |

## Recipe index

### Architecture

| Recipe | Purpose |
|--------|---------|
| [Data Flow](architecture/data-flow.md) | Request lifecycle: proxy → page → operation → API → transform → render |
| [Type Seams](architecture/type-seams.md) | Domain types vs provider types, the swappable boundary |
| [Caching Strategy](architecture/caching-strategy.md) | `"use cache"`, cacheLife profiles, cacheTag, invalidation via webhooks |
| [Locale Routing](architecture/locale-routing.md) | proxy.ts, next-intl, never-link-to-root |
| [Compound Components](architecture/compound-components.md) | `ui/` → `product/` → backwards-compat three-layer pattern |

### Cart

| Recipe | Purpose |
|--------|---------|
| [Optimistic Cart](cart/optimistic-cart.md) | Debounce, request versioning, leading-edge, `optimistic-` prefix |
| [Cart Actions](cart/cart-actions.md) | Server actions, `updateTag()` requirement |

### Commerce

| Recipe | Purpose |
|--------|---------|
| [Commerce Operations](commerce/operations.md) | Operation patterns, caching, transforms pipeline |

### i18n

| Recipe | Purpose |
|--------|---------|
| [Translations](i18n/translations.md) | `getTranslations`/`useTranslations`, all-locale requirement |

### Guides

| Recipe | Purpose |
|--------|---------|
| [Add New Product Field](guides/add-new-product-field.md) | End-to-end: provider → fragment → transform → type → component |
| [Add New Page](guides/add-new-page.md) | New route with locale/caching/translations |
| [Add UI Component](guides/add-ui-component.md) | Compound component following shadcn conventions |
| [Swap Commerce Provider](guides/swap-commerce-provider.md) | Replace the commerce provider with another |
| [Swap CMS Provider](guides/swap-cms-provider.md) | Add CMS to the hardcoded homepage |
| [Add Shipping](guides/add-shipping.md) | Add pre-checkout shipping estimation UI |
