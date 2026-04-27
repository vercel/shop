---
name: enable-shopify-menus
description: Replace the hardcoded nav and footer menus with Shopify-powered menus.
---

# Enable Shopify Menus

By default, the storefront's nav and footer render hardcoded items from `lib/config.ts`. The components themselves (`QuickLinks`, `MobileMenu`, `Footer`'s `FooterMenu`) already consume `MenuItem[]` in Shopify shape and render up to three levels of nesting. This skill swaps the data source from `navItems` / `footerItems` to a live Shopify menu fetched by handle, with a fallback to the hardcoded items if the menu is missing or empty.

## Before you start

Ask the user two questions in order:

### 1. Which menus do you want to fetch from Shopify?

- **Nav menu** — replaces the hardcoded items used by the desktop quick links and mobile sheet.
- **Footer menu** — replaces the hardcoded footer columns.
- **Both**

### 2. What are the Shopify menu handles?

Ask for each selected menu. Defaults: `main-menu` for nav, `footer` for footer.

Wait for the user to answer before proceeding.

---

## Part A: Enable Shopify nav menu

Skip this section if the user did not select the nav menu.

Edit `components/nav/index.tsx`. Add the `getMenu` import and swap the data source:

```tsx
import { getMenu } from "@/lib/shopify/operations/menu";
```

Inside `Nav`, replace `const items = navItems;` with:

```tsx
const menu = await getMenu("NAV_HANDLE", locale);
const items = menu?.items ?? navItems;
```

Replace `"NAV_HANDLE"` with the handle the user provided. `QuickLinks` and `MobileMenu` already accept `MenuItem[]`, so no other component changes are needed. Keep the `navItems` import as the fallback.

---

## Part B: Enable Shopify footer menu

Skip this section if the user did not select the footer menu.

Edit `components/footer/index.tsx`. Make the component async, add the `getMenu` import, and swap the data source:

```tsx
import { getMenu } from "@/lib/shopify/operations/menu";
```

Change the signature to `async` and replace `const items = footerItems;` with:

```tsx
const menu = await getMenu("FOOTER_HANDLE", locale);
const items = menu?.items ?? footerItems;
```

Replace `"FOOTER_HANDLE"` with the handle the user provided. `FooterMenu` already accepts `MenuItem[]`. Keep the `footerItems` import as the fallback.

The `Footer` callsite in `app/layout.tsx` (or wherever it is rendered) already passes `locale`; if it is not wrapped in `<Suspense>`, the menu fetch will block layout render — that is acceptable since `getMenu` is cached with `"use cache: remote"` and `cacheLife("max")`. Wrap in `<Suspense>` only if you specifically want the rest of the page to stream ahead of the footer.

---

## Guardrails

- The `getMenu()` operation in `lib/shopify/operations/menu.ts` already handles caching (`"use cache: remote"`, `cacheTag("menus")`) and URL transformation. Do not duplicate that logic.
- Always preserve the `navItems` / `footerItems` fallback so a missing or empty Shopify menu doesn't leave the user with a blank nav or footer.
- External links (URLs starting with `http`) are handled by the existing `MenuLink` helpers in each component — no change needed.
