---
name: enable-shopify-menus
description: Replace the hardcoded nav and footer links with Shopify-managed menus, cached until a protected endpoint refreshes them. Use when the user wants to edit nav or footer links in Shopify admin, or asks for Shopify navigation menus.
---

# Enable Shopify Menus

`Nav` renders inline items (`components/nav/index.tsx`) and `Footer` renders an empty list (`components/footer/index.tsx`), while `QuickLinks`, `MobileMenu`, and `FooterMenu` already take `MenuItem[]` from `lib/menu/types.ts` at three nav levels and two footer levels. Shopify sends no webhook when a menu changes, so a cached read stays until the storefront's protected `POST /api/revalidate` is called with the `menus` tag.

## Before you start

Ask two questions, then wait for the answers.

### 1. Which menus come from Shopify?

Nav, footer, or both.

### 2. Which handles?

Ask for each selected menu; defaults are `main-menu` for nav and `footer` for footer, which every Shopify store starts with.

## 1. Add the menu operation

Create `lib/shopify/operations/menu/server.ts`. Shopify returns absolute item URLs on the store's myshopify or primary domain, sometimes with a Markets locale prefix, so the operation turns those into storefront paths and leaves external links alone:

```ts
import { gql } from "@shopify/hydrogen";

import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { MenuItem } from "@/lib/menu/types";
import { assertStorefrontOk } from "@/lib/shopify/errors/server";
import { storefront } from "@/lib/shopify/storefront/server";

const GET_MENU_QUERY = gql(`#graphql
  query getMenu($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    shop {
      primaryDomain {
        url
      }
    }
    menu(handle: $handle) {
      items {
        id
        title
        url
        items {
          id
          title
          url
          items {
            id
            title
            url
          }
        }
      }
    }
  }
`);

function toStorefrontUrl(url: string | null | undefined, internalHosts: string[]): string {
  if (!url) return "/";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!internalHosts.includes(parsed.hostname)) return url;
  const path = parsed.pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2,4})?(?=\/|$)/i, "") || "/";
  return `${path}${parsed.search}${parsed.hash}`;
}

export async function fetchMenu({
  handle,
  locale = shopConfig.localization,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<MenuItem[] | null> {
  const response = await storefront.request(GET_MENU_QUERY, { locale, variables: { handle } });
  assertStorefrontOk(response, "getMenu");

  const menu = response.data.menu;
  if (!menu || menu.items.length === 0) return null;

  const internalHosts = [
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? "",
    new URL(response.data.shop.primaryDomain.url).hostname,
  ];
  const link = ({ id, title, url }: { id: string; title: string; url?: string | null }) => ({
    id,
    title,
    url: toStorefrontUrl(url, internalHosts),
  });

  return menu.items.map((item) => ({
    ...link(item),
    items: item.items.map((child) => ({
      ...link(child),
      items: child.items.map((leaf) => ({ ...link(leaf), items: [] })),
    })),
  }));
}
```

If you add fields, validate the document with the Shopify AI Toolkit first.

## 2. Cache the menu

Create `lib/menu/server.ts`:

```ts
import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type { MenuItem } from "@/lib/menu/types";
import { fetchMenu } from "@/lib/shopify/operations/menu/server";

export async function getMenu(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<MenuItem[] | null> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("menus");

  return fetchMenu(params);
}
```

## 3. Wire the selected components

Nav: make `Nav` in `components/nav/index.tsx` async, keeping any existing props, and import `getMenu` from `@/lib/menu/server`. Replace the inline default with:

```tsx
const items: MenuItem[] = (await getMenu({ handle: "NAV_HANDLE" }).catch(() => null)) ?? [
  { id: "default-nav-shop", items: [], title: "Shop", url: "/collections/all" },
];
```

Footer: `components/footer/index.tsx` is already async. Import `getMenu` and replace `const items: MenuItem[] = [];` with:

```tsx
const items: MenuItem[] = (await getMenu({ handle: "FOOTER_HANDLE" }).catch(() => null)) ?? [];
```

Substitute the handles the user gave and skip whichever component the user did not select. `QuickLinks`, `MobileMenu`, and `FooterMenu` need no changes; an empty or missing menu hides the footer columns.

## 4. Refresh menus after edits

`app/api/revalidate/route.ts` refreshes the tags it is given, `menus` included, and returns `404` until `REVALIDATE_SECRET` is set. If the storefront has no such route, take it from the template with the `update-shop` skill; do not add a menu-only endpoint.

Tell the user to set `REVALIDATE_SECRET` in the deployment's environment variables, then refresh after editing menus in Shopify admin:

```bash
curl -X POST "https://your-store.example.com/api/revalidate?tag=menus" \
  -H "Authorization: Bearer $REVALIDATE_SECRET"
```

Any scheduler or automation that can send that request can refresh menus on a schedule.

## Verification

- Nav and footer render Shopify menu items, with internal links as storefront paths such as `/collections/all` and external links unchanged.
- A missing or empty menu falls back to the inline items.
- `POST /api/revalidate?tag=menus` returns `404` without `REVALIDATE_SECRET`, `401` with a wrong token, and `200` with `{"revalidated":["menus"]}` with the right one.
- Lint, typecheck, and build pass.

## Guardrails

- Keep the inline fallbacks so a missing menu or Storefront error never leaves a blank nav.
- Keep `cacheLife("max")` with the `menus` tag and refresh through `POST /api/revalidate`; do not shorten the cache life to pick up edits.
- In a localized or Markets-enabled store, pass the commerce locale to `getMenu` from each caller; do not read locale from request headers inside the cached read.
- Fallback labels belong beside the consuming component; Shopify menu translations and storefront fallback copy are separate.
